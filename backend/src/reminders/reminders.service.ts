import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Exam } from '../exams/exam.entity';
import { ExamReviewItem } from '../exams/exam-review-item.entity';
import { PlannerGoal } from '../planner-goals/planner-goal.entity';
import { PlannerTask } from '../planner-tasks/planner-task.entity';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import {
  buildReminderEmail,
  type AssignmentReminderSummary,
  type ExamReminderSummary,
  type GoalReminderSummary,
  type PlannerGoalReminderSummary,
  type PlannerTaskReminderSummary,
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
  plannerGoals: PlannerGoal[];
  plannerTasks: PlannerTask[];
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
    @InjectRepository(PlannerGoal) private readonly plannerGoalsRepository: Repository<PlannerGoal>,
    @InjectRepository(PlannerTask) private readonly plannerTasksRepository: Repository<PlannerTask>,
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
    // of truth, never a value cached from an earlier run. Assignments/exams/
    // planner tasks that have already sent their one-shot reminder are excluded up front.
    const [goalCandidates, assignmentCandidates, examCandidates, plannerGoalCandidates, plannerTaskCandidates] = await Promise.all([
      this.goalsRepository.find({ where: { status: 'active', reminderEnabled: true }, relations: { user: true } }),
      this.assignmentsRepository.find({
        where: { reminderEnabled: true, reminderSentAt: IsNull(), status: Not('completed') },
        relations: { user: true, goal: true },
      }),
      this.examsRepository.find({ where: { reminderEnabled: true, reminderSentAt: IsNull() }, relations: { user: true, goal: true } }),
      this.plannerGoalsRepository.find({ where: { status: 'active', reminderEnabled: true }, relations: { user: true } }),
      this.plannerTasksRepository.find({
        where: { reminderEnabled: true, reminderSentAt: IsNull(), status: Not('completed') },
        relations: { user: true, goal: true },
      }),
    ]);
    this.logger.log(
      `${goalCandidates.length} eligible goals, ${assignmentCandidates.length} eligible assignments, ${examCandidates.length} eligible exams, ${plannerGoalCandidates.length} eligible planner goals, ${plannerTaskCandidates.length} eligible planner tasks found`,
    );

    const now = Date.now();
    const dueGoals: StudyGoal[] = [];
    let skippedNotDue = 0;
    for (const goal of goalCandidates) {
      if (this.isRecurringGoalDue(goal.lastReminderSentAt, goal.reminderIntervalMinutes, now)) dueGoals.push(goal);
      else skippedNotDue++;
    }

    const duePlannerGoals: PlannerGoal[] = [];
    for (const goal of plannerGoalCandidates) {
      if (this.isRecurringGoalDue(goal.lastReminderSentAt, goal.reminderIntervalMinutes, now)) duePlannerGoals.push(goal);
      else skippedNotDue++;
    }

    const dueAssignments = assignmentCandidates.filter((a) => a.dueDate <= todayInTimezone(a.user.timezone));
    skippedNotDue += assignmentCandidates.length - dueAssignments.length;

    const dueExams = examCandidates.filter((e) => e.examDate <= todayInTimezone(e.user.timezone));
    skippedNotDue += examCandidates.length - dueExams.length;

    const duePlannerTasks = plannerTaskCandidates.filter((t) => t.dueDate && t.dueDate <= todayInTimezone(t.user.timezone));
    skippedNotDue += plannerTaskCandidates.length - duePlannerTasks.length;

    const totalDue = dueGoals.length + dueAssignments.length + dueExams.length + duePlannerGoals.length + duePlannerTasks.length;
    this.logger.log(
      `${totalDue} reminders due (${dueGoals.length} goals, ${dueAssignments.length} assignments, ${dueExams.length} exams, ${duePlannerGoals.length} planner goals, ${duePlannerTasks.length} planner tasks)`,
    );

    const byUser = new Map<string, UserDueItems>();
    const ensureEntry = (userId: string, user: User): UserDueItems => {
      let entry = byUser.get(userId);
      if (!entry) {
        entry = { user, goals: [], assignments: [], exams: [], plannerGoals: [], plannerTasks: [] };
        byUser.set(userId, entry);
      }
      return entry;
    };
    for (const goal of dueGoals) ensureEntry(goal.userId, goal.user).goals.push(goal);
    for (const assignment of dueAssignments) ensureEntry(assignment.userId, assignment.user).assignments.push(assignment);
    for (const exam of dueExams) ensureEntry(exam.userId, exam.user).exams.push(exam);
    for (const goal of duePlannerGoals) ensureEntry(goal.userId, goal.user).plannerGoals.push(goal);
    for (const task of duePlannerTasks) ensureEntry(task.userId, task.user).plannerTasks.push(task);

    let sent = 0;
    let failed = 0;
    let skippedQuietHours = 0;
    let lostClaimRace = 0;
    let usersEmailed = 0;

    for (const { user, goals, assignments, exams, plannerGoals, plannerTasks } of byUser.values()) {
      const totalForUser = goals.length + assignments.length + exams.length + plannerGoals.length + plannerTasks.length;

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
        if (await this.claimRecurringGoal(this.goalsRepository, StudyGoal, goal, claimedAt, 'active')) claimedGoals.push(goal);
        else lostClaimRace++;
      }
      const claimedAssignments: Assignment[] = [];
      for (const assignment of assignments) {
        if (await this.claimOneShot(this.assignmentsRepository, Assignment, assignment.id, claimedAt)) claimedAssignments.push(assignment);
        else lostClaimRace++;
      }
      const claimedExams: Exam[] = [];
      for (const exam of exams) {
        if (await this.claimOneShot(this.examsRepository, Exam, exam.id, claimedAt)) claimedExams.push(exam);
        else lostClaimRace++;
      }
      const claimedPlannerGoals: PlannerGoal[] = [];
      for (const goal of plannerGoals) {
        if (await this.claimRecurringGoal(this.plannerGoalsRepository, PlannerGoal, goal, claimedAt, 'active')) claimedPlannerGoals.push(goal);
        else lostClaimRace++;
      }
      const claimedPlannerTasks: PlannerTask[] = [];
      for (const task of plannerTasks) {
        if (await this.claimOneShot(this.plannerTasksRepository, PlannerTask, task.id, claimedAt)) claimedPlannerTasks.push(task);
        else lostClaimRace++;
      }

      const claimedTotal =
        claimedGoals.length + claimedAssignments.length + claimedExams.length + claimedPlannerGoals.length + claimedPlannerTasks.length;
      if (claimedTotal === 0) continue;

      try {
        const goalSummaries = await Promise.all(claimedGoals.map((goal) => this.buildGoalSummary(goal, user.timezone)));
        const assignmentSummaries = claimedAssignments.map((a) => this.buildAssignmentSummary(a));
        const examSummaries = await Promise.all(claimedExams.map((e) => this.buildExamSummary(e)));
        const plannerGoalSummaries = await Promise.all(claimedPlannerGoals.map((g) => this.buildPlannerGoalSummary(g)));
        const plannerTaskSummaries = claimedPlannerTasks.map((t) => this.buildPlannerTaskSummary(t));

        const content = buildReminderEmail(user.name, goalSummaries, assignmentSummaries, examSummaries, plannerGoalSummaries, plannerTaskSummaries);
        await this.emailService.sendHtmlEmail(user.email, content.subject, content.html, content.text);

        sent += claimedTotal;
        usersEmailed += 1;
        this.logger.log(`Reminder email sent to 1 user for ${claimedTotal} item(s)`);
      } catch (err) {
        // Send failed — release every claim so the next run picks these items
        // back up instead of silently losing a reminder.
        await Promise.all([
          ...claimedGoals.map((goal) => this.revertRecurringGoalClaim(this.goalsRepository, StudyGoal, goal, claimedAt)),
          ...claimedAssignments.map((a) => this.assignmentsRepository.update({ id: a.id }, { reminderSentAt: null })),
          ...claimedExams.map((e) => this.examsRepository.update({ id: e.id }, { reminderSentAt: null })),
          ...claimedPlannerGoals.map((goal) => this.revertRecurringGoalClaim(this.plannerGoalsRepository, PlannerGoal, goal, claimedAt)),
          ...claimedPlannerTasks.map((t) => this.plannerTasksRepository.update({ id: t.id }, { reminderSentAt: null })),
        ]);
        failed += claimedTotal;
        this.logger.error(`Reminder email failed for 1 user: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const skipped = skippedNotDue + skippedQuietHours + lostClaimRace;
    const processed =
      goalCandidates.length + assignmentCandidates.length + examCandidates.length + plannerGoalCandidates.length + plannerTaskCandidates.length;
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

  /** Shared by StudyGoal and PlannerGoal — both use the identical recurring-interval reminder shape. */
  private isRecurringGoalDue(lastReminderSentAt: Date | null, reminderIntervalMinutes: number, nowMs: number): boolean {
    if (!lastReminderSentAt) return true;
    const intervalMs = reminderIntervalMinutes * 60 * 1000;
    const elapsedMs = nowMs - new Date(lastReminderSentAt).getTime();
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
   * wins the row; every other run gets 0 affected rows and backs off. Shared
   * by StudyGoal and PlannerGoal via the entity class passed in.
   */
  private async claimRecurringGoal<T extends { id: string; lastReminderSentAt: Date | null }>(
    repository: Repository<T>,
    entityClass: new () => T,
    goal: T,
    claimedAt: Date,
    activeStatus: string,
  ): Promise<boolean> {
    const qb = repository
      .createQueryBuilder()
      .update(entityClass)
      .set({ lastReminderSentAt: claimedAt } as never)
      .where('id = :id', { id: goal.id })
      .andWhere('status = :status', { status: activeStatus })
      .andWhere('"reminderEnabled" = true');
    if (goal.lastReminderSentAt) {
      qb.andWhere('"lastReminderSentAt" = :prev', { prev: goal.lastReminderSentAt });
    } else {
      qb.andWhere('"lastReminderSentAt" IS NULL');
    }
    const result = await qb.execute();
    return (result.affected ?? 0) > 0;
  }

  /** Releases a recurring goal's claim after a failed send, restoring the value the claim overwrote. */
  private async revertRecurringGoalClaim<T extends { id: string; lastReminderSentAt: Date | null }>(
    repository: Repository<T>,
    entityClass: new () => T,
    goal: T,
    claimedAt: Date,
  ): Promise<void> {
    await repository
      .createQueryBuilder()
      .update(entityClass)
      .set({ lastReminderSentAt: goal.lastReminderSentAt } as never)
      .where('id = :id', { id: goal.id })
      .andWhere('"lastReminderSentAt" = :claimedAt', { claimedAt })
      .execute();
  }

  /** One-shot claim shared by Assignment, Exam, and PlannerTask — reminderSentAt starts NULL, so it's just a null-check, no "previous value" to match. */
  private async claimOneShot<T extends { id: string }>(
    repository: Repository<T>,
    entityClass: new () => T,
    id: string,
    claimedAt: Date,
  ): Promise<boolean> {
    const result = await repository
      .createQueryBuilder()
      .update(entityClass)
      .set({ reminderSentAt: claimedAt } as never)
      .where('id = :id', { id })
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

  private async buildPlannerGoalSummary(goal: PlannerGoal): Promise<PlannerGoalReminderSummary> {
    const [tasksTotal, tasksCompleted] = await Promise.all([
      this.plannerTasksRepository.count({ where: { goalId: goal.id } }),
      this.plannerTasksRepository.count({ where: { goalId: goal.id, status: 'completed' } }),
    ]);
    return {
      goalName: goal.name,
      description: goal.description,
      deadlineLabel: goal.deadline ? formatFriendlyDate(goal.deadline) : null,
      tasksCompleted,
      tasksTotal,
    };
  }

  private buildPlannerTaskSummary(task: PlannerTask): PlannerTaskReminderSummary {
    return {
      goalName: task.goal?.name ?? 'Goal',
      title: task.title,
      dueDateLabel: task.dueDate ? formatFriendlyDate(task.dueDate) : '',
      priority: task.priority,
    };
  }
}
