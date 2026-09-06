import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudySession } from '../study-sessions/study-session.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Exam } from '../exams/exam.entity';
import { ExamReviewItem } from '../exams/exam-review-item.entity';
import { EmailModule } from '../email/email.module';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudyGoal, StudyItem, StudySession, Assignment, Exam, ExamReviewItem]), EmailModule],
  providers: [RemindersService],
  controllers: [RemindersController],
})
export class RemindersModule {}
