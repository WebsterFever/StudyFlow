import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { PlannerGoal } from '../planner-goals/planner-goal.entity';
import { PlannerMilestone } from '../planner-milestones/planner-milestone.entity';

export type PlannerTaskStatus = 'not_started' | 'in_progress' | 'completed';
export const PLANNER_TASK_STATUSES: PlannerTaskStatus[] = ['not_started', 'in_progress', 'completed'];

export type PlannerTaskPriority = 'Low' | 'Medium' | 'High';
export const PLANNER_TASK_PRIORITIES: PlannerTaskPriority[] = ['Low', 'Medium', 'High'];

@Entity('planner_tasks')
export class PlannerTask {
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

  @ManyToOne(() => PlannerGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal: PlannerGoal;

  // Optional: a task can belong directly to a goal without going through a milestone.
  @Index()
  @Column({ type: 'uuid', nullable: true })
  milestoneId: string | null;

  @ManyToOne(() => PlannerMilestone, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'milestoneId' })
  milestone: PlannerMilestone | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'varchar', length: 16, default: 'Medium' })
  priority: PlannerTaskPriority;

  @Column({ type: 'varchar', length: 16, default: 'not_started' })
  status: PlannerTaskStatus;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  // Only meaningful when isRecurring — completing the task advances dueDate
  // by this many days and resets status instead of leaving it completed.
  @Column({ type: 'int', nullable: true })
  recurrenceIntervalDays: number | null;

  @Column({ type: 'boolean', default: true })
  reminderEnabled: boolean;

  // One-shot: same semantics as Assignment.reminderSentAt. Reset to null
  // whenever dueDate changes, the task is reopened, or a recurring task
  // auto-advances on completion.
  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
