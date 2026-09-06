import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { PlannerTask } from '../planner-tasks/planner-task.entity';

@Entity('planner_subtasks')
export class PlannerSubtask {
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
  taskId: string;

  @ManyToOne(() => PlannerTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: PlannerTask;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
