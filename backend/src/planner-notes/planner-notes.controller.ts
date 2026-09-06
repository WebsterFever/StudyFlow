import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PlannerNotesService } from './planner-notes.service';
import { CreatePlannerNoteDto } from './dto/create-planner-note.dto';
import { UpdatePlannerNoteDto } from './dto/update-planner-note.dto';

@Controller('planner-notes')
@UseGuards(JwtAuthGuard)
export class PlannerNotesController {
  constructor(private readonly notesService: PlannerNotesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.notesService.findAllForUser(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlannerNoteDto) {
    return this.notesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePlannerNoteDto) {
    return this.notesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notesService.remove(user.id, id);
  }
}
