import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type PlannerGoalStatus = 'active' | 'completed' | 'paused';
export const PLANNER_GOAL_STATUSES: PlannerGoalStatus[] = ['active', 'completed', 'paused'];

export type PlannerGoalPriority = 'Low' | 'Medium' | 'High';
export const PLANNER_GOAL_PRIORITIES: PlannerGoalPriority[] = ['Low', 'Medium', 'High'];

// A general life/work goal — deliberately simpler than StudyGoal (no
// startDate/dailyHours/learningType, since PlannerFlow has no study-session
// scheduler). Deadline is optional: unlike a course, a life goal may be
// open-ended ("Get fit", "Learn to cook").
@Entity('planner_goals')
export class PlannerGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: PlannerGoalStatus;

  @Column({ type: 'varchar', length: 16, default: 'Medium' })
  priority: PlannerGoalPriority;

  @Column({ type: 'boolean', default: false })
  reminderEnabled: boolean;

  @Column({ type: 'int', default: 1440 })
  reminderIntervalMinutes: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReminderSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
