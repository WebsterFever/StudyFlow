import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { StudyGoal } from '../goals/goal.entity';
import { StudyItem } from '../study-items/study-item.entity';

export type StudyNoteType = 'text' | 'code' | 'important' | 'question' | 'command' | 'resource' | 'project';

export const STUDY_NOTE_TYPES: StudyNoteType[] = ['text', 'code', 'important', 'question', 'command', 'resource', 'project'];

// A study item can have unlimited notes. userId and goalId are kept
// denormalized alongside studyItemId (same pattern as StudyItem/StudySession)
// so ownership checks and goal-wide listing never need an extra join.
@Entity('study_notes')
export class StudyNote {
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

  @Column({ type: 'varchar', length: 16 })
  type: StudyNoteType;

  // Field meaning varies by type: text/important/command use it as an
  // optional heading; question uses it as the question text itself (required);
  // resource uses it as the resource's title (required).
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  // Field meaning varies by type: the body for text/important/command/code,
  // the answer/explanation for question, the description for resource.
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  codeLanguage: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  url: string | null;

  // Denormalized convenience pointer for type='project' notes only, set once
  // at creation by ProjectSnapshotsService — lets the Notes feed link straight
  // to "Open Project" without an extra lookup. The authoritative FK runs the
  // other way (ProjectSnapshot.noteId, ON DELETE CASCADE) so deleting this
  // note is what deletes the snapshot, matching the normal "delete note" action.
  @Column({ type: 'uuid', nullable: true })
  projectSnapshotId: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
