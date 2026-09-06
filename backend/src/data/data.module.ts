import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { DayOverride } from '../day-overrides/day-override.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { ProjectSnapshot } from '../project-snapshots/project-snapshot.entity';
import { ProjectFile } from '../project-snapshots/project-file.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Exam } from '../exams/exam.entity';
import { ExamReviewItem } from '../exams/exam-review-item.entity';
import { PlannerGoal } from '../planner-goals/planner-goal.entity';
import { PlannerMilestone } from '../planner-milestones/planner-milestone.entity';
import { PlannerTask } from '../planner-tasks/planner-task.entity';
import { PlannerSubtask } from '../planner-subtasks/planner-subtask.entity';
import { PlannerNote } from '../planner-notes/planner-note.entity';
import { UsersModule } from '../users/users.module';
import { DataService } from './data.service';
import { DataController } from './data.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
    UsersModule,
  ],
  providers: [DataService],
  controllers: [DataController],
})
export class DataModule {}
