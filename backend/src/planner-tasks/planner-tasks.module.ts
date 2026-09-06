import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerTask } from './planner-task.entity';
import { PlannerTasksService } from './planner-tasks.service';
import { PlannerTasksController } from './planner-tasks.controller';
import { PlannerGoalsModule } from '../planner-goals/planner-goals.module';
import { PlannerMilestonesModule } from '../planner-milestones/planner-milestones.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlannerTask]), PlannerGoalsModule, PlannerMilestonesModule],
  providers: [PlannerTasksService],
  controllers: [PlannerTasksController],
  exports: [PlannerTasksService],
})
export class PlannerTasksModule {}
