import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyItem } from './study-item.entity';
import { CreateStudyItemDto } from './dto/create-study-item.dto';
import { UpdateStudyItemDto } from './dto/update-study-item.dto';
import { GoalsService } from '../goals/goals.service';

@Injectable()
export class StudyItemsService {
  constructor(
    @InjectRepository(StudyItem)
    private readonly itemsRepository: Repository<StudyItem>,
    private readonly goalsService: GoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<StudyItem[]> {
    return this.itemsRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { order: 'ASC', createdDate: 'ASC' },
    });
  }

  private async nextOrder(userId: string, goalId: string): Promise<number> {
    const max = await this.itemsRepository
      .createQueryBuilder('item')
      .select('MAX(item.order)', 'max')
      .where('item.userId = :userId AND item.goalId = :goalId', { userId, goalId })
      .getRawOne<{ max: string | null }>();
    return max?.max != null ? Number(max.max) + 1 : 0;
  }

  async create(userId: string, dto: CreateStudyItemDto): Promise<StudyItem> {
    await this.goalsService.assertOwnership(userId, dto.goalId);
    const order = dto.order ?? (await this.nextOrder(userId, dto.goalId));
    const item = this.itemsRepository.create({
      ...dto,
      notes: dto.notes ?? '',
      order,
      userId,
    });
    return this.itemsRepository.save(item);
  }

  async bulkCreate(userId: string, items: CreateStudyItemDto[]): Promise<StudyItem[]> {
    const goalIds = Array.from(new Set(items.map((i) => i.goalId)));
    await Promise.all(goalIds.map((goalId) => this.goalsService.assertOwnership(userId, goalId)));

    const nextOrderByGoal = new Map<string, number>();
    for (const goalId of goalIds) {
      nextOrderByGoal.set(goalId, await this.nextOrder(userId, goalId));
    }

    const entities = items.map((dto) => {
      const order = dto.order ?? nextOrderByGoal.get(dto.goalId)!;
      nextOrderByGoal.set(dto.goalId, order + 1);
      return this.itemsRepository.create({ ...dto, notes: dto.notes ?? '', order, userId });
    });
    return this.itemsRepository.save(entities);
  }

  private async findOwned(userId: string, id: string): Promise<StudyItem> {
    const item = await this.itemsRepository.findOne({ where: { id, userId } });
    if (!item) {
      throw new NotFoundException('Study item not found.');
    }
    return item;
  }

  async update(userId: string, id: string, dto: UpdateStudyItemDto): Promise<StudyItem> {
    const item = await this.findOwned(userId, id);
    const wasCompleted = item.completed;
    Object.assign(item, dto);
    if (dto.completed === true && !wasCompleted) {
      item.completedDate = new Date();
    } else if (dto.completed === false) {
      item.completedDate = null;
    }
    return this.itemsRepository.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.itemsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Study item not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.itemsRepository.delete({ userId });
  }
}
