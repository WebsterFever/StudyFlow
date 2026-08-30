import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export interface DailyHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export type GoalStatus = 'active' | 'completed' | 'paused';

// A user can have many goals (Infnet, Frontend Mastery, React Advanced, ...),
// each with its own independent study items, sessions and schedule.
@Entity('study_goals')
export class StudyGoal {
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

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  deadline: string;

  @Column({ type: 'jsonb' })
  dailyHours: DailyHours;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: GoalStatus;

  @Column({ type: 'boolean', default: false })
  reminderEnabled: boolean;

  @Column({ type: 'int', default: 120 })
  reminderIntervalMinutes: number;

  // Null until the first reminder email is sent for this goal.
  @Column({ type: 'timestamptz', nullable: true })
  lastReminderSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
