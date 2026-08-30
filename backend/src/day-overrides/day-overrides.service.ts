import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOverride } from './day-override.entity';
import { UpsertDayOverrideDto } from './dto/upsert-day-override.dto';
import { GoalsService } from '../goals/goals.service';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class DayOverridesService {
  constructor(
    @InjectRepository(DayOverride)
    private readonly overridesRepository: Repository<DayOverride>,
    private readonly goalsService: GoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<DayOverride[]> {
    return this.overridesRepository.find({ where: goalId ? { userId, goalId } : { userId } });
  }

  async upsert(userId: string, goalId: string, date: string, dto: UpsertDayOverrideDto): Promise<DayOverride> {
    if (!DATE_PATTERN.test(date)) {
      throw new BadRequestException('Date must be in yyyy-mm-dd format.');
    }
    await this.goalsService.assertOwnership(userId, goalId);

    const existing = await this.overridesRepository.findOne({ where: { userId, goalId, date } });
    if (existing) {
      existing.unavailable = dto.unavailable;
      existing.hoursOverride = dto.hoursOverride ?? null;
      return this.overridesRepository.save(existing);
    }
    const override = this.overridesRepository.create({
      userId,
      goalId,
      date,
      unavailable: dto.unavailable,
      hoursOverride: dto.hoursOverride ?? null,
    });
    return this.overridesRepository.save(override);
  }

  async remove(userId: string, goalId: string, date: string): Promise<void> {
    const result = await this.overridesRepository.delete({ userId, goalId, date });
    if (result.affected === 0) {
      throw new NotFoundException('Day override not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.overridesRepository.delete({ userId });
  }
}
