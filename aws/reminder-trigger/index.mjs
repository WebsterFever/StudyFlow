// AWS Lambda handler triggered by EventBridge Scheduler every 2 hours.
//
// This function intentionally contains NO StudyFlow business logic — it just
// makes one authenticated HTTP call to the existing NestJS backend and lets
// the database decide what actually needs a reminder. Keeping the Lambda this
// thin means there's only one place (the backend) that knows what "due" means.
//
// Required environment variables (set on the Lambda function, never hardcoded):
//   STUDYFLOW_API_URL    e.g. https://backend-production-xxxx.up.railway.app
//   REMINDER_JOB_SECRET  shared secret, must match the backend's REMINDER_JOB_SECRET

const REQUEST_TIMEOUT_MS = 25_000;

export const handler = async () => {
  const apiUrl = process.env.STUDYFLOW_API_URL;
  const secret = process.env.REMINDER_JOB_SECRET;

  if (!apiUrl) {
    throw new Error('STUDYFLOW_API_URL environment variable is not set.');
  }
  if (!secret) {
    throw new Error('REMINDER_JOB_SECRET environment variable is not set.');
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/internal/reminders/process`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  console.log(`Reminder trigger: calling ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    const bodyText = await response.text();

    if (!response.ok) {
      // Never log the secret or full request headers — only the response, which is safe.
      console.error(`Reminder trigger failed: HTTP ${response.status} — ${bodyText}`);
      throw new Error(`StudyFlow backend returned HTTP ${response.status}`);
    }

    const summary = bodyText ? JSON.parse(bodyText) : null;
    console.log('Reminder trigger succeeded:', JSON.stringify(summary));
    return { statusCode: 200, body: summary };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`Reminder trigger timed out after ${REQUEST_TIMEOUT_MS}ms`);
      throw new Error('Request to StudyFlow backend timed out.');
    }
    console.error('Reminder trigger error:', err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};
