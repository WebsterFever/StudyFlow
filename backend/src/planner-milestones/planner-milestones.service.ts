import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannerMilestone } from './planner-milestone.entity';
import { CreatePlannerMilestoneDto } from './dto/create-planner-milestone.dto';
import { UpdatePlannerMilestoneDto } from './dto/update-planner-milestone.dto';
import { PlannerGoalsService } from '../planner-goals/planner-goals.service';

@Injectable()
export class PlannerMilestonesService {
  constructor(
    @InjectRepository(PlannerMilestone) private readonly milestonesRepository: Repository<PlannerMilestone>,
    private readonly plannerGoalsService: PlannerGoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<PlannerMilestone[]> {
    return this.milestonesRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneOwned(userId: string, id: string): Promise<PlannerMilestone> {
    const milestone = await this.milestonesRepository.findOne({ where: { id, userId } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }
    return milestone;
  }

  async assertOwnership(userId: string, milestoneId: string): Promise<PlannerMilestone> {
    return this.findOneOwned(userId, milestoneId);
  }

  async create(userId: string, dto: CreatePlannerMilestoneDto): Promise<PlannerMilestone> {
    await this.plannerGoalsService.assertOwnership(userId, dto.goalId);
    const milestone = this.milestonesRepository.create({ ...dto, userId });
    return this.milestonesRepository.save(milestone);
  }

  async update(userId: string, id: string, dto: UpdatePlannerMilestoneDto): Promise<PlannerMilestone> {
    const milestone = await this.findOneOwned(userId, id);
    Object.assign(milestone, dto);
    return this.milestonesRepository.save(milestone);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.milestonesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Milestone not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.milestonesRepository.delete({ userId });
  }
}
