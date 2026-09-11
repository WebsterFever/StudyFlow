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
  buildGoalReminderEmail,
  type AssignmentReminderSummary,
  type ExamReminderSummary,
  type GoalReminderSummary,
  type PlannerGoalReminderSummary,
  type PlannerTaskReminderSummary,
} from '../email/templates/reminder-email.template';
import { currentMinutesInTimezone, formatFriendlyDate, isWithinQuietHours, parseHHMM, todayInTimezone } from '../common/timezone.util';

export interface ReminderRunSummary {
  goalsProcessed: number;
  goalsDue: number;
  emailsSent: number;
  skipped: number;
  failed: number;
  details: {
    skippedNotDue: number;
    skippedQuietHours: number;
    lostClaimRace: number;
  };
}

/**
 * One entry per DUE goal (never per user) — this is the unit a reminder
 * email is built around. A StudentFlow goal's due assignments/exams and a
 * PlannerFlow goal's due tasks are folded in here because they belong to
 * that goal; a second due goal always gets its own separate entry/email.
 */
interface GoalEmailGroup {
  user: User;
  flow: 'student' | 'planner';
  goalId: string;
  goalName: string;
  dueGoal?: StudyGoal;
  dueAssignments: Assignment[];
  dueExams: Exam[];
  duePlannerGoal?: PlannerGoal;
  duePlannerTasks: PlannerTask[];
}

const EMPTY_SUMMARY: ReminderRunSummary = {
  goalsProcessed: 0,
  goalsDue: 0,
  emailsSent: 0,
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
    const dueGoals = goalCandidates.filter((goal) => this.isRecurringGoalDue(goal.lastReminderSentAt, goal.reminderIntervalMinutes, now));
    const duePlannerGoals = plannerGoalCandidates.filter((goal) => this.isRecurringGoalDue(goal.lastReminderSentAt, goal.reminderIntervalMinutes, now));
    const dueAssignments = assignmentCandidates.filter((a) => a.dueDate <= todayInTimezone(a.user.timezone));
    const dueExams = examCandidates.filter((e) => e.examDate <= todayInTimezone(e.user.timezone));
    const duePlannerTasks = plannerTaskCandidates.filter((t) => t.dueDate && t.dueDate <= todayInTimezone(t.user.timezone));

    // Group every due signal by the goal that owns it — never by user. A
    // StudentFlow goal's own recurring fire, plus any due assignments/exams
    // attached to that same goal, land in one group (they genuinely belong
    // together). A different goal — even for the same user, even in the
    // same StudentFlow/PlannerFlow flow — always gets its own group, which
    // is what guarantees one email per goal instead of one combined email
    // per user.
    const groups = new Map<string, GoalEmailGroup>();
    const ensureGroup = (flow: 'student' | 'planner', goalId: string, goalName: string, user: User): GoalEmailGroup => {
      const key = `${flow}:${goalId}`;
      let group = groups.get(key);
      if (!group) {
        group = { user, flow, goalId, goalName, dueAssignments: [], dueExams: [], duePlannerTasks: [] };
        groups.set(key, group);
      }
      return group;
    };
    for (const goal of dueGoals) ensureGroup('student', goal.id, goal.name, goal.user).dueGoal = goal;
    for (const assignment of dueAssignments) ensureGroup('student', assignment.goalId, assignment.goal?.name ?? 'Goal', assignment.user).dueAssignments.push(assignment);
    for (const exam of dueExams) ensureGroup('student', exam.goalId, exam.goal?.name ?? 'Goal', exam.user).dueExams.push(exam);
    for (const goal of duePlannerGoals) ensureGroup('planner', goal.id, goal.name, goal.user).duePlannerGoal = goal;
    for (const task of duePlannerTasks) ensureGroup('planner', task.goalId, task.goal?.name ?? 'Goal', task.user).duePlannerTasks.push(task);

    // "goalsProcessed" counts every distinct goal that had ANY eligible
    // (not necessarily due) signal this run, so the not-due ones are
    // reflected in `skipped` below rather than silently disappearing.
    const candidateGoalKeys = new Set<string>();
    for (const goal of goalCandidates) candidateGoalKeys.add(`student:${goal.id}`);
    for (const assignment of assignmentCandidates) candidateGoalKeys.add(`student:${assignment.goalId}`);
    for (const exam of examCandidates) candidateGoalKeys.add(`student:${exam.goalId}`);
    for (const goal of plannerGoalCandidates) candidateGoalKeys.add(`planner:${goal.id}`);
    for (const task of plannerTaskCandidates) candidateGoalKeys.add(`planner:${task.goalId}`);
    const goalsProcessed = candidateGoalKeys.size;
    const goalsDue = groups.size;
    this.logger.log(`${goalsDue} goals due for a reminder this run (out of ${goalsProcessed} eligible)`);

    let emailsSent = 0;
    let failed = 0;
    let skippedQuietHours = 0;
    let lostClaimRace = 0;

    for (const group of groups.values()) {
      if (this.isUserInQuietHours(group.user)) {
        // Deliberately do not claim/update anything here — leaving it
        // untouched means the very next (non-quiet-hours) run sees this
        // goal as still due, with no separate deferred-send bookkeeping needed.
        skippedQuietHours++;
        continue;
      }

      // Atomically claim every due signal for THIS goal before sending.
      // The scheduler runs every 5 minutes and a Lambda/EventBridge retry
      // can overlap a prior run — these conditional UPDATEs ensure only one
      // concurrent run can ever win a given row, so nothing is ever
      // reminded twice. Claiming is scoped per goal, so one goal's lost
      // race never affects another goal's claim/send in the same run.
      const claimedAt = new Date();
      let claimedGoal: StudyGoal | undefined;
      let claimedPlannerGoal: PlannerGoal | undefined;
      const claimedAssignments: Assignment[] = [];
      const claimedExams: Exam[] = [];
      const claimedPlannerTasks: PlannerTask[] = [];

      if (group.dueGoal && (await this.claimRecurringGoal(this.goalsRepository, StudyGoal, group.dueGoal, claimedAt, 'active'))) {
        claimedGoal = group.dueGoal;
      }
      if (group.duePlannerGoal && (await this.claimRecurringGoal(this.plannerGoalsRepository, PlannerGoal, group.duePlannerGoal, claimedAt, 'active'))) {
        claimedPlannerGoal = group.duePlannerGoal;
      }
      for (const assignment of group.dueAssignments) {
        if (await this.claimOneShot(this.assignmentsRepository, Assignment, assignment.id, claimedAt)) claimedAssignments.push(assignment);
      }
      for (const exam of group.dueExams) {
        if (await this.claimOneShot(this.examsRepository, Exam, exam.id, claimedAt)) claimedExams.push(exam);
      }
      for (const task of group.duePlannerTasks) {
        if (await this.claimOneShot(this.plannerTasksRepository, PlannerTask, task.id, claimedAt)) claimedPlannerTasks.push(task);
      }

      const claimedAnything = !!claimedGoal || !!claimedPlannerGoal || claimedAssignments.length > 0 || claimedExams.length > 0 || claimedPlannerTasks.length > 0;
      if (!claimedAnything) {
        lostClaimRace++;
        continue;
      }

      try {
        const goalSummary = claimedGoal ? await this.buildGoalSummary(claimedGoal, group.user.timezone) : undefined;
        const plannerGoalSummary = claimedPlannerGoal ? await this.buildPlannerGoalSummary(claimedPlannerGoal) : undefined;
        const assignmentSummaries = claimedAssignments.map((a) => this.buildAssignmentSummary(a));
        const examSummaries = await Promise.all(claimedExams.map((e) => this.buildExamSummary(e)));
        const plannerTaskSummaries = claimedPlannerTasks.map((t) => this.buildPlannerTaskSummary(t));

        const content = buildGoalReminderEmail({
          userName: group.user.name,
          flow: group.flow,
          goalName: group.goalName,
          goalSummary,
          plannerGoalSummary,
          assignments: assignmentSummaries,
          exams: examSummaries,
          plannerTasks: plannerTaskSummaries,
        });
        await this.emailService.sendHtmlEmail(group.user.email, content.subject, content.html, content.text);

        emailsSent += 1;
        this.logger.log(`Reminder email sent for goal "${group.goalName}" (${group.flow})`);
      } catch (err) {
        // Send failed — release every claim made for THIS goal so the next
        // run picks it back up. Other goals' already-sent emails and
        // updated timestamps are untouched — one goal's failure never
        // rolls back another goal's success.
        await Promise.all([
          claimedGoal ? this.revertRecurringGoalClaim(this.goalsRepository, StudyGoal, claimedGoal, claimedAt) : Promise.resolve(),
          claimedPlannerGoal ? this.revertRecurringGoalClaim(this.plannerGoalsRepository, PlannerGoal, claimedPlannerGoal, claimedAt) : Promise.resolve(),
          ...claimedAssignments.map((a) => this.assignmentsRepository.update({ id: a.id }, { reminderSentAt: null })),
          ...claimedExams.map((e) => this.examsRepository.update({ id: e.id }, { reminderSentAt: null })),
          ...claimedPlannerTasks.map((t) => this.plannerTasksRepository.update({ id: t.id }, { reminderSentAt: null })),
        ]);
        failed += 1;
        this.logger.error(`Reminder email failed for goal "${group.goalName}" (${group.flow}): ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const skippedNotDueGoals = goalsProcessed - goalsDue;
    const skipped = skippedNotDueGoals + skippedQuietHours + lostClaimRace;
    this.logger.log(
      `Reminder job finished — ${goalsProcessed} goals processed, ${goalsDue} due, ${emailsSent} emails sent, ${skipped} skipped (${skippedNotDueGoals} not due, ${skippedQuietHours} quiet hours, ${lostClaimRace} lost claim race), ${failed} failed`,
    );

    return {
      goalsProcessed,
      goalsDue,
      emailsSent,
      skipped,
      failed,
      details: { skippedNotDue: skippedNotDueGoals, skippedQuietHours, lostClaimRace },
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
