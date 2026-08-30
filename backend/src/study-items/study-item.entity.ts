import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';

export type StudyType = 'Video' | 'Exercise' | 'Project' | 'Reading' | 'Review';
export type Difficulty = 'Easy' | 'Intermediate' | 'Hard';
export type Priority = 'Low' | 'Medium' | 'High';

// Every item belongs to exactly one goal. userId is kept denormalized
// alongside goalId so ownership checks never need to join through the goal.
@Entity('study_items')
export class StudyItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  course: string;

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @Column({ type: 'varchar', length: 32 })
  type: StudyType;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 32 })
  difficulty: Difficulty;

  @Column({ type: 'varchar', length: 32 })
  priority: Priority;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedDate: Date | null;

  @Column({ type: 'smallint', nullable: true })
  mastery: number | null;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
