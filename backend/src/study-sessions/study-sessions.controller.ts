import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateStudySessionDto } from './dto/update-study-session.dto';
import { ReplaceSessionsDto } from './dto/replace-sessions.dto';
import { ReorderSessionsDto } from './dto/reorder-sessions.dto';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.studySessionsService.findAllForUser(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudySessionDto) {
    return this.studySessionsService.create(user.id, dto);
  }

  /** Replaces one goal's entire session list — how the plan generator persists a recalculated plan. */
  @Put()
  replaceAll(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReplaceSessionsDto) {
    return this.studySessionsService.replaceAll(user.id, dto.goalId, dto.sessions);
  }

  @Patch('reorder')
  reorder(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReorderSessionsDto) {
    return this.studySessionsService.reorder(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStudySessionDto) {
    return this.studySessionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studySessionsService.remove(user.id, id);
  }
}
