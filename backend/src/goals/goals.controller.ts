import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { UpsertGoalDto } from './dto/upsert-goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.goalsService.findForUser(user.id);
  }

  @Post()
  upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertGoalDto) {
    return this.goalsService.upsert(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpsertGoalDto) {
    return this.goalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.goalsService.remove(user.id, id);
  }
}
