import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudyGoal } from '../goals/goal.entity';

export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'skipped';

@Entity('study_sessions')
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Denormalized alongside the itemId/goalId relations so every query can be
  // scoped to `WHERE userId = :userId` (or goalId) without a join.
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  goalId: string;

  @ManyToOne(() => StudyGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal: StudyGoal;

  @Index()
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => StudyItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: StudyItem;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'int' })
  plannedMinutes: number;

  @Column({ type: 'int', default: 1 })
  partIndex: number;

  @Column({ type: 'int', default: 1 })
  partTotal: number;

  @Column({ type: 'varchar', length: 16, default: 'planned' })
  status: SessionStatus;

  @Column({ type: 'int', nullable: true })
  actualMinutes: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  manuallyAdjusted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
