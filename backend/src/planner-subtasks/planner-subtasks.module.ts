import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerSubtask } from './planner-subtask.entity';
import { PlannerSubtasksService } from './planner-subtasks.service';
import { PlannerSubtasksController } from './planner-subtasks.controller';
import { PlannerTasksModule } from '../planner-tasks/planner-tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlannerSubtask]), PlannerTasksModule],
  providers: [PlannerSubtasksService],
  controllers: [PlannerSubtasksController],
  exports: [PlannerSubtasksService],
})
export class PlannerSubtasksModule {}
