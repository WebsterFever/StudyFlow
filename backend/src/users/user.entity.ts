import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  // Never selected by default; services must opt in with .addSelect() for login checks.
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  // Set once the user's legacy localStorage data has been imported, so the
  // migration prompt/endpoint stays idempotent across repeated attempts.
  @Column({ type: 'timestamptz', nullable: true })
  localDataMigratedAt: Date | null;

  // IANA timezone (e.g. "America/Toronto"), used to render reminder emails in
  // local time and to evaluate quiet hours. Defaults to UTC until the user sets it.
  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone: string;

  @Column({ type: 'boolean', default: false })
  quietHoursEnabled: boolean;

  // "HH:mm" 24-hour local time, e.g. "22:00". Null when quiet hours are off.
  @Column({ type: 'varchar', length: 5, nullable: true })
  quietHoursStart: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  quietHoursEnd: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
