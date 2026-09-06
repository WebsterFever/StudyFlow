import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';

@Entity('exams')
export class Exam {
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

  @Column({ type: 'date' })
  examDate: string;

  @Column({ type: 'boolean', default: true })
  reminderEnabled: boolean;

  // One-shot, same semantics as Assignment.reminderSentAt.
  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
