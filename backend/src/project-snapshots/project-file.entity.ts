import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectSnapshot } from './project-snapshot.entity';

// Stored in Postgres for this first version — student source files are small
// text, and the service enforces per-file/total-size caps specifically to
// keep that reasonable (see project-snapshots.service.ts). `storageKey` is
// reserved, unused for now: if a future version moves content to S3, that
// migration only touches how `content` is read/written, not this schema.
@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  projectSnapshotId: string;

  @ManyToOne(() => ProjectSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectSnapshotId' })
  projectSnapshot: ProjectSnapshot;

  // Denormalized for a defense-in-depth ownership check on individual file reads.
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 1024 })
  path: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  extension: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  mimeType: string | null;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'boolean', default: false })
  isDirectory: boolean;

  // Null for any file type outside the supported text-source allowlist.
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  storageKey: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
