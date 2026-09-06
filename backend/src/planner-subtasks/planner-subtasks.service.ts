import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannerSubtask } from './planner-subtask.entity';
import { CreatePlannerSubtaskDto } from './dto/create-planner-subtask.dto';
import { UpdatePlannerSubtaskDto } from './dto/update-planner-subtask.dto';
import { PlannerTasksService } from '../planner-tasks/planner-tasks.service';

@Injectable()
export class PlannerSubtasksService {
  constructor(
    @InjectRepository(PlannerSubtask) private readonly subtasksRepository: Repository<PlannerSubtask>,
    private readonly tasksService: PlannerTasksService,
  ) {}

  findAllForUser(userId: string, taskId?: string): Promise<PlannerSubtask[]> {
    return this.subtasksRepository.find({
      where: taskId ? { userId, taskId } : { userId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  private async findOwned(userId: string, id: string): Promise<PlannerSubtask> {
    const subtask = await this.subtasksRepository.findOne({ where: { id, userId } });
    if (!subtask) {
      throw new NotFoundException('Subtask not found.');
    }
    return subtask;
  }

  async create(userId: string, dto: CreatePlannerSubtaskDto): Promise<PlannerSubtask> {
    await this.tasksService.assertOwnership(userId, dto.taskId);
    const subtask = this.subtasksRepository.create({ ...dto, userId });
    return this.subtasksRepository.save(subtask);
  }

  async update(userId: string, id: string, dto: UpdatePlannerSubtaskDto): Promise<PlannerSubtask> {
    const subtask = await this.findOwned(userId, id);
    Object.assign(subtask, dto);
    return this.subtasksRepository.save(subtask);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.subtasksRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Subtask not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.subtasksRepository.delete({ userId });
  }
}
