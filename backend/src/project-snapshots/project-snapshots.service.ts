import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProjectSnapshot } from './project-snapshot.entity';
import { ProjectFile } from './project-file.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateProjectSnapshotDto } from './dto/create-project-snapshot.dto';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_BYTES, MAX_TOTAL_SIZE_BYTES, getFileExtension, isDisplayableAsText, isPathExcluded } from './project-file-rules';

@Injectable()
export class ProjectSnapshotsService {
  constructor(
    @InjectRepository(ProjectSnapshot) private readonly snapshotsRepository: Repository<ProjectSnapshot>,
    @InjectRepository(ProjectFile) private readonly filesRepository: Repository<ProjectFile>,
    @InjectRepository(StudyNote) private readonly notesRepository: Repository<StudyNote>,
    @InjectRepository(StudyItem) private readonly itemsRepository: Repository<StudyItem>,
    private readonly dataSource: DataSource,
  ) {}

  private async findOwnedItem(userId: string, goalId: string, studyItemId: string): Promise<StudyItem> {
    const item = await this.itemsRepository.findOne({ where: { id: studyItemId, goalId, userId } });
    if (!item) {
      throw new NotFoundException('Study item not found.');
    }
    return item;
  }

  private async nextNoteSortOrder(userId: string, studyItemId: string): Promise<number> {
    const max = await this.notesRepository
      .createQueryBuilder('note')
      .select('MAX(note.sortOrder)', 'max')
      .where('note.userId = :userId AND note.studyItemId = :studyItemId', { userId, studyItemId })
      .getRawOne<{ max: string | null }>();
    return max?.max != null ? Number(max.max) + 1 : 0;
  }

  async create(userId: string, dto: CreateProjectSnapshotDto): Promise<{ note: StudyNote; snapshot: ProjectSnapshot }> {
    await this.findOwnedItem(userId, dto.goalId, dto.studyItemId);

    // Server-side re-validation — the frontend applies the same exclusion
    // rules before upload, but that's only for bandwidth/UX, never trusted alone.
    const acceptedFiles = dto.files.filter((f) => !isPathExcluded(f.path));
    if (acceptedFiles.length === 0) {
      throw new BadRequestException('No files to upload after excluding node_modules, .git, .env, and similar.');
    }
    if (acceptedFiles.length > MAX_FILE_COUNT) {
      throw new BadRequestException(`This project has ${acceptedFiles.length} files, which exceeds the ${MAX_FILE_COUNT}-file limit.`);
    }

    let totalSize = 0;
    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(`"${file.path}" is larger than the ${Math.round(MAX_FILE_SIZE_BYTES / 1024)}KB per-file limit.`);
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      throw new BadRequestException(`This project totals ${(totalSize / 1024 / 1024).toFixed(1)}MB, which exceeds the ${Math.round(MAX_TOTAL_SIZE_BYTES / 1024 / 1024)}MB limit.`);
    }

    const sortOrder = await this.nextNoteSortOrder(userId, dto.studyItemId);

    // All-or-nothing: either every row (note + snapshot + every file) commits,
    // or none do — a failed upload never leaves a half-created snapshot behind.
    return this.dataSource.transaction(async (manager) => {
      const note = manager.create(StudyNote, {
        userId,
        goalId: dto.goalId,
        studyItemId: dto.studyItemId,
        type: 'project',
        title: dto.name,
        // Reuses the generic `content` field as a plain human-readable
        // summary (e.g. "23 files") so the Notes feed can show it without
        // an extra fetch per project note — avoids a dedicated column for
        // one derived, rarely-changing number.
        content: `${acceptedFiles.length} file${acceptedFiles.length === 1 ? '' : 's'}`,
        sortOrder,
      });
      await manager.save(note);

      const snapshot = manager.create(ProjectSnapshot, {
        userId,
        goalId: dto.goalId,
        studyItemId: dto.studyItemId,
        noteId: note.id,
        name: dto.name,
        fileCount: acceptedFiles.length,
        totalSize,
      });
      await manager.save(snapshot);

      const fileEntities = acceptedFiles.map((file) => {
        const name = file.path.split('/').pop() || file.path;
        const displayable = isDisplayableAsText(name);
        return manager.create(ProjectFile, {
          projectSnapshotId: snapshot.id,
          userId,
          path: file.path,
          name,
          extension: getFileExtension(name),
          mimeType: null,
          size: file.size,
          isDirectory: false,
          content: displayable ? (file.content ?? '') : null,
        });
      });
      await manager.save(ProjectFile, fileEntities);

      note.projectSnapshotId = snapshot.id;
      await manager.save(note);

      return { note, snapshot };
    });
  }

  async findOne(userId: string, id: string): Promise<{ snapshot: ProjectSnapshot; files: ProjectFile[] }> {
    const snapshot = await this.snapshotsRepository.findOne({ where: { id, userId } });
    if (!snapshot) {
      throw new NotFoundException('Project snapshot not found.');
    }
    const files = await this.filesRepository.find({ where: { projectSnapshotId: id, userId }, order: { path: 'ASC' } });
    return { snapshot, files };
  }
}
