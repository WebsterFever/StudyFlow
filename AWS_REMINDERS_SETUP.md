# AWS Email Reminders — Deployment Runbook

SES sending, the backend, and the frontend are fully built, deployed, and
verified working (see the reference section at the bottom — real test emails
have been sent and received). The only piece left is creating the Lambda and
EventBridge schedule that call the backend automatically, on a timer, forever
— that requires IAM/Lambda/Scheduler permissions I don't have with the
credentials available to me (only a locked-down SES-send-only user), and it
needs your AWS account either way. Follow steps 4-5 below and reminders start
firing on their own, with no browser, computer, or manual trigger needed.

**Architecture:**

```
EventBridge Scheduler (rate(5 minutes), ONE schedule for every user/goal)
  → Lambda "studyflow-reminder-trigger" (aws/reminder-trigger/index.mjs, thin, no business logic)
    → POST https://backend-production-d3c5.up.railway.app/internal/reminders/process
      (Authorization: Bearer REMINDER_JOB_SECRET)
      → NestJS backend queries Postgres, decides which goals are actually due
        (each goal's own reminderIntervalMinutes — 5/10/15/30/60/120/240/360/720/1440 —
        is compared against lastReminderSentAt; the 5-minute scheduler tick is just
        how often the check happens, not how often any single goal gets emailed)
        → atomically claims each due goal, calls AWS SES, updates lastReminderSentAt
          only on a successful send (claim is released if the send fails)
```

Why 5 minutes and not 2 hours: the shared scheduler must run at least as
often as the *shortest* interval a user can pick (5 minutes), otherwise a
goal configured for "every 5 minutes" would never actually get checked that
often. The backend — not the scheduler — decides who's actually due on every
tick, so a goal set to "every 2 hours" still only gets emailed roughly every
2 hours even though the scheduler itself ticks every 5 minutes.

Estimated time: 15-20 minutes. Requires the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
configured with an account that has IAM/Lambda/EventBridge Scheduler
permissions (your main account login is fine for *running these setup
commands* — the resources you create will each get their own
minimal-privilege role, same as the SES-sender user already in place).

Replace `REGION` (e.g. `us-east-1`) and `ACCOUNT_ID` (12-digit, from
`aws sts get-caller-identity`) everywhere below.

---

## Already done (steps 1-3 — skip unless starting fresh)

SES sending is verified and live: `webster.fievre@al.infnet.edu.br` is the
confirmed sender identity, `SES_FROM_EMAIL`/`AWS_ACCESS_KEY_ID`/
`AWS_SECRET_ACCESS_KEY`/`AWS_REGION` are all set on Railway, and real test
emails have been sent and received. Steps 1-3 are left below only as
reference / for setting this up in a fresh AWS account. **Jump straight to
step 4** to finish the remaining automatic-scheduling piece.

## 1. Verify a sending identity in SES

SES starts every new account in the **sandbox**: you can only send to
addresses you've also verified, and volume is capped. That's fine to start
(you'll verify your own email as both sender and test recipient), but if you
want reminders to reach arbitrary user emails in production you'll need to
request production access (step 1c).

**1a. Verify the "from" address** (the address StudyFlow's emails will come from):

```bash
aws ses verify-email-identity --email-address you@yourdomain.com --region REGION
```

Check your inbox for an email from AWS and click the confirmation link.
Confirm it went through:

```bash
aws ses get-identity-verification-attributes --identities you@yourdomain.com --region REGION
```

Look for `"VerificationStatus": "Success"`.

**1b. While in the sandbox**, also verify every recipient address you intend
to test with (e.g. your own inbox), the same way — `verify-email-identity` on
each one, click the link.

**1c. To send to any user without pre-verifying them** (needed once you have
real users signing up), request production access: SES Console → **Account
dashboard** → **Request production access**. AWS reviews this manually
(usually same-day to 24h) — describe the use case as "transactional study
reminder emails triggered by user-configured settings, low volume."
Domain verification (instead of single-email) is worth doing here too if you
own a domain — it lets you send from any address `@yourdomain.com` and looks
more legitimate to spam filters. See `aws ses verify-domain-identity`.

---

## 2. Create the backend's SES-sending IAM user

This is a narrow-purpose credential: it can only call `ses:SendEmail` /
`ses:SendRawEmail`, and only for the identity you verified above. It's what
goes into Railway's `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

```bash
aws iam create-user --user-name studyflow-ses-sender
```

Edit `aws/reminder-trigger/ses-send-policy.json` — replace `REGION`,
`ACCOUNT_ID`, and `YOUR_VERIFIED_DOMAIN_OR_EMAIL` with your real values (e.g.
`identity/you@yourdomain.com`), then:

```bash
aws iam put-user-policy \
  --user-name studyflow-ses-sender \
  --policy-name StudyFlowSesSendOnly \
  --policy-document file://aws/reminder-trigger/ses-send-policy.json

aws iam create-access-key --user-name studyflow-ses-sender
```

Save the `AccessKeyId` and `SecretAccessKey` from the output — you won't be
able to retrieve the secret again (you'd have to rotate it).

**Do not** use your root account or an `AdministratorAccess` user for this —
this dedicated user can only send email from one identity, nothing else.

---

## 3. Set the new variables on Railway

`REMINDER_JOB_SECRET` and `DB_SYNCHRONIZE=false` are already set (I did this
as part of deployment). Add the SES credentials:

```bash
railway variables --set "AWS_REGION=REGION" \
  --set "AWS_ACCESS_KEY_ID=<from step 2>" \
  --set "AWS_SECRET_ACCESS_KEY=<from step 2>" \
  --set "SES_FROM_EMAIL=you@yourdomain.com" \
  --service backend --environment production
```

(Or set them in the Railway dashboard under the `backend` service → Variables.
Either way this triggers a redeploy — that's expected.)

Confirm the backend picked them up — the "AWS SES is not configured" warning
should disappear from the boot logs:

```bash
railway logs --service backend --environment production
```

You should instead see no EmailService warning at all (it only logs when
misconfigured).

---

## 4. Package and create the Lambda function

From the repo root:

```bash
cd aws/reminder-trigger
zip -r function.zip index.mjs package.json
```

(On Windows without `zip`, use `Compress-Archive -Path index.mjs,package.json -DestinationPath function.zip` in PowerShell.)

Create the execution role (the Lambda needs *no* AWS permissions beyond basic
CloudWatch logging — it never touches SES or the database directly):

```bash
aws iam create-role \
  --role-name studyflow-reminder-lambda-role \
  --assume-role-policy-document file://lambda-trust-policy.json

aws iam attach-role-policy \
  --role-name studyflow-reminder-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Create the function:

```bash
aws lambda create-function \
  --function-name studyflow-reminder-trigger \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/studyflow-reminder-lambda-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --region REGION
```

Set its environment variables (the shared secret must match Railway's
`REMINDER_JOB_SECRET` exactly — reuse the value already set there, don't
generate a new one):

```bash
aws lambda update-function-configuration \
  --function-name studyflow-reminder-trigger \
  --environment "Variables={STUDYFLOW_API_URL=https://backend-production-d3c5.up.railway.app,REMINDER_JOB_SECRET=<same value as Railway's REMINDER_JOB_SECRET>}" \
  --region REGION
```

To read back the exact value currently set on Railway:

```bash
railway variables --service backend --environment production --kv | grep REMINDER_JOB_SECRET
```

Test it manually before wiring up the schedule:

```bash
aws lambda invoke --function-name studyflow-reminder-trigger --region REGION out.json
cat out.json
```

You should get back the same `{"processed":...,"sent":...,...}` shape you saw
when this was curl-tested directly against the backend.

---

## 5. Create the EventBridge schedule (exactly one, for all users)

This is the piece that must NOT be duplicated per goal or per user — one
schedule, calling one Lambda, every 5 minutes, forever.

```bash
aws iam create-role \
  --role-name studyflow-reminder-scheduler-role \
  --assume-role-policy-document file://scheduler-trust-policy.json
```

Edit `scheduler-invoke-policy.json` — replace `REGION`/`ACCOUNT_ID` — then:

```bash
aws iam put-role-policy \
  --role-name studyflow-reminder-scheduler-role \
  --policy-name InvokeStudyFlowReminderLambdaOnly \
  --policy-document file://scheduler-invoke-policy.json

aws scheduler create-schedule \
  --name studyflow-reminder-schedule \
  --schedule-expression "rate(5 minutes)" \
  --flexible-time-window '{"Mode":"OFF"}' \
  --target "{\"Arn\":\"arn:aws:lambda:REGION:ACCOUNT_ID:function:studyflow-reminder-trigger\",\"RoleArn\":\"arn:aws:iam::ACCOUNT_ID:role/studyflow-reminder-scheduler-role\"}" \
  --region REGION
```

This fires every 5 minutes regardless of any individual goal's chosen
interval (5/10/15/30/60/120/240/360/720/1440 minutes) — the backend's
`isDue()` check (comparing `lastReminderSentAt` against each goal's own
`reminderIntervalMinutes`) is what actually decides who gets emailed on any
given tick. A 5-minute schedule is the finest granularity any goal can be
configured for, so this cadence is sufficient for every interval option —
a goal set to "every 2 hours" will still only be emailed roughly every 2
hours, just checked (and found not-due) every 5 minutes in between.

Once created, confirm it's live:

```bash
aws scheduler get-schedule --name studyflow-reminder-schedule --region REGION
```

`State` should be `ENABLED`. From this point on, reminders fire completely
on their own — no browser tab, no running computer, no manual curl.

---

## 6. Verify end-to-end

1. Log into StudyFlow, create or edit a goal, turn on "Remind me about this
   goal" with a short interval (5 or 10 minutes, for fast testing) — save.
2. In Settings, set your timezone and (optionally) quiet hours.
3. Wait up to 5 minutes (one scheduler tick) — a real email should land in
   your inbox with no manual trigger at all. Don't run the Lambda or curl
   yourself for this check — the whole point is confirming it happens
   without you.
4. Check `railway logs` for `[RemindersService]` lines — should show the
   goal picked up, an email attempted, and `lastReminderSentAt` updated only
   on success.
5. Wait for the next tick before the interval elapses — the same goal should
   be correctly skipped (`skippedNotDue` in the response/logs), since
   `lastReminderSentAt` was just set and the interval hasn't passed yet.
   Then wait until the interval *has* elapsed — it should send again on its
   own, still with no manual trigger.
6. Change the interval to something longer (e.g. 2 hours) and save — confirm
   emails stop arriving every 5 minutes and only resume once the full 2
   hours has passed, even though the scheduler keeps ticking every 5 minutes
   underneath.
7. Mark the goal "completed" from the Goals page — it should stop
   permanently (excluded by the `status: 'active'` filter on every future
   tick, forever, not just until the next scheduled email).
8. Set the goal to "paused" — same result, no emails while paused. Reopen it
   to "active" — it becomes eligible again based on its interval.
9. Turn on quiet hours covering the current time in your timezone — a due
   reminder during that window should be skipped (`skippedQuietHours`), with
   `lastReminderSentAt` untouched so it sends on the first eligible tick
   after quiet hours end.
10. Create two active, reminder-enabled goals with different intervals on
    the same account — confirm each is evaluated independently, and when
    both happen to be due on the same tick, exactly one consolidated email
    arrives listing both.

If step 3 doesn't deliver anything after 5-10 minutes, check `railway logs`
for an SES error, and separately check CloudWatch Logs for the Lambda
function (`/aws/lambda/studyflow-reminder-trigger`) to confirm EventBridge
is actually invoking it on schedule.

---

## Reference: what's already done for you

- **Backend**: `EmailModule`/`EmailService` (SES client), `RemindersModule`
  (`POST /internal/reminders/process`, guarded by `InternalSecretGuard`
  comparing a bearer token against `REMINDER_JOB_SECRET` with a timing-safe
  check), minute-granularity due/quiet-hours/consolidation logic in
  `RemindersService` with atomic per-goal claiming (a conditional UPDATE
  reserves a goal before sending, so an overlapping Lambda retry or double
  EventBridge invocation can never send the same reminder twice — a failed
  send releases the claim so the next tick retries it), DB columns added via
  TypeORM migrations (not `synchronize`) — all deployed and live at
  `https://backend-production-d3c5.up.railway.app`.
- **Frontend**: per-goal reminder toggle + interval picker (5/10/15/30 min,
  1/2/4/6/12/24 hours) in the goal form, last-reminder-sent display, a note
  that reminders continue automatically while the goal stays active, and a
  Settings page section for timezone + quiet hours — all deployed.
- **Lambda source**: `aws/reminder-trigger/index.mjs` — zero dependencies,
  just relays to the backend endpoint above. Doesn't need to change for the
  5-minute cadence — it's already just a thin relay with no interval logic
  of its own.
- **IAM policy templates**: `aws/reminder-trigger/*.json` — referenced by
  the exact commands above.
- **What I verified live**: SES sending works end-to-end — a real reminder
  email for an actual goal was sent and received from the verified
  `webster.fievre@al.infnet.edu.br` identity; the atomic-claim rewrite was
  deployed and confirmed via the live response shape
  (`{processed, due, usersEmailed, sent, skipped, failed}`); the internal
  endpoint correctly returns 401 without/with-wrong `Authorization`, 200
  with the right secret; a completed goal is correctly excluded from the
  reminder query even with `reminderEnabled: true`; invalid timezones and
  invalid interval values are rejected with 400s; the original Gmail
  self-spoofing delivery failure (sending "From" the same `@gmail.com`
  address as the recipient) was diagnosed and fixed by switching to a
  separate verified sender identity.
- **What I could not do** (needs your AWS account, not just credentials I
  could be handed): create the Lambda function, its execution role, and the
  EventBridge schedule (steps 4-5) — these require IAM/Lambda/Scheduler
  write permissions that the SES-sender credential deliberately doesn't
  have, and reasonably shouldn't. Every manual `curl`/Lambda-invoke test run
  so far has proven the *logic* is correct; steps 4-5 are what turns that
  into something that runs by itself, forever, without me or you triggering
  it.
