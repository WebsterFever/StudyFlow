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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
