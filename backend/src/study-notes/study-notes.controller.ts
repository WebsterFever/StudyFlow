import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { StudyNotesService } from './study-notes.service';
import { CreateStudyNoteDto } from './dto/create-study-note.dto';
import { UpdateStudyNoteDto } from './dto/update-study-note.dto';

@Controller('study-notes')
@UseGuards(JwtAuthGuard)
export class StudyNotesController {
  constructor(private readonly studyNotesService: StudyNotesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('goalId') goalId?: string,
    @Query('itemId') itemId?: string,
  ) {
    if (!goalId) {
      throw new BadRequestException('goalId is required.');
    }
    if (itemId) {
      return this.studyNotesService.findAllForItem(user.id, goalId, itemId);
    }
    return this.studyNotesService.findAllForGoal(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudyNoteDto) {
    return this.studyNotesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStudyNoteDto) {
    return this.studyNotesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studyNotesService.remove(user.id, id);
  }
}
