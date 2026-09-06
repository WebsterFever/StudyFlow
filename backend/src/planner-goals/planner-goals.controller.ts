import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PlannerGoalsService } from './planner-goals.service';
import { CreatePlannerGoalDto } from './dto/create-planner-goal.dto';
import { UpdatePlannerGoalDto } from './dto/update-planner-goal.dto';

@Controller('planner-goals')
@UseGuards(JwtAuthGuard)
export class PlannerGoalsController {
  constructor(private readonly plannerGoalsService: PlannerGoalsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.plannerGoalsService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plannerGoalsService.findOneOwned(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlannerGoalDto) {
    return this.plannerGoalsService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePlannerGoalDto) {
    return this.plannerGoalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plannerGoalsService.remove(user.id, id);
  }
}
