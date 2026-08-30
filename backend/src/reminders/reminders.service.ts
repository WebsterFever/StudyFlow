import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { buildReminderEmail, type GoalReminderSummary } from '../email/templates/reminder-email.template';
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

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(StudyGoal) private readonly goalsRepository: Repository<StudyGoal>,
    @InjectRepository(StudyItem) private readonly itemsRepository: Repository<StudyItem>,
    @InjectRepository(StudySession) private readonly sessionsRepository: Repository<StudySession>,
    private readonly emailService: EmailService,
  ) {}

  async processReminders(): Promise<ReminderRunSummary> {
    this.logger.log('Reminder job started');

    if (!this.emailService.isConfigured()) {
      this.logger.warn('Reminder job skipped entirely — AWS SES is not configured.');
      return { processed: 0, due: 0, usersEmailed: 0, sent: 0, skipped: 0, failed: 0, details: { skippedNotDue: 0, skippedQuietHours: 0, lostClaimRace: 0 } };
    }

    // Only goals that are still active, opted in, and not paused/completed are
    // candidates at all — a goal's current Postgres status is always the source
    // of truth, never a value cached from an earlier run.
    const candidates = await this.goalsRepository.find({
      where: { status: 'active', reminderEnabled: true },
      relations: { user: true },
    });
    this.logger.log(`${candidates.length} eligible goals found`);

    const now = Date.now();
    const due: StudyGoal[] = [];
    let skippedNotDue = 0;
    for (const goal of candidates) {
      if (this.isDue(goal, now)) due.push(goal);
      else skippedNotDue++;
    }
    this.logger.log(`${due.length} reminders due`);

    const byUser = new Map<string, { user: User; goals: StudyGoal[] }>();
    for (const goal of due) {
      const entry = byUser.get(goal.userId) ?? { user: goal.user, goals: [] };
      entry.goals.push(goal);
      byUser.set(goal.userId, entry);
    }

    let sent = 0;
    let failed = 0;
    let skippedQuietHours = 0;
    let lostClaimRace = 0;
    let usersEmailed = 0;

    for (const { user, goals } of byUser.values()) {
      if (this.isUserInQuietHours(user)) {
        // Deliberately do not claim/update lastReminderSentAt here — leaving it
        // untouched means the very next (non-quiet-hours) run sees the same
        // goal as still due, with no separate deferred-send bookkeeping needed.
        skippedQuietHours += goals.length;
        continue;
      }

      // Atomically claim each due goal before sending. The scheduler runs every
      // 5 minutes and a Lambda/EventBridge retry can overlap a prior run — this
      // conditional UPDATE ensures only one concurrent run can ever win a given
      // goal, so the same reminder can never be sent twice for one due window.
      const claimedAt = new Date();
      const claimed: StudyGoal[] = [];
      for (const goal of goals) {
        const won = await this.claimGoal(goal, claimedAt);
        if (won) claimed.push(goal);
        else lostClaimRace++;
      }
      if (claimed.length === 0) continue;

      try {
        const summaries = await Promise.all(claimed.map((goal) => this.buildGoalSummary(goal, user.timezone)));
        const content = buildReminderEmail(user.name, summaries);
        await this.emailService.sendHtmlEmail(user.email, content.subject, content.html, content.text);

        sent += claimed.length;
        usersEmailed += 1;
        this.logger.log(`Reminder email sent to 1 user for ${claimed.length} goal(s)`);
      } catch (err) {
        // Send failed — release the claim so the next run picks these goals
        // back up instead of silently losing a reminder.
        await Promise.all(claimed.map((goal) => this.revertClaim(goal, claimedAt)));
        failed += claimed.length;
        this.logger.error(`Reminder email failed for 1 user: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const skipped = skippedNotDue + skippedQuietHours + lostClaimRace;
    this.logger.log(
      `Reminder job finished — ${candidates.length} processed, ${due.length} due, ${sent} sent, ${skipped} skipped (${skippedNotDue} not due, ${skippedQuietHours} quiet hours, ${lostClaimRace} lost claim race), ${failed} failed, ${usersEmailed} users emailed`,
    );

    return {
      processed: candidates.length,
      due: due.length,
      usersEmailed,
      sent,
      skipped,
      failed,
      details: { skippedNotDue, skippedQuietHours, lostClaimRace },
    };
  }

  private isDue(goal: StudyGoal, nowMs: number): boolean {
    if (!goal.lastReminderSentAt) return true;
    const intervalMs = goal.reminderIntervalMinutes * 60 * 1000;
    return nowMs - new Date(goal.lastReminderSentAt).getTime() >= intervalMs;
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

  /** Releases a claim after a failed send, restoring the value the claim overwrote. */
  private async revertClaim(goal: StudyGoal, claimedAt: Date): Promise<void> {
    await this.goalsRepository
      .createQueryBuilder()
      .update(StudyGoal)
      .set({ lastReminderSentAt: goal.lastReminderSentAt })
      .where('id = :id', { id: goal.id })
      .andWhere('"lastReminderSentAt" = :claimedAt', { claimedAt })
      .execute();
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
}
