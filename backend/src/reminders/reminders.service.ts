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
  sent: number;
  skipped: number;
  failed: number;
  details: {
    skippedNotDue: number;
    skippedQuietHours: number;
    usersEmailed: number;
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
      return { processed: 0, sent: 0, skipped: 0, failed: 0, details: { skippedNotDue: 0, skippedQuietHours: 0, usersEmailed: 0 } };
    }

    // Only goals that are still active and opted in are candidates at all.
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
    let usersEmailed = 0;

    for (const { user, goals } of byUser.values()) {
      if (this.isUserInQuietHours(user)) {
        skippedQuietHours += goals.length;
        continue;
      }

      try {
        const summaries = await Promise.all(goals.map((goal) => this.buildGoalSummary(goal, user.timezone)));
        const content = buildReminderEmail(user.name, summaries);
        await this.emailService.sendHtmlEmail(user.email, content.subject, content.html, content.text);

        // Only mark goals as reminded if the send actually succeeded, and only if
        // nothing else changed lastReminderSentAt since we read it (avoids a lost
        // update if two job runs somehow overlap).
        const sentAt = new Date();
        await Promise.all(goals.map((goal) => this.markReminded(goal, sentAt)));

        sent += goals.length;
        usersEmailed += 1;
        this.logger.log(`Reminder email sent to 1 user for ${goals.length} goal(s)`);
      } catch (err) {
        failed += goals.length;
        this.logger.error(`Reminder email failed for 1 user: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const skipped = skippedNotDue + skippedQuietHours;
    this.logger.log(
      `Reminder job finished — ${candidates.length} eligible, ${sent} sent, ${skipped} skipped (${skippedNotDue} not due, ${skippedQuietHours} quiet hours), ${failed} failed, ${usersEmailed} users emailed`,
    );

    return { processed: candidates.length, sent, skipped, failed, details: { skippedNotDue, skippedQuietHours, usersEmailed } };
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

  /** Conditional update: only succeeds if lastReminderSentAt still matches what we read before sending. */
  private async markReminded(goal: StudyGoal, sentAt: Date): Promise<void> {
    const qb = this.goalsRepository.createQueryBuilder().update(StudyGoal).set({ lastReminderSentAt: sentAt }).where('id = :id', { id: goal.id });
    if (goal.lastReminderSentAt) {
      qb.andWhere('"lastReminderSentAt" = :prev', { prev: goal.lastReminderSentAt });
    } else {
      qb.andWhere('"lastReminderSentAt" IS NULL');
    }
    await qb.execute();
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
