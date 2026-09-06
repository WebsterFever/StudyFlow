import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PlannerSubtasksService } from './planner-subtasks.service';
import { CreatePlannerSubtaskDto } from './dto/create-planner-subtask.dto';
import { UpdatePlannerSubtaskDto } from './dto/update-planner-subtask.dto';

@Controller('planner-subtasks')
@UseGuards(JwtAuthGuard)
export class PlannerSubtasksController {
  constructor(private readonly subtasksService: PlannerSubtasksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('taskId') taskId?: string) {
    return this.subtasksService.findAllForUser(user.id, taskId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlannerSubtaskDto) {
    return this.subtasksService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePlannerSubtaskDto) {
    return this.subtasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.subtasksService.remove(user.id, id);
  }
}
