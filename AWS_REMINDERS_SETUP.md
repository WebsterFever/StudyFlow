# AWS Email Reminders — Deployment Runbook

The code is fully built and already deployed to Railway. What's left requires
your AWS account and a click on a verification email — neither of which I can
do for you. Follow this top to bottom and reminders will start working.

**Architecture** (for reference):

```
EventBridge Scheduler (rate(2 hours), ONE schedule)
  → Lambda "studyflow-reminder-trigger" (aws/reminder-trigger/index.mjs, thin, no business logic)
    → POST https://backend-production-d3c5.up.railway.app/internal/reminders/process
      (Authorization: Bearer REMINDER_JOB_SECRET)
      → NestJS backend queries Postgres, decides who's due, calls AWS SES
        → updates lastReminderSentAt only on a successful send
```

Estimated time: 20-30 minutes. Requires the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
configured with an account that has IAM/SES/Lambda/EventBridge permissions
(your main account login is fine for *running these setup commands* — the
resources you create will each get their own minimal-privilege role).

Replace `REGION` (e.g. `us-east-1`) and `ACCOUNT_ID` (12-digit, from
`aws sts get-caller-identity`) everywhere below.

---

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
schedule, calling one Lambda, every 2 hours, forever.

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
  --schedule-expression "rate(2 hours)" \
  --flexible-time-window '{"Mode":"OFF"}' \
  --target "{\"Arn\":\"arn:aws:lambda:REGION:ACCOUNT_ID:function:studyflow-reminder-trigger\",\"RoleArn\":\"arn:aws:iam::ACCOUNT_ID:role/studyflow-reminder-scheduler-role\"}" \
  --region REGION
```

This fires every 2 hours regardless of any individual goal's chosen interval
(2/4/6/12/24h) — the backend's `isDue()` check (comparing `lastReminderSentAt`
against each goal's own `reminderIntervalHours`) is what actually decides
who gets emailed on any given run. A 2-hour tick is the finest granularity
any goal can be configured for, so this cadence is sufficient for every
interval option.

---

## 6. Verify end-to-end

1. Log into StudyFlow, create or edit a goal, turn on "Remind me about this
   goal" with a short interval (2h) — save.
2. In Settings, set your timezone and (optionally) quiet hours.
3. Manually invoke the Lambda once (`aws lambda invoke ...` as in step 4) —
   with SES now configured, a real email should land in your inbox (only
   works today if your account is still sandboxed and you verified your own
   address as a recipient in step 1b).
4. Check `railway logs` for the `[RemindersService]` log lines — should show
   the goal being picked up, an email attempted, and `lastReminderSentAt`
   updated only if the send succeeded.
5. Re-invoke the Lambda immediately — the same goal should now be correctly
   skipped as "not due yet" (log line `skippedNotDue`), since `lastReminderSentAt`
   was just set and the 2h interval hasn't elapsed.
6. Mark the goal "completed" from the Goals page — re-invoke — it should no
   longer appear in the run at all (excluded by the `status: 'active'` filter).
7. Turn on quiet hours covering the current time in your timezone, re-enable
   the goal, re-invoke — should be skipped with `skippedQuietHours`, and
   `lastReminderSentAt` should NOT change (so it's picked up again once quiet
   hours end).
8. Create two active, reminder-enabled goals for the same account — invoke —
   confirm exactly one consolidated email arrives, listing both goals.

If step 3 doesn't deliver an email, check `railway logs` for an SES error
first (most common cause: recipient not verified while still in the sandbox,
or the `SES_FROM_EMAIL` identity isn't `Success`-verified yet).

---

## Reference: what's already done for you

- **Backend**: `EmailModule`/`EmailService` (SES client), `RemindersModule`
  (`POST /internal/reminders/process`, guarded by `InternalSecretGuard`
  comparing a bearer token against `REMINDER_JOB_SECRET` with a timing-safe
  check), due/quiet-hours/consolidation logic in `RemindersService`, DB
  columns added via a TypeORM migration (not `synchronize`) — all deployed
  and live at `https://backend-production-d3c5.up.railway.app`.
- **Frontend**: per-goal reminder toggle + interval picker in the goal form,
  last-reminder-sent display, and a Settings page section for timezone +
  quiet hours — all deployed.
- **Lambda source**: `aws/reminder-trigger/index.mjs` — zero dependencies,
  just relays to the backend endpoint above.
- **IAM policy templates**: `aws/reminder-trigger/*.json` — referenced by
  the exact commands above.
- **What I verified live**: the internal endpoint correctly returns 401
  without/with-wrong `Authorization`, 200 with the right secret; the new
  `reminderEnabled`/`reminderIntervalHours`/`lastReminderSentAt` /
  `timezone`/`quietHours*` columns exist and round-trip correctly through the
  API; a completed goal is correctly excluded from the reminder query even
  with `reminderEnabled: true`; invalid timezones and invalid interval values
  are rejected with 400s.
- **What I could not verify** (needs your AWS setup): an actual SES email
  being sent and received — the backend currently has no AWS credentials, so
  `EmailService.isConfigured()` is `false` and `processReminders()` returns
  early with all-zero counts. That's the correct, safe behavior for an
  unconfigured environment — not a bug. Steps 1-3 above give it real
  credentials; step 6 is the actual live verification you'll need to do
  yourself, since only you can click the SES verification email link and
  observe your own inbox.
