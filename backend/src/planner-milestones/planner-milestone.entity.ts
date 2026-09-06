import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { PlannerGoal } from '../planner-goals/planner-goal.entity';

@Entity('planner_milestones')
export class PlannerMilestone {
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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
