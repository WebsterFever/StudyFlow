import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StudySession } from './study-session.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateStudySessionDto } from './dto/update-study-session.dto';
import { ReorderSessionsDto } from './dto/reorder-sessions.dto';
import { GoalsService } from '../goals/goals.service';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly sessionsRepository: Repository<StudySession>,
    @InjectRepository(StudyItem)
    private readonly itemsRepository: Repository<StudyItem>,
    private readonly goalsService: GoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<StudySession[]> {
    return this.sessionsRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { date: 'ASC', order: 'ASC' },
    });
  }

  /**
   * Loads the items referenced by `itemIds`, verifying every one belongs to
   * `userId` and (when `goalId` is given) to that specific goal — a session's
   * goal is always derived from its item server-side, never trusted from the client.
   */
  private async loadOwnedItems(userId: string, itemIds: string[], goalId?: string): Promise<Map<string, StudyItem>> {
    const uniqueIds = Array.from(new Set(itemIds));
    if (uniqueIds.length === 0) return new Map();
    const items = await this.itemsRepository.find({ where: { userId, id: In(uniqueIds) } });
    if (items.length !== uniqueIds.length) {
      throw new BadRequestException('One or more sessions reference a study item that does not belong to you.');
    }
    if (goalId && items.some((i) => i.goalId !== goalId)) {
      throw new BadRequestException('One or more sessions reference an item from a different goal.');
    }
    return new Map(items.map((i) => [i.id, i]));
  }

  async create(userId: string, dto: CreateStudySessionDto): Promise<StudySession> {
    const itemsById = await this.loadOwnedItems(userId, [dto.itemId]);
    const item = itemsById.get(dto.itemId)!;
    const session = this.sessionsRepository.create({
      ...dto,
      goalId: item.goalId,
      partIndex: dto.partIndex ?? 1,
      partTotal: dto.partTotal ?? 1,
      status: dto.status ?? 'planned',
      userId,
    });
    return this.sessionsRepository.save(session);
  }

  /**
   * Full transactional replace **scoped to one goal**, used after the
   * frontend's plan generator (utils/planGenerator.ts) recomputes that goal's
   * session list client-side. Only ever touches sessions belonging to `goalId`
   * — other goals' schedules are untouched. The backend never recomputes the
   * plan itself, it only persists what the frontend already computed.
   */
  async replaceAll(userId: string, goalId: string, sessions: CreateStudySessionDto[]): Promise<StudySession[]> {
    await this.goalsService.assertOwnership(userId, goalId);
    // Verifies every referenced item belongs to this user and this exact goal; throws otherwise.
    await this.loadOwnedItems(
      userId,
      sessions.map((s) => s.itemId),
      goalId,
    );

    return this.sessionsRepository.manager.transaction(async (manager) => {
      await manager.delete(StudySession, { userId, goalId });
      const entities = sessions.map((dto) =>
        manager.create(StudySession, {
          ...dto,
          goalId,
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
      const sessions = await manager.find(StudySession, { where: { userId, goalId: dto.goalId, date: dto.date } });
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
