import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannerNote } from './planner-note.entity';
import { CreatePlannerNoteDto } from './dto/create-planner-note.dto';
import { UpdatePlannerNoteDto } from './dto/update-planner-note.dto';
import { PlannerGoalsService } from '../planner-goals/planner-goals.service';

@Injectable()
export class PlannerNotesService {
  constructor(
    @InjectRepository(PlannerNote) private readonly notesRepository: Repository<PlannerNote>,
    private readonly plannerGoalsService: PlannerGoalsService,
  ) {}

  findAllForUser(userId: string, goalId?: string): Promise<PlannerNote[]> {
    return this.notesRepository.find({
      where: goalId ? { userId, goalId } : { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private async findOwned(userId: string, id: string): Promise<PlannerNote> {
    const note = await this.notesRepository.findOne({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException('Note not found.');
    }
    return note;
  }

  async create(userId: string, dto: CreatePlannerNoteDto): Promise<PlannerNote> {
    await this.plannerGoalsService.assertOwnership(userId, dto.goalId);
    const note = this.notesRepository.create({ ...dto, userId });
    return this.notesRepository.save(note);
  }

  async update(userId: string, id: string, dto: UpdatePlannerNoteDto): Promise<PlannerNote> {
    const note = await this.findOwned(userId, id);
    Object.assign(note, dto);
    return this.notesRepository.save(note);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.notesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Note not found.');
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.notesRepository.delete({ userId });
  }
}
