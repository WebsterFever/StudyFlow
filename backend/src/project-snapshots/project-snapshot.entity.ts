import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { ProjectFile } from './project-file.entity';

// A read-only snapshot of an uploaded project folder at one point in a
// student's progress (e.g. "Authentication Added" at Aula 5). Owned by the
// StudyNote that represents it in the Notes feed — deleting that note
// cascades here (and from here to every ProjectFile), which is what makes
// "delete note" the single action that cleans up an entire snapshot.
@Entity('project_snapshots')
export class ProjectSnapshot {
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

  @Index()
  @Column({ type: 'uuid' })
  studyItemId: string;

  @ManyToOne(() => StudyItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studyItemId' })
  studyItem: StudyItem;

  @Index()
  @Column({ type: 'uuid' })
  noteId: string;

  @ManyToOne(() => StudyNote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: StudyNote;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  fileCount: number;

  @Column({ type: 'int' })
  totalSize: number;

  @OneToMany(() => ProjectFile, (file) => file.projectSnapshot)
  files: ProjectFile[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
