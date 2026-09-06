import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Exam } from '../exams/exam.entity';
import { ExamReviewItem } from '../exams/exam-review-item.entity';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import {
  buildReminderEmail,
  type AssignmentReminderSummary,
  type ExamReminderSummary,
  type GoalReminderSummary,
} from '../email/templates/reminder-email.template';
import { currentMinutesInTimezone, formatFriendlyDate, isWithinQuietHours, parseHHMM, todayInTimezone } from '../common/timezone.util';

export interface ReminderRunSummary {
  processed: number;
  due: number;
  usersEmailed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: {
    skippedNotDue: number;
    skippedQuietHours: number;
    lostClaimRace: number;
  };
}

interface UserDueItems {
  user: User;
  goals: StudyGoal[];
  assignments: Assignment[];
  exams: Exam[];
}

const EMPTY_SUMMARY: ReminderRunSummary = {
  processed: 0,
  due: 0,
  usersEmailed: 0,
  sent: 0,
  skipped: 0,
  failed: 0,
  details: { skippedNotDue: 0, skippedQuietHours: 0, lostClaimRace: 0 },
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(StudyGoal) private readonly goalsRepository: Repository<StudyGoal>,
    @InjectRepository(StudyItem) private readonly itemsRepository: Repository<StudyItem>,
    @InjectRepository(StudySession) private readonly sessionsRepository: Repository<StudySession>,
    @InjectRepository(Assignment) private readonly assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Exam) private readonly examsRepository: Repository<Exam>,
    @InjectRepository(ExamReviewItem) private readonly reviewItemsRepository: Repository<ExamReviewItem>,
    private readonly emailService: EmailService,
  ) {}

  async processReminders(): Promise<ReminderRunSummary> {
    this.logger.log('Reminder job started');

    if (!this.emailService.isConfigured()) {
      this.logger.warn('Reminder job skipped entirely — AWS SES is not configured.');
      return EMPTY_SUMMARY;
    }

    // Only goals that are still active, opted in, and not paused/completed are
    // candidates at all — a goal's current Postgres status is always the source
    // of truth, never a value cached from an earlier run. Assignments/exams
    // that have already sent their one-shot reminder are excluded up front.
    const [goalCandidates, assignmentCandidates, examCandidates] = await Promise.all([
      this.goalsRepository.find({ where: { status: 'active', reminderEnabled: true }, relations: { user: true } }),
      this.assignmentsRepository.find({
        where: { reminderEnabled: true, reminderSentAt: IsNull(), status: Not('completed') },
        relations: { user: true, goal: true },
      }),
      this.examsRepository.find({ where: { reminderEnabled: true, reminderSentAt: IsNull() }, relations: { user: true, goal: true } }),
    ]);
    this.logger.log(`${goalCandidates.length} eligible goals, ${assignmentCandidates.length} eligible assignments, ${examCandidates.length} eligible exams found`);

    const now = Date.now();
    const dueGoals: StudyGoal[] = [];
    let skippedNotDue = 0;
    for (const goal of goalCandidates) {
      if (this.isDue(goal, now)) dueGoals.push(goal);
      else skippedNotDue++;
    }

    const dueAssignments = assignmentCandidates.filter((a) => a.dueDate <= todayInTimezone(a.user.timezone));
    skippedNotDue += assignmentCandidates.length - dueAssignments.length;

    const dueExams = examCandidates.filter((e) => e.examDate <= todayInTimezone(e.user.timezone));
    skippedNotDue += examCandidates.length - dueExams.length;

    const totalDue = dueGoals.length + dueAssignments.length + dueExams.length;
    this.logger.log(`${totalDue} reminders due (${dueGoals.length} goals, ${dueAssignments.length} assignments, ${dueExams.length} exams)`);

    const byUser = new Map<string, UserDueItems>();
    const ensureEntry = (userId: string, user: User): UserDueItems => {
      let entry = byUser.get(userId);
      if (!entry) {
        entry = { user, goals: [], assignments: [], exams: [] };
        byUser.set(userId, entry);
      }
      return entry;
    };
    for (const goal of dueGoals) ensureEntry(goal.userId, goal.user).goals.push(goal);
    for (const assignment of dueAssignments) ensureEntry(assignment.userId, assignment.user).assignments.push(assignment);
    for (const exam of dueExams) ensureEntry(exam.userId, exam.user).exams.push(exam);

    let sent = 0;
    let failed = 0;
    let skippedQuietHours = 0;
    let lostClaimRace = 0;
    let usersEmailed = 0;

    for (const { user, goals, assignments, exams } of byUser.values()) {
      const totalForUser = goals.length + assignments.length + exams.length;

      if (this.isUserInQuietHours(user)) {
        // Deliberately do not claim/update anything here — leaving it
        // untouched means the very next (non-quiet-hours) run sees the same
        // items as still due, with no separate deferred-send bookkeeping needed.
        skippedQuietHours += totalForUser;
        continue;
      }

      // Atomically claim each due item before sending. The scheduler runs
      // every 5 minutes and a Lambda/EventBridge retry can overlap a prior
      // run — these conditional UPDATEs ensure only one concurrent run can
      // ever win a given row, so nothing is ever reminded twice.
      const claimedAt = new Date();
      const claimedGoals: StudyGoal[] = [];
      for (const goal of goals) {
        if (await this.claimGoal(goal, claimedAt)) claimedGoals.push(goal);
        else lostClaimRace++;
      }
      const claimedAssignments: Assignment[] = [];
      for (const assignment of assignments) {
        if (await this.claimAssignment(assignment, claimedAt)) claimedAssignments.push(assignment);
        else lostClaimRace++;
      }
      const claimedExams: Exam[] = [];
      for (const exam of exams) {
        if (await this.claimExam(exam, claimedAt)) claimedExams.push(exam);
        else lostClaimRace++;
      }

      const claimedTotal = claimedGoals.length + claimedAssignments.length + claimedExams.length;
      if (claimedTotal === 0) continue;

      try {
        const goalSummaries = await Promise.all(claimedGoals.map((goal) => this.buildGoalSummary(goal, user.timezone)));
        const assignmentSummaries = claimedAssignments.map((a) => this.buildAssignmentSummary(a));
        const examSummaries = await Promise.all(claimedExams.map((e) => this.buildExamSummary(e)));

        const content = buildReminderEmail(user.name, goalSummaries, assignmentSummaries, examSummaries);
        await this.emailService.sendHtmlEmail(user.email, content.subject, content.html, content.text);

        sent += claimedTotal;
        usersEmailed += 1;
        this.logger.log(`Reminder email sent to 1 user for ${claimedTotal} item(s)`);
      } catch (err) {
        // Send failed — release every claim so the next run picks these items
        // back up instead of silently losing a reminder.
        await Promise.all([
          ...claimedGoals.map((goal) => this.revertGoalClaim(goal, claimedAt)),
          ...claimedAssignments.map((a) => this.assignmentsRepository.update({ id: a.id }, { reminderSentAt: null })),
          ...claimedExams.map((e) => this.examsRepository.update({ id: e.id }, { reminderSentAt: null })),
        ]);
        failed += claimedTotal;
        this.logger.error(`Reminder email failed for 1 user: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const skipped = skippedNotDue + skippedQuietHours + lostClaimRace;
    const processed = goalCandidates.length + assignmentCandidates.length + examCandidates.length;
    this.logger.log(
      `Reminder job finished — ${processed} processed, ${totalDue} due, ${sent} sent, ${skipped} skipped (${skippedNotDue} not due, ${skippedQuietHours} quiet hours, ${lostClaimRace} lost claim race), ${failed} failed, ${usersEmailed} users emailed`,
    );

    return {
      processed,
      due: totalDue,
      usersEmailed,
      sent,
      skipped,
      failed,
      details: { skippedNotDue, skippedQuietHours, lostClaimRace },
    };
  }

  // EventBridge's "every 5 minutes" ticks land with a bit of natural jitter
  // (a tick can fire a second or two before the exact 300.000s mark). Without
  // slack, a goal whose interval sits close to the scheduler's own cadence
  // (e.g. a 5-minute goal on a 5-minute scheduler) can miss that borderline
  // tick and silently wait a full extra cycle. A small grace window absorbs
  // that jitter without meaningfully affecting longer intervals.
  private static readonly DUE_GRACE_MS = 60 * 1000;

  private isDue(goal: StudyGoal, nowMs: number): boolean {
    if (!goal.lastReminderSentAt) return true;
    const intervalMs = goal.reminderIntervalMinutes * 60 * 1000;
    const elapsedMs = nowMs - new Date(goal.lastReminderSentAt).getTime();
    return elapsedMs >= intervalMs - RemindersService.DUE_GRACE_MS;
  }

  private isUserInQuietHours(user: User): boolean {
    if (!user.quietHoursEnabled) return false;
    const start = parseHHMM(user.quietHoursStart);
    const end = parseHHMM(user.quietHoursEnd);
    if (start === null || end === null) return false;
    const nowMinutes = currentMinutesInTimezone(user.timezone);
    return isWithinQuietHours(nowMinutes, start, end);
  }

  /**
   * Conditional UPDATE: only succeeds (affected row > 0) if the goal is still
   * active + reminder-enabled and lastReminderSentAt still matches what we
   * read before attempting the claim. This is the atomic reservation step —
   * whichever concurrent run's UPDATE actually matches the WHERE clause first
   * wins the row; every other run gets 0 affected rows and backs off.
   */
  private async claimGoal(goal: StudyGoal, claimedAt: Date): Promise<boolean> {
    const qb = this.goalsRepository
      .createQueryBuilder()
      .update(StudyGoal)
      .set({ lastReminderSentAt: claimedAt })
      .where('id = :id', { id: goal.id })
      .andWhere('status = :status', { status: 'active' })
      .andWhere('"reminderEnabled" = true');
    if (goal.lastReminderSentAt) {
      qb.andWhere('"lastReminderSentAt" = :prev', { prev: goal.lastReminderSentAt });
    } else {
      qb.andWhere('"lastReminderSentAt" IS NULL');
    }
    const result = await qb.execute();
    return (result.affected ?? 0) > 0;
  }

  /** Releases a goal's claim after a failed send, restoring the value the claim overwrote. */
  private async revertGoalClaim(goal: StudyGoal, claimedAt: Date): Promise<void> {
    await this.goalsRepository
      .createQueryBuilder()
      .update(StudyGoal)
      .set({ lastReminderSentAt: goal.lastReminderSentAt })
      .where('id = :id', { id: goal.id })
      .andWhere('"lastReminderSentAt" = :claimedAt', { claimedAt })
      .execute();
  }

  /** Assignments/exams only ever claim once (reminderSentAt starts NULL) — no "previous value" to match, just a null-check. */
  private async claimAssignment(assignment: Assignment, claimedAt: Date): Promise<boolean> {
    const result = await this.assignmentsRepository
      .createQueryBuilder()
      .update(Assignment)
      .set({ reminderSentAt: claimedAt })
      .where('id = :id', { id: assignment.id })
      .andWhere('"reminderSentAt" IS NULL')
      .execute();
    return (result.affected ?? 0) > 0;
  }

  private async claimExam(exam: Exam, claimedAt: Date): Promise<boolean> {
    const result = await this.examsRepository
      .createQueryBuilder()
      .update(Exam)
      .set({ reminderSentAt: claimedAt })
      .where('id = :id', { id: exam.id })
      .andWhere('"reminderSentAt" IS NULL')
      .execute();
    return (result.affected ?? 0) > 0;
  }

  private async buildGoalSummary(goal: StudyGoal, timezone: string): Promise<GoalReminderSummary> {
    const [totalItems, completedItems, todaySessions] = await Promise.all([
      this.itemsRepository.count({ where: { goalId: goal.id } }),
      this.itemsRepository.count({ where: { goalId: goal.id, completed: true } }),
      this.sessionsRepository.find({ where: { goalId: goal.id, date: todayInTimezone(timezone) }, relations: { item: true }, order: { order: 'ASC' } }),
    ]);

    const completedToday = todaySessions.filter((s) => s.status === 'completed');
    const remainingToday = todaySessions.filter((s) => s.status !== 'completed');

    return {
      goalName: goal.name,
      progressPercent: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
      deadlineLabel: formatFriendlyDate(goal.deadline),
      sessionsCompletedToday: completedToday.length,
      sessionsTotalToday: todaySessions.length,
      remainingMinutesToday: remainingToday.reduce((sum, s) => sum + s.plannedMinutes, 0),
      remainingSessions: remainingToday.map((s) => ({
        title: s.item?.title ?? 'Study session',
        minutes: s.plannedMinutes,
      })),
    };
  }

  private buildAssignmentSummary(assignment: Assignment): AssignmentReminderSummary {
    return {
      goalName: assignment.goal?.name ?? 'Goal',
      title: assignment.title,
      dueDateLabel: formatFriendlyDate(assignment.dueDate),
    };
  }

  private async buildExamSummary(exam: Exam): Promise<ExamReminderSummary> {
    const links = await this.reviewItemsRepository.find({ where: { examId: exam.id }, relations: { studyItem: true } });
    const completed = links.filter((l) => l.studyItem?.completed).length;
    return {
      goalName: exam.goal?.name ?? 'Goal',
      title: exam.title,
      examDateLabel: formatFriendlyDate(exam.examDate),
      progressPercent: links.length === 0 ? 0 : Math.round((completed / links.length) * 100),
    };
  }
}
