import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';
export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['not_started', 'in_progress', 'completed'];

export type AssignmentPriority = 'Low' | 'Medium' | 'High';
export const ASSIGNMENT_PRIORITIES: AssignmentPriority[] = ['Low', 'Medium', 'High'];

@Entity('assignments')
export class Assignment {
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
  dueDate: string;

  @Column({ type: 'varchar', length: 16, default: 'not_started' })
  status: AssignmentStatus;

  @Column({ type: 'varchar', length: 16, default: 'Medium' })
  priority: AssignmentPriority;

  @Column({ type: 'boolean', default: true })
  reminderEnabled: boolean;

  // One-shot: set once a "due today, not yet completed" email is sent, and
  // never cleared — an assignment reminder is not a recurring nudge like a
  // goal's, it just needs to fire once around the due date.
  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
