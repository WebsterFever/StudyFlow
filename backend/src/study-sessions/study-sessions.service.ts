import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StudySession } from './study-session.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateStudySessionDto } from './dto/update-study-session.dto';
import { ReorderSessionsDto } from './dto/reorder-sessions.dto';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly sessionsRepository: Repository<StudySession>,
    @InjectRepository(StudyItem)
    private readonly itemsRepository: Repository<StudyItem>,
  ) {}

  findAllForUser(userId: string): Promise<StudySession[]> {
    return this.sessionsRepository.find({ where: { userId }, order: { date: 'ASC', order: 'ASC' } });
  }

  private async assertItemsOwnedByUser(userId: string, itemIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(itemIds));
    if (uniqueIds.length === 0) return;
    const owned = await this.itemsRepository.count({ where: { userId, id: In(uniqueIds) } });
    if (owned !== uniqueIds.length) {
      throw new BadRequestException('One or more sessions reference a study item that does not belong to you.');
    }
  }

  async create(userId: string, dto: CreateStudySessionDto): Promise<StudySession> {
    await this.assertItemsOwnedByUser(userId, [dto.itemId]);
    const session = this.sessionsRepository.create({
      ...dto,
      partIndex: dto.partIndex ?? 1,
      partTotal: dto.partTotal ?? 1,
      status: dto.status ?? 'planned',
      userId,
    });
    return this.sessionsRepository.save(session);
  }

  /**
   * Full transactional replace, used after the frontend's plan generator
   * (utils/planGenerator.ts) recomputes the entire session list client-side.
   * The backend does not recompute the plan itself — it only persists it.
   */
  async replaceAll(userId: string, sessions: CreateStudySessionDto[]): Promise<StudySession[]> {
    await this.assertItemsOwnedByUser(
      userId,
      sessions.map((s) => s.itemId),
    );
    return this.sessionsRepository.manager.transaction(async (manager) => {
      await manager.delete(StudySession, { userId });
      const entities = sessions.map((dto) =>
        manager.create(StudySession, {
          ...dto,
          partIndex: dto.partIndex ?? 1,
          partTotal: dto.partTotal ?? 1,
          status: dto.status ?? 'planned',
          userId,
        }),
      );
      if (entities.length === 0) return [];
      return manager.save(StudySession, entities);
    });
  }

  private async findOwned(userId: string, id: string): Promise<StudySession> {
    const session = await this.sessionsRepository.findOne({ where: { id, userId } });
    if (!session) {
      throw new NotFoundException('Study session not found.');
    }
    return session;
  }

  async update(userId: string, id: string, dto: UpdateStudySessionDto): Promise<StudySession> {
    const session = await this.findOwned(userId, id);
    Object.assign(session, dto);
    return this.sessionsRepository.save(session);
  }

  async reorder(userId: string, dto: ReorderSessionsDto): Promise<StudySession[]> {
    return this.sessionsRepository.manager.transaction(async (manager) => {
      const sessions = await manager.find(StudySession, { where: { userId, date: dto.date } });
      const byId = new Map(sessions.map((s) => [s.id, s]));
      const updated: StudySession[] = [];
      dto.orderedIds.forEach((id, index) => {
        const session = byId.get(id);
        if (session) {
          session.order = index;
          session.manuallyAdjusted = true;
          updated.push(session);
        }
      });
      if (updated.length === 0) return [];
      return manager.save(StudySession, updated);
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.sessionsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Study session not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.sessionsRepository.delete({ userId });
  }
}
