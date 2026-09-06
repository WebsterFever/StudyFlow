import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PlannerTasksService } from './planner-tasks.service';
import { CreatePlannerTaskDto } from './dto/create-planner-task.dto';
import { UpdatePlannerTaskDto } from './dto/update-planner-task.dto';

@Controller('planner-tasks')
@UseGuards(JwtAuthGuard)
export class PlannerTasksController {
  constructor(private readonly tasksService: PlannerTasksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.tasksService.findAllForUser(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlannerTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePlannerTaskDto) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
