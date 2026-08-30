import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';

@Entity('day_overrides')
@Unique(['userId', 'goalId', 'date'])
export class DayOverride {
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

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'boolean', default: false })
  unavailable: boolean;

  @Column({ type: 'real', nullable: true })
  hoursOverride: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
