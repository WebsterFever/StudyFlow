import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerNote } from './planner-note.entity';
import { PlannerNotesService } from './planner-notes.service';
import { PlannerNotesController } from './planner-notes.controller';
import { PlannerGoalsModule } from '../planner-goals/planner-goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlannerNote]), PlannerGoalsModule],
  providers: [PlannerNotesService],
  controllers: [PlannerNotesController],
  exports: [PlannerNotesService],
})
export class PlannerNotesModule {}
