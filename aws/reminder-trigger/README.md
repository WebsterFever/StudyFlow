# StudyFlow reminder trigger (AWS Lambda)

A single-purpose Lambda: every 2 hours, EventBridge Scheduler invokes this
function, which makes one `POST` request to the StudyFlow backend's
`/internal/reminders/process` endpoint. All the actual "who needs a reminder"
logic lives in the backend — this function only knows how to make the call.

Full step-by-step deployment instructions (IAM, SES verification, Lambda
upload, EventBridge schedule) are in the repo root under
`AWS_REMINDERS_SETUP.md`. This folder just holds the artifacts referenced from
there:

- `index.mjs` — the handler (zip this + `package.json` and upload as the function code)
- `package.json` — no dependencies; native `fetch`/`AbortController` (Node 18.x+ runtime)
- `lambda-trust-policy.json` — trust policy for the Lambda's execution role
- `scheduler-trust-policy.json` — trust policy for the EventBridge Scheduler's role
- `scheduler-invoke-policy.json` — permission policy letting the scheduler invoke *only* this function
- `ses-send-policy.json` — the minimal SES policy for the **backend's** IAM user (not the Lambda's — the Lambda never touches SES directly)

Environment variables (set on the Lambda function itself, in the console or via CLI):

```
STUDYFLOW_API_URL=https://<your-backend>.up.railway.app
REMINDER_JOB_SECRET=<same value as the backend's REMINDER_JOB_SECRET>
```
