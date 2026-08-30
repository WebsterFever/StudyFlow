import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DayOverridesService } from './day-overrides.service';
import { UpsertDayOverrideDto } from './dto/upsert-day-override.dto';

@Controller('day-overrides')
@UseGuards(JwtAuthGuard)
export class DayOverridesController {
  constructor(private readonly dayOverridesService: DayOverridesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.dayOverridesService.findAllForUser(user.id, goalId);
  }

  @Put(':goalId/:date')
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId') goalId: string,
    @Param('date') date: string,
    @Body() dto: UpsertDayOverrideDto,
  ) {
    return this.dayOverridesService.upsert(user.id, goalId, date, dto);
  }

  @Delete(':goalId/:date')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('goalId') goalId: string, @Param('date') date: string) {
    return this.dayOverridesService.remove(user.id, goalId, date);
  }
}
