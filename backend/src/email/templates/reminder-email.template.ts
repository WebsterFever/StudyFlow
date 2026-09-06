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

export interface AssignmentReminderSummary {
  goalName: string;
  title: string;
  dueDateLabel: string;
}

export interface ExamReminderSummary {
  goalName: string;
  title: string;
  examDateLabel: string;
  progressPercent: number;
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
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">GoalFlow</span>
    </div>
    <div style="padding:28px;">
`;

const WRAPPER_CLOSE = `
    </div>
    <div style="padding:20px 28px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">You're receiving this because reminders are enabled for this goal. Turn them off any time from the goal's settings in GoalFlow.</p>
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

function assignmentSectionHtml(a: AssignmentReminderSummary): string {
  return `
    <tr>
      <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#0f172a;font-size:14px;">${escapeHtml(a.title)}<br/><span style="color:#94a3b8;font-size:12px;">${escapeHtml(a.goalName)}</span></td>
      <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;white-space:nowrap;">Due ${escapeHtml(a.dueDateLabel)}</td>
    </tr>`;
}

function examSectionHtml(e: ExamReminderSummary): string {
  return `
    <tr>
      <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#0f172a;font-size:14px;">${escapeHtml(e.title)}<br/><span style="color:#94a3b8;font-size:12px;">${escapeHtml(e.goalName)} — ${e.progressPercent}% reviewed</span></td>
      <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;white-space:nowrap;">${escapeHtml(e.examDateLabel)}</td>
    </tr>`;
}

/** Builds a single-item or consolidated reminder email covering goals, assignments due today, and upcoming exams — however many of each are due at once. */
export function buildReminderEmail(
  userName: string,
  goals: GoalReminderSummary[],
  assignments: AssignmentReminderSummary[] = [],
  exams: ExamReminderSummary[] = [],
): ReminderEmailContent {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const totalCount = goals.length + assignments.length + exams.length;

  let subject: string;
  if (totalCount === 1) {
    if (goals.length === 1) subject = `GoalFlow — ${goals[0].goalName} is still in progress`;
    else if (assignments.length === 1) subject = `GoalFlow — ${assignments[0].title} is due today`;
    else subject = `GoalFlow — ${exams[0].title} exam is coming up`;
  } else {
    subject = `GoalFlow — ${totalCount} items need your attention`;
  }

  const assignmentsHtml =
    assignments.length > 0
      ? `<h2 style="margin:20px 0 8px;font-size:14px;color:#0f172a;">Assignments due today</h2><table role="presentation" width="100%">${assignments.map(assignmentSectionHtml).join('')}</table>`
      : '';
  const examsHtml =
    exams.length > 0
      ? `<h2 style="margin:20px 0 8px;font-size:14px;color:#0f172a;">Exams coming up</h2><table role="presentation" width="100%">${exams.map(examSectionHtml).join('')}</table>`
      : '';
  const goalsHtml =
    goals.length > 0
      ? goals.length === 1
        ? goalSectionHtml(goals[0], false)
        : goals.map((g) => `<div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f1f5f9;">${goalSectionHtml(g, true)}</div>`).join('')
      : '';

  const introText =
    totalCount === 1
      ? goals.length === 1
        ? `<strong>${escapeHtml(goals[0].goalName)}</strong> needs your attention — you still have study work remaining.`
        : assignments.length === 1
          ? `<strong>${escapeHtml(assignments[0].title)}</strong> is due today.`
          : `<strong>${escapeHtml(exams[0].title)}</strong> is coming up.`
      : `<strong>${totalCount} items</strong> need your attention.`;

  const html = `${WRAPPER_OPEN}
    <p style="margin:0 0 4px;color:#0f172a;font-size:15px;">${greeting}</p>
    <p style="margin:0 0 20px;color:#0f172a;font-size:15px;">${introText}</p>
    ${goalsHtml}
    ${assignmentsHtml}
    ${examsHtml}
    <p style="margin:24px 0 0;color:#334155;font-size:14px;">Keep going — completing today's work will keep you on track.</p>
    ${WRAPPER_CLOSE}`;

  const textParts = [`${greeting}`, ''];
  if (goals.length > 0) textParts.push(goals.map(goalSectionText).join('\n\n---\n\n'));
  if (assignments.length > 0) {
    textParts.push('Assignments due today:');
    for (const a of assignments) textParts.push(`  - ${a.title} (${a.goalName}) — due ${a.dueDateLabel}`);
  }
  if (exams.length > 0) {
    textParts.push('Exams coming up:');
    for (const e of exams) textParts.push(`  - ${e.title} (${e.goalName}) — ${e.examDateLabel}, ${e.progressPercent}% reviewed`);
  }
  textParts.push('', "Keep going — completing today's work will keep you on track.");
  const text = textParts.join('\n');

  return { subject, html, text };
}
