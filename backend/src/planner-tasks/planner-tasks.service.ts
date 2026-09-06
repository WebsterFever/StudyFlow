import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannerTask } from './planner-task.entity';
import { CreatePlannerTaskDto } from './dto/create-planner-task.dto';
import { UpdatePlannerTaskDto } from './dto/update-planner-task.dto';
import { PlannerGoalsService } from '../planner-goals/planner-goals.service';
import { PlannerMilestonesService } from '../planner-milestones/planner-milestones.service';

/** Adds `days` to an ISO yyyy-mm-dd date string, returning a new ISO date string. */
function addDaysToISODate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class PlannerTasksService {
  constructor(
    @InjectRepository(PlannerTask) private readonly tasksRepository: Repository<PlannerTask>,
    private readonly plannerGoalsService: PlannerGoalsService,
    private readonly milestonesService: PlannerMilestonesService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<PlannerTask[]> {
    return this.tasksRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneOwned(userId: string, id: string): Promise<PlannerTask> {
    const task = await this.tasksRepository.findOne({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return task;
  }

  async assertOwnership(userId: string, taskId: string): Promise<PlannerTask> {
    return this.findOneOwned(userId, taskId);
  }

  private async assertMilestoneBelongsToGoal(userId: string, milestoneId: string, goalId: string): Promise<void> {
    const milestone = await this.milestonesService.assertOwnership(userId, milestoneId);
    if (milestone.goalId !== goalId) {
      throw new BadRequestException("milestoneId must belong to the task's goal.");
    }
  }

  async create(userId: string, dto: CreatePlannerTaskDto): Promise<PlannerTask> {
    await this.plannerGoalsService.assertOwnership(userId, dto.goalId);
    if (dto.milestoneId) {
      await this.assertMilestoneBelongsToGoal(userId, dto.milestoneId, dto.goalId);
    }
    const task = this.tasksRepository.create({ ...dto, userId });
    return this.tasksRepository.save(task);
  }

  async update(userId: string, id: string, dto: UpdatePlannerTaskDto): Promise<PlannerTask> {
    const task = await this.findOneOwned(userId, id);
    if (dto.milestoneId) {
      await this.assertMilestoneBelongsToGoal(userId, dto.milestoneId, task.goalId);
    }

    const wasCompleted = task.status === 'completed';
    const dueDateChanged = dto.dueDate !== undefined && dto.dueDate !== task.dueDate;
    const reopened = dto.status && dto.status !== 'completed' && wasCompleted;

    Object.assign(task, dto);

    // A recurring task never actually stays "completed" — finishing an
    // occurrence just advances it to the next one instead of leaving a dead
    // checkbox, so the same task keeps recurring without a separate history entity.
    if (task.isRecurring && task.recurrenceIntervalDays && dto.status === 'completed') {
      task.status = 'not_started';
      task.dueDate = task.dueDate ? addDaysToISODate(task.dueDate, task.recurrenceIntervalDays) : task.dueDate;
      task.reminderSentAt = null;
    } else if (dueDateChanged || reopened) {
      task.reminderSentAt = null;
    }

    return this.tasksRepository.save(task);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.tasksRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Task not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.tasksRepository.delete({ userId });
  }
}
