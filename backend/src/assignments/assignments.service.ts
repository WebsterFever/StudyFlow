import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { GoalsService } from '../goals/goals.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment) private readonly assignmentsRepository: Repository<Assignment>,
    private readonly goalsService: GoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<Assignment[]> {
    return this.assignmentsRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { dueDate: 'ASC' },
    });
  }

  private async findOwned(userId: string, id: string): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({ where: { id, userId } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }
    return assignment;
  }

  async create(userId: string, dto: CreateAssignmentDto): Promise<Assignment> {
    await this.goalsService.assertOwnership(userId, dto.goalId);
    const assignment = this.assignmentsRepository.create({ ...dto, userId });
    return this.assignmentsRepository.save(assignment);
  }

  async update(userId: string, id: string, dto: UpdateAssignmentDto): Promise<Assignment> {
    const assignment = await this.findOwned(userId, id);
    // Re-arm the one-shot reminder if the due date changes or the assignment
    // is reopened — otherwise a pushed-back deadline would never remind again.
    if ((dto.dueDate && dto.dueDate !== assignment.dueDate) || (dto.status && dto.status !== 'completed' && assignment.status === 'completed')) {
      assignment.reminderSentAt = null;
    }
    Object.assign(assignment, dto);
    return this.assignmentsRepository.save(assignment);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.assignmentsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Assignment not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.assignmentsRepository.delete({ userId });
  }
}
