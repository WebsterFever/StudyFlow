import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './exam.entity';
import { ExamReviewItem } from './exam-review-item.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamReviewItem, StudyItem]), GoalsModule],
  providers: [ExamsService],
  controllers: [ExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
