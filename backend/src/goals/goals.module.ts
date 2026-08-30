import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyGoal } from './goal.entity';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudyGoal])],
  providers: [GoalsService],
  controllers: [GoalsController],
  exports: [GoalsService],
})
export class GoalsModule {}
