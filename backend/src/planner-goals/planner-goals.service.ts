import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannerGoal } from './planner-goal.entity';
import { CreatePlannerGoalDto } from './dto/create-planner-goal.dto';
import { UpdatePlannerGoalDto } from './dto/update-planner-goal.dto';

@Injectable()
export class PlannerGoalsService {
  constructor(
    @InjectRepository(PlannerGoal) private readonly goalsRepository: Repository<PlannerGoal>,
  ) {}

  findAllForUser(userId: string): Promise<PlannerGoal[]> {
    return this.goalsRepository.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  /** Fetches a goal while verifying it belongs to the authenticated user; 404s otherwise (never 403 — don't leak existence). */
  async findOneOwned(userId: string, id: string): Promise<PlannerGoal> {
    const goal = await this.goalsRepository.findOne({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException('Planner goal not found.');
    }
    return goal;
  }

  /** Throws if `goalId` doesn't exist or doesn't belong to `userId`. Used by other modules before attaching resources to a goal. */
  async assertOwnership(userId: string, goalId: string): Promise<void> {
    await this.findOneOwned(userId, goalId);
  }

  async create(userId: string, dto: CreatePlannerGoalDto): Promise<PlannerGoal> {
    const goal = this.goalsRepository.create({ ...dto, userId, status: 'active' });
    return this.goalsRepository.save(goal);
  }

  async update(userId: string, id: string, dto: UpdatePlannerGoalDto): Promise<PlannerGoal> {
    const goal = await this.findOneOwned(userId, id);
    Object.assign(goal, dto);
    return this.goalsRepository.save(goal);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.goalsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Planner goal not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.goalsRepository.delete({ userId });
  }
}
