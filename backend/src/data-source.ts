import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { StudyGoal } from './goals/goal.entity';
import { StudyItem } from './study-items/study-item.entity';
import { StudySession } from './study-sessions/study-session.entity';
import { DayOverride } from './day-overrides/day-override.entity';

/**
 * Used only by the TypeORM CLI (migration:generate / migration:run / migration:revert).
 * The running app itself connects via app.module.ts's TypeOrmModule.forRootAsync — this
 * file is not imported by the app, only by `npm run migration:*` scripts.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [User, StudyGoal, StudyItem, StudySession, DayOverride],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
