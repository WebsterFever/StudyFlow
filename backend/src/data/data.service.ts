import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { assertValidGoalPayload } from '../goals/goals.service';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { DayOverride } from '../day-overrides/day-override.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { UsersService } from '../users/users.service';
import { GoalBundleDto, ImportPayloadDto } from './dto/import-payload.dto';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ImportSummary {
  goalsImported: number;
  itemsImported: number;
  sessionsImported: number;
  dayOverridesImported: number;
}

/** Normalizes both the new multi-goal payload shape and the legacy single-goal shape into one goal-bundle list. */
function normalizeToBundles(payload: ImportPayloadDto): GoalBundleDto[] {
  if (payload.goals && payload.goals.length > 0) return payload.goals;
  if (payload.goal) {
    return [{ ...payload.goal, items: payload.items ?? [], sessions: payload.sessions ?? [], dayOverrides: payload.dayOverrides ?? {} }];
  }
  return [];
}

@Injectable()
export class DataService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Replaces ALL of the user's goals (and each goal's items/sessions/day
   * overrides) with the given payload, inside a single transaction. Shared by
   * both the one-time local-data migration and the user-triggered "restore
   * from backup" flow.
   */
  private async replaceAllData(userId: string, payload: ImportPayloadDto): Promise<ImportSummary> {
    const bundles = normalizeToBundles(payload);

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(StudyNote, { userId });
      await manager.delete(StudySession, { userId });
      await manager.delete(StudyItem, { userId });
      await manager.delete(StudyGoal, { userId });
      await manager.delete(DayOverride, { userId });

      let itemsImported = 0;
      let sessionsImported = 0;
      let dayOverridesImported = 0;

      for (const bundle of bundles) {
        assertValidGoalPayload(bundle);
        const goal = manager.create(StudyGoal, {
          id: bundle.id,
          userId,
          name: bundle.name,
          startDate: bundle.startDate,
          deadline: bundle.deadline,
          dailyHours: bundle.dailyHours,
          status: bundle.status ?? 'active',
        });
        await manager.save(StudyGoal, goal);

        const items = bundle.items ?? [];
        if (items.length > 0) {
          const entities = items.map((item) =>
            manager.create(StudyItem, { ...item, goalId: goal.id, notes: item.notes ?? '', order: item.order ?? 0, userId }),
          );
          await manager.save(StudyItem, entities);
          itemsImported += entities.length;
        }

        const sessions = bundle.sessions ?? [];
        const validItemIds = new Set(items.map((i) => i.id).filter((id): id is string => Boolean(id)));
        const importableSessions = sessions.filter((s) => validItemIds.has(s.itemId));
        if (importableSessions.length > 0) {
          const entities = importableSessions.map((session) =>
            manager.create(StudySession, {
              ...session,
              goalId: goal.id,
              partIndex: session.partIndex ?? 1,
              partTotal: session.partTotal ?? 1,
              status: session.status ?? 'planned',
              userId,
            }),
          );
          await manager.save(StudySession, entities);
          sessionsImported += entities.length;
        }

        const overrideEntries = Object.entries(bundle.dayOverrides ?? {}).filter(([date]) => DATE_PATTERN.test(date));
        if (overrideEntries.length > 0) {
          const entities = overrideEntries.map(([date, override]) =>
            manager.create(DayOverride, {
              userId,
              goalId: goal.id,
              date,
              unavailable: Boolean(override.unavailable),
              hoursOverride: override.hoursOverride ?? null,
            }),
          );
          await manager.save(DayOverride, entities);
          dayOverridesImported += entities.length;
        }
      }

      return { goalsImported: bundles.length, itemsImported, sessionsImported, dayOverridesImported };
    });
  }

  /** One-time, idempotent import of legacy `studyflow_v1` localStorage data. */
  async migrateLocalData(
    userId: string,
    payload: ImportPayloadDto,
  ): Promise<{ migrated: boolean; alreadyMigrated: boolean; summary: ImportSummary | null }> {
    const user = await this.usersService.findById(userId);
    if (user?.localDataMigratedAt) {
      return { migrated: false, alreadyMigrated: true, summary: null };
    }
    const summary = await this.replaceAllData(userId, payload);
    await this.usersService.markLocalDataMigrated(userId);
    return { migrated: true, alreadyMigrated: false, summary };
  }

  /** Explicit, repeatable "restore from an exported backup file" import — replaces every goal. */
  async restoreData(userId: string, payload: ImportPayloadDto): Promise<ImportSummary> {
    return this.replaceAllData(userId, payload);
  }

  /** Wipes all study data (every goal) but keeps the user account itself. */
  async wipeAllData(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(StudyNote, { userId });
      await manager.delete(StudySession, { userId });
      await manager.delete(StudyItem, { userId });
      await manager.delete(StudyGoal, { userId });
      await manager.delete(DayOverride, { userId });
    });
  }
}
