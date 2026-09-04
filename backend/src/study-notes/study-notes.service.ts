import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyNote, type StudyNoteType } from './study-note.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateStudyNoteDto } from './dto/create-study-note.dto';
import { UpdateStudyNoteDto } from './dto/update-study-note.dto';
import { GoalsService } from '../goals/goals.service';

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Enforces each note type's minimum required fields — kept here rather than as a custom class-validator to keep one clear error message per type. */
function assertValidNotePayload(type: StudyNoteType, fields: { title?: string | null; content?: string | null; url?: string | null }): void {
  const title = fields.title?.trim();
  const content = fields.content?.trim();
  const url = fields.url?.trim();

  switch (type) {
    case 'question':
      if (!title) throw new BadRequestException('A question note needs a question.');
      break;
    case 'resource':
      if (!title) throw new BadRequestException('A resource note needs a title.');
      if (!url) throw new BadRequestException('A resource note needs a URL.');
      if (!isValidUrl(url)) throw new BadRequestException('That URL does not look valid.');
      break;
    case 'text':
    case 'important':
    case 'command':
    case 'code':
      if (!content) throw new BadRequestException(`A ${type} note needs content.`);
      break;
  }
}

@Injectable()
export class StudyNotesService {
  constructor(
    @InjectRepository(StudyNote) private readonly notesRepository: Repository<StudyNote>,
    @InjectRepository(StudyItem) private readonly itemsRepository: Repository<StudyItem>,
    private readonly goalsService: GoalsService,
  ) {}

  private async findOwnedItem(userId: string, goalId: string, studyItemId: string): Promise<StudyItem> {
    const item = await this.itemsRepository.findOne({ where: { id: studyItemId, goalId, userId } });
    if (!item) {
      throw new NotFoundException('Study item not found.');
    }
    return item;
  }

  /** All notes for one study item, in creation/manual order. */
  async findAllForItem(userId: string, goalId: string, studyItemId: string): Promise<StudyNote[]> {
    await this.findOwnedItem(userId, goalId, studyItemId);
    return this.notesRepository.find({ where: { userId, goalId, studyItemId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  /** All notes for a whole goal, ordered by the study item's own order then note order — the "Study Notes" notebook view. */
  async findAllForGoal(userId: string, goalId: string): Promise<StudyNote[]> {
    await this.goalsService.assertOwnership(userId, goalId);
    return this.notesRepository
      .createQueryBuilder('note')
      .innerJoin(StudyItem, 'item', 'item.id = note.studyItemId')
      .where('note.userId = :userId AND note.goalId = :goalId', { userId, goalId })
      .orderBy('item.order', 'ASC')
      .addOrderBy('note.sortOrder', 'ASC')
      .addOrderBy('note.createdAt', 'ASC')
      .select('note.*')
      .getRawMany<StudyNote>();
  }

  private async nextSortOrder(userId: string, studyItemId: string): Promise<number> {
    const max = await this.notesRepository
      .createQueryBuilder('note')
      .select('MAX(note.sortOrder)', 'max')
      .where('note.userId = :userId AND note.studyItemId = :studyItemId', { userId, studyItemId })
      .getRawOne<{ max: string | null }>();
    return max?.max != null ? Number(max.max) + 1 : 0;
  }

  async create(userId: string, dto: CreateStudyNoteDto): Promise<StudyNote> {
    await this.findOwnedItem(userId, dto.goalId, dto.studyItemId);
    assertValidNotePayload(dto.type, dto);

    const sortOrder = await this.nextSortOrder(userId, dto.studyItemId);
    const note = this.notesRepository.create({
      userId,
      goalId: dto.goalId,
      studyItemId: dto.studyItemId,
      type: dto.type,
      title: dto.title ?? null,
      content: dto.content ?? null,
      fileName: dto.fileName ?? null,
      codeLanguage: dto.codeLanguage ?? null,
      url: dto.url ?? null,
      sortOrder,
    });
    return this.notesRepository.save(note);
  }

  private async findOwned(userId: string, id: string): Promise<StudyNote> {
    const note = await this.notesRepository.findOne({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException('Note not found.');
    }
    return note;
  }

  async update(userId: string, id: string, dto: UpdateStudyNoteDto): Promise<StudyNote> {
    const note = await this.findOwned(userId, id);
    const merged = {
      type: dto.type ?? note.type,
      title: dto.title !== undefined ? dto.title : note.title,
      content: dto.content !== undefined ? dto.content : note.content,
      url: dto.url !== undefined ? dto.url : note.url,
    };
    assertValidNotePayload(merged.type, merged);

    if (dto.type !== undefined) note.type = dto.type;
    if (dto.title !== undefined) note.title = dto.title ?? null;
    if (dto.content !== undefined) note.content = dto.content ?? null;
    if (dto.fileName !== undefined) note.fileName = dto.fileName ?? null;
    if (dto.codeLanguage !== undefined) note.codeLanguage = dto.codeLanguage ?? null;
    if (dto.url !== undefined) note.url = dto.url ?? null;
    if (dto.sortOrder !== undefined) note.sortOrder = dto.sortOrder;

    return this.notesRepository.save(note);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.notesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Note not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.notesRepository.delete({ userId });
  }
}
