import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PlannerMilestonesService } from './planner-milestones.service';
import { CreatePlannerMilestoneDto } from './dto/create-planner-milestone.dto';
import { UpdatePlannerMilestoneDto } from './dto/update-planner-milestone.dto';

@Controller('planner-milestones')
@UseGuards(JwtAuthGuard)
export class PlannerMilestonesController {
  constructor(private readonly milestonesService: PlannerMilestonesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.milestonesService.findAllForUser(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlannerMilestoneDto) {
    return this.milestonesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePlannerMilestoneDto) {
    return this.milestonesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.milestonesService.remove(user.id, id);
  }
}
