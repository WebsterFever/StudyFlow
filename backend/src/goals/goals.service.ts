import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyGoal } from './goal.entity';
import { UpsertGoalDto } from './dto/upsert-goal.dto';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function assertValidGoalPayload(dto: UpsertGoalDto): void {
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
  ) {}

  async findForUser(userId: string): Promise<StudyGoal[]> {
    const goal = await this.goalsRepository.findOne({ where: { userId } });
    return goal ? [goal] : [];
  }

  /** The frontend only ever has one active goal, so "create" really means "create or replace". */
  async upsert(userId: string, dto: UpsertGoalDto): Promise<StudyGoal> {
    assertValidGoalPayload(dto);
    const existing = await this.goalsRepository.findOne({ where: { userId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.goalsRepository.save(existing);
    }
    const goal = this.goalsRepository.create({ ...dto, userId });
    return this.goalsRepository.save(goal);
  }

  async update(userId: string, id: string, dto: UpsertGoalDto): Promise<StudyGoal> {
    assertValidGoalPayload(dto);
    const goal = await this.goalsRepository.findOne({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException('Goal not found.');
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

  async removeAllForUser(userId: string): Promise<void> {
    await this.goalsRepository.delete({ userId });
  }
}
