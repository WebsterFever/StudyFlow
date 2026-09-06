import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerGoal } from './planner-goal.entity';
import { PlannerGoalsService } from './planner-goals.service';
import { PlannerGoalsController } from './planner-goals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlannerGoal])],
  providers: [PlannerGoalsService],
  controllers: [PlannerGoalsController],
  exports: [PlannerGoalsService],
})
export class PlannerGoalsModule {}
