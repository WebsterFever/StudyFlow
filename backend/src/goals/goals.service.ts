import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyGoal } from './goal.entity';
import type { DailyHours } from './goal.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function assertValidGoalPayload(dto: { startDate: string; deadline: string; dailyHours: DailyHours }): void {
  if (dto.deadline < dto.startDate) {
    throw new BadRequestException('Deadline cannot be before the start date.');
  }
  for (const day of WEEKDAYS) {
    const value = dto.dailyHours?.[day];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new BadRequestException(`Daily hours for ${day} must be a number.`);
    }
    if (value < 0) {
      throw new BadRequestException('Daily study hours cannot be negative.');
    }
  }
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(StudyGoal)
    private readonly goalsRepository: Repository<StudyGoal>,
    @InjectRepository(StudyItem)
    private readonly itemsRepository: Repository<StudyItem>,
  ) {}

  findAllForUser(userId: string): Promise<StudyGoal[]> {
    return this.goalsRepository.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  /** Fetches a goal while verifying it belongs to the authenticated user; 404s otherwise (never 403 — don't leak existence). */
  async findOneOwned(userId: string, id: string): Promise<StudyGoal> {
    const goal = await this.goalsRepository.findOne({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException('Goal not found.');
    }
    return goal;
  }

  /** Throws if `goalId` doesn't exist or doesn't belong to `userId`. Used by other modules before attaching resources to a goal. */
  async assertOwnership(userId: string, goalId: string): Promise<void> {
    await this.findOneOwned(userId, goalId);
  }

  async create(userId: string, dto: CreateGoalDto): Promise<StudyGoal> {
    assertValidGoalPayload(dto);
    const goal = this.goalsRepository.create({ ...dto, userId, status: 'active' });
    return this.goalsRepository.save(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<StudyGoal> {
    const goal = await this.findOneOwned(userId, id);
    const merged = {
      startDate: dto.startDate ?? goal.startDate,
      deadline: dto.deadline ?? goal.deadline,
      dailyHours: dto.dailyHours ?? goal.dailyHours,
    };
    if (dto.startDate || dto.deadline || dto.dailyHours) {
      assertValidGoalPayload(merged);
    }
    Object.assign(goal, dto);
    return this.goalsRepository.save(goal);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.goalsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Goal not found.');
    }
  }

  /** Clones the goal's settings and its study items (fresh, uncompleted) as a brand-new goal. */
  async duplicate(userId: string, id: string, name?: string): Promise<{ goal: StudyGoal; items: StudyItem[] }> {
    const source = await this.findOneOwned(userId, id);
    const clone = this.goalsRepository.create({
      userId,
      name: name?.trim() || `${source.name} (Copy)`,
      startDate: source.startDate,
      deadline: source.deadline,
      dailyHours: source.dailyHours,
      learningType: source.learningType,
      status: 'active',
    });
    const saved = await this.goalsRepository.save(clone);

    const sourceItems = await this.itemsRepository.find({ where: { goalId: source.id } });
    let clonedItems: StudyItem[] = [];
    if (sourceItems.length > 0) {
      const entities = sourceItems.map((item) =>
        this.itemsRepository.create({
          userId,
          goalId: saved.id,
          title: item.title,
          course: item.course,
          topic: item.topic,
          type: item.type,
          durationMinutes: item.durationMinutes,
          difficulty: item.difficulty,
          priority: item.priority,
          completed: false,
          completedDate: null,
          mastery: null,
          notes: item.notes,
          order: item.order,
        }),
      );
      clonedItems = await this.itemsRepository.save(entities);
    }

    return { goal: saved, items: clonedItems };
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.goalsRepository.delete({ userId });
  }
}
