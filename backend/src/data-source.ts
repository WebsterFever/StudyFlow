import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { StudyGoal } from './goals/goal.entity';
import { StudyItem } from './study-items/study-item.entity';
import { StudySession } from './study-sessions/study-session.entity';
import { DayOverride } from './day-overrides/day-override.entity';
import { StudyNote } from './study-notes/study-note.entity';
import { ProjectSnapshot } from './project-snapshots/project-snapshot.entity';
import { ProjectFile } from './project-snapshots/project-file.entity';
import { Assignment } from './assignments/assignment.entity';
import { Exam } from './exams/exam.entity';
import { ExamReviewItem } from './exams/exam-review-item.entity';
import { PlannerGoal } from './planner-goals/planner-goal.entity';
import { PlannerMilestone } from './planner-milestones/planner-milestone.entity';
import { PlannerTask } from './planner-tasks/planner-task.entity';
import { PlannerSubtask } from './planner-subtasks/planner-subtask.entity';
import { PlannerNote } from './planner-notes/planner-note.entity';

/**
 * Used only by the TypeORM CLI (migration:generate / migration:run / migration:revert).
 * The running app itself connects via app.module.ts's TypeOrmModule.forRootAsync — this
 * file is not imported by the app, only by `npm run migration:*` scripts.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    StudyGoal,
    StudyItem,
    StudySession,
    DayOverride,
    StudyNote,
    ProjectSnapshot,
    ProjectFile,
    Assignment,
    Exam,
    ExamReviewItem,
    PlannerGoal,
    PlannerMilestone,
    PlannerTask,
    PlannerSubtask,
    PlannerNote,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
