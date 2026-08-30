import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('day_overrides')
@Unique(['userId', 'date'])
export class DayOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

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
