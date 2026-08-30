import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { assertValidGoalPayload } from '../goals/goals.service';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { DayOverride } from '../day-overrides/day-override.entity';
import { UsersService } from '../users/users.service';
import { ImportPayloadDto } from './dto/import-payload.dto';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ImportSummary {
  goalImported: boolean;
  itemsImported: number;
  sessionsImported: number;
  dayOverridesImported: number;
}

@Injectable()
export class DataService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Replaces the user's goal/items/sessions/dayOverrides with the given payload,
   * inside a single transaction (items before sessions, since sessions reference
   * item ids). Shared by both the one-time local-data migration and the
   * user-triggered "restore from backup" flow.
   */
  private async replaceAllData(userId: string, payload: ImportPayloadDto): Promise<ImportSummary> {
    return this.dataSource.transaction(async (manager) => {
      await manager.delete(StudySession, { userId });
      await manager.delete(StudyItem, { userId });
      await manager.delete(StudyGoal, { userId });
      await manager.delete(DayOverride, { userId });

      let goalImported = false;
      if (payload.goal) {
        assertValidGoalPayload(payload.goal);
        const goal = manager.create(StudyGoal, { ...payload.goal, userId });
        await manager.save(StudyGoal, goal);
        goalImported = true;
      }

      const items = payload.items ?? [];
      if (items.length > 0) {
        const entities = items.map((item) =>
          manager.create(StudyItem, {
            ...item,
            notes: item.notes ?? '',
            order: item.order ?? 0,
            userId,
          }),
        );
        await manager.save(StudyItem, entities);
      }

      const sessions = payload.sessions ?? [];
      const validItemIds = new Set(items.map((i) => i.id).filter((id): id is string => Boolean(id)));
      const importableSessions = sessions.filter((s) => validItemIds.has(s.itemId));
      if (importableSessions.length > 0) {
        const entities = importableSessions.map((session) =>
          manager.create(StudySession, {
            ...session,
            partIndex: session.partIndex ?? 1,
            partTotal: session.partTotal ?? 1,
            status: session.status ?? 'planned',
            userId,
          }),
        );
        await manager.save(StudySession, entities);
      }

      const overrideEntries = Object.entries(payload.dayOverrides ?? {}).filter(([date]) => DATE_PATTERN.test(date));
      if (overrideEntries.length > 0) {
        const entities = overrideEntries.map(([date, override]) =>
          manager.create(DayOverride, {
            userId,
            date,
            unavailable: Boolean(override.unavailable),
            hoursOverride: override.hoursOverride ?? null,
          }),
        );
        await manager.save(DayOverride, entities);
      }

      return {
        goalImported,
        itemsImported: items.length,
        sessionsImported: importableSessions.length,
        dayOverridesImported: overrideEntries.length,
      };
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

  /** Explicit, repeatable "restore from an exported backup file" import. */
  async restoreData(userId: string, payload: ImportPayloadDto): Promise<ImportSummary> {
    return this.replaceAllData(userId, payload);
  }

  /** Wipes all study data but keeps the user account itself. */
  async wipeAllData(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(StudySession, { userId });
      await manager.delete(StudyItem, { userId });
      await manager.delete(StudyGoal, { userId });
      await manager.delete(DayOverride, { userId });
    });
  }
}
