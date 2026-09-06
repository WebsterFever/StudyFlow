import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamReviewItem } from './exam-review-item.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { GoalsService } from '../goals/goals.service';

export interface ExamWithProgress extends Exam {
  reviewItemIds: string[];
  progressPercent: number;
}

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private readonly examsRepository: Repository<Exam>,
    @InjectRepository(ExamReviewItem) private readonly reviewItemsRepository: Repository<ExamReviewItem>,
    @InjectRepository(StudyItem) private readonly studyItemsRepository: Repository<StudyItem>,
    private readonly goalsService: GoalsService,
  ) {}

  /** Batches review-item lookups for a list of exams into one query instead of N+1. */
  private async attachProgress(exams: Exam[]): Promise<ExamWithProgress[]> {
    if (exams.length === 0) return [];
    const links = await this.reviewItemsRepository.find({
      where: { examId: In(exams.map((e) => e.id)) },
      relations: { studyItem: true },
    });
    const byExam = new Map<string, ExamReviewItem[]>();
    for (const link of links) {
      const list = byExam.get(link.examId) ?? [];
      list.push(link);
      byExam.set(link.examId, list);
    }
    return exams.map((exam) => {
      const examLinks = byExam.get(exam.id) ?? [];
      const completed = examLinks.filter((l) => l.studyItem?.completed).length;
      return {
        ...exam,
        reviewItemIds: examLinks.map((l) => l.studyItemId),
        progressPercent: examLinks.length === 0 ? 0 : Math.round((completed / examLinks.length) * 100),
      };
    });
  }

  async findAllForUser(userId: string, goalId?: string): Promise<ExamWithProgress[]> {
    const exams = await this.examsRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { examDate: 'ASC' },
    });
    return this.attachProgress(exams);
  }

  private async findOwned(userId: string, id: string): Promise<Exam> {
    const exam = await this.examsRepository.findOne({ where: { id, userId } });
    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }
    return exam;
  }

  async create(userId: string, dto: CreateExamDto): Promise<ExamWithProgress> {
    await this.goalsService.assertOwnership(userId, dto.goalId);
    const exam = this.examsRepository.create({ ...dto, userId });
    const saved = await this.examsRepository.save(exam);
    return { ...saved, reviewItemIds: [], progressPercent: 0 };
  }

  async update(userId: string, id: string, dto: UpdateExamDto): Promise<ExamWithProgress> {
    const exam = await this.findOwned(userId, id);
    if (dto.examDate && dto.examDate !== exam.examDate) {
      exam.reminderSentAt = null;
    }
    Object.assign(exam, dto);
    const saved = await this.examsRepository.save(exam);
    const [withProgress] = await this.attachProgress([saved]);
    return withProgress;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.examsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Exam not found.');
    }
  }

  /** Replaces the exam's full set of linked review items — validates every id belongs to the same user + goal as the exam. */
  async replaceReviewItems(userId: string, examId: string, studyItemIds: string[]): Promise<ExamWithProgress> {
    const exam = await this.findOwned(userId, examId);

    if (studyItemIds.length > 0) {
      const validItems = await this.studyItemsRepository.find({ where: { id: In(studyItemIds), userId, goalId: exam.goalId } });
      if (validItems.length !== studyItemIds.length) {
        throw new NotFoundException('One or more study items were not found in this exam\'s goal.');
      }
    }

    await this.reviewItemsRepository.delete({ examId });
    if (studyItemIds.length > 0) {
      const links = studyItemIds.map((studyItemId) => this.reviewItemsRepository.create({ userId, examId, studyItemId }));
      await this.reviewItemsRepository.save(links);
    }

    const [withProgress] = await this.attachProgress([exam]);
    return withProgress;
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.reviewItemsRepository.delete({ userId });
    await this.examsRepository.delete({ userId });
  }
}
