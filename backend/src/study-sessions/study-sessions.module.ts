import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySession } from './study-session.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudySession, StudyItem]), GoalsModule],
  providers: [StudySessionsService],
  controllers: [StudySessionsController],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}
