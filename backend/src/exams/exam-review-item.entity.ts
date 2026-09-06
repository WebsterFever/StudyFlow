import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Exam } from './exam.entity';
import { StudyItem } from '../study-items/study-item.entity';

// Many-to-many: a lesson can be flagged for review on multiple exams, and an
// exam can reference multiple lessons. Exam progress (% complete) is derived
// from these links' underlying StudyItem.completed at read time, not stored.
@Entity('exam_review_items')
@Unique(['examId', 'studyItemId'])
export class ExamReviewItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  examId: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Index()
  @Column({ type: 'uuid' })
  studyItemId: string;

  @ManyToOne(() => StudyItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studyItemId' })
  studyItem: StudyItem;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
