import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { DayOverride } from '../day-overrides/day-override.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { UsersModule } from '../users/users.module';
import { DataService } from './data.service';
import { DataController } from './data.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudyGoal, StudyItem, StudySession, DayOverride, StudyNote]), UsersModule],
  providers: [DataService],
  controllers: [DataController],
})
export class DataModule {}
