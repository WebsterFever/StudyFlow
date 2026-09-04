import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyNote } from './study-note.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudyNotesService } from './study-notes.service';
import { StudyNotesController } from './study-notes.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudyNote, StudyItem]), GoalsModule],
  providers: [StudyNotesService],
  controllers: [StudyNotesController],
  exports: [StudyNotesService],
})
export class StudyNotesModule {}
