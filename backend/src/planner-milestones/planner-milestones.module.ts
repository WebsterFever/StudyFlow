import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerMilestone } from './planner-milestone.entity';
import { PlannerMilestonesService } from './planner-milestones.service';
import { PlannerMilestonesController } from './planner-milestones.controller';
import { PlannerGoalsModule } from '../planner-goals/planner-goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlannerMilestone]), PlannerGoalsModule],
  providers: [PlannerMilestonesService],
  controllers: [PlannerMilestonesController],
  exports: [PlannerMilestonesService],
})
export class PlannerMilestonesModule {}
