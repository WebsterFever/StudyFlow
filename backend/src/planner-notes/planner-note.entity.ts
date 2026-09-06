import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { PlannerGoal } from '../planner-goals/planner-goal.entity';

// Deliberately a single plain-text note type — PlannerFlow has no code/project
// concepts, so it doesn't need StudyNote's multi-type system.
@Entity('planner_notes')
export class PlannerNote {
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

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
