export interface RemainingSessionSummary {
  title: string;
  minutes: number;
}

export interface GoalReminderSummary {
  goalName: string;
  progressPercent: number;
  deadlineLabel: string; // pre-formatted, e.g. "September 17, 2026"
  sessionsCompletedToday: number;
  sessionsTotalToday: number;
  remainingMinutesToday: number;
  remainingSessions: RemainingSessionSummary[];
}

export interface ReminderEmailContent {
  subject: string;
  html: string;
  text: string;
}

function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const WRAPPER_OPEN = `
<div style="background:#f8fafc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#4f46e5;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">StudyFlow</span>
    </div>
    <div style="padding:28px;">
`;

const WRAPPER_CLOSE = `
    </div>
    <div style="padding:20px 28px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">You're receiving this because reminders are enabled for this goal. Turn them off any time from the goal's settings in StudyFlow.</p>
    </div>
  </div>
</div>
`;

function progressBarHtml(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return `
    <div style="background:#eef2ff;border-radius:999px;height:8px;overflow:hidden;margin:6px 0 2px;">
      <div style="background:#4f46e5;height:8px;width:${clamped}%;border-radius:999px;"></div>
    </div>`;
}

function goalSectionHtml(goal: GoalReminderSummary, showHeading: boolean): string {
  const remainingListHtml =
    goal.remainingSessions.length > 0
      ? goal.remainingSessions
          .map(
            (s) => `
        <tr>
          <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#0f172a;font-size:14px;">${escapeHtml(s.title)}</td>
          <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;white-space:nowrap;">${formatMinutes(s.minutes)}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;" colspan="2">No sessions scheduled for today — but this goal still has work remaining.</td></tr>`;

  return `
    ${showHeading ? `<h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">${escapeHtml(goal.goalName)}</h2>` : ''}
    <table role="presentation" width="100%" style="margin-bottom:10px;">
      <tr>
        <td style="font-size:13px;color:#64748b;">Overall progress</td>
        <td style="font-size:13px;color:#64748b;text-align:right;">${goal.progressPercent}%</td>
      </tr>
    </table>
    ${progressBarHtml(goal.progressPercent)}
    <table role="presentation" width="100%" style="margin:16px 0 6px;">
      <tr>
        <td style="font-size:13px;color:#64748b;">Today</td>
        <td style="font-size:13px;color:#64748b;text-align:right;">${goal.sessionsCompletedToday} of ${goal.sessionsTotalToday} sessions · ${formatMinutes(goal.remainingMinutesToday)} left</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#64748b;">Deadline</td>
        <td style="font-size:13px;color:#64748b;text-align:right;">${escapeHtml(goal.deadlineLabel)}</td>
      </tr>
    </table>
    <table role="presentation" width="100%" style="margin-top:10px;">
      ${remainingListHtml}
    </table>
  `;
}

function goalSectionText(goal: GoalReminderSummary): string {
  const lines = [
    goal.goalName,
    `${goal.progressPercent}% complete`,
    `Today: ${goal.sessionsCompletedToday} of ${goal.sessionsTotalToday} sessions completed, ${formatMinutes(goal.remainingMinutesToday)} remaining`,
    `Deadline: ${goal.deadlineLabel}`,
  ];
  if (goal.remainingSessions.length > 0) {
    lines.push('Remaining today:');
    for (const s of goal.remainingSessions) lines.push(`  - ${s.title} (${formatMinutes(s.minutes)})`);
  } else {
    lines.push('No sessions scheduled for today, but this goal still has work remaining.');
  }
  return lines.join('\n');
}

/** Builds a single-goal or consolidated multi-goal reminder email, depending on how many goals are due at once. */
export function buildReminderEmail(userName: string, goals: GoalReminderSummary[]): ReminderEmailContent {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';

  if (goals.length === 1) {
    const goal = goals[0];
    const subject = `StudyFlow — ${goal.goalName} is still in progress`;
    const html = `${WRAPPER_OPEN}
      <p style="margin:0 0 4px;color:#0f172a;font-size:15px;">${greeting}</p>
      <p style="margin:0 0 20px;color:#0f172a;font-size:15px;"><strong>${escapeHtml(goal.goalName)}</strong> needs your attention — you still have study work remaining.</p>
      ${goalSectionHtml(goal, false)}
      <p style="margin:24px 0 0;color:#334155;font-size:14px;">Keep going — completing today's sessions will keep you on track.</p>
      ${WRAPPER_CLOSE}`;
    const text = `${greeting}\n\n${goal.goalName} needs your attention — you still have study work remaining.\n\n${goalSectionText(goal)}\n\nKeep going — completing today's sessions will keep you on track.`;
    return { subject, html, text };
  }

  const subject = `StudyFlow — ${goals.length} goals need your attention`;
  const html = `${WRAPPER_OPEN}
    <p style="margin:0 0 4px;color:#0f172a;font-size:15px;">${greeting}</p>
    <p style="margin:0 0 20px;color:#0f172a;font-size:15px;"><strong>${goals.length} goals</strong> still have study work remaining.</p>
    ${goals.map((g) => `<div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f1f5f9;">${goalSectionHtml(g, true)}</div>`).join('')}
    <p style="margin:8px 0 0;color:#334155;font-size:14px;">Keep going — completing today's sessions will keep you on track.</p>
    ${WRAPPER_CLOSE}`;
  const text = `${greeting}\n\n${goals.length} goals still have study work remaining.\n\n${goals.map(goalSectionText).join('\n\n---\n\n')}\n\nKeep going — completing today's sessions will keep you on track.`;
  return { subject, html, text };
}
