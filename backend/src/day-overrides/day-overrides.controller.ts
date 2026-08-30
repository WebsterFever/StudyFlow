import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DayOverridesService } from './day-overrides.service';
import { UpsertDayOverrideDto } from './dto/upsert-day-override.dto';

@Controller('day-overrides')
@UseGuards(JwtAuthGuard)
export class DayOverridesController {
  constructor(private readonly dayOverridesService: DayOverridesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.dayOverridesService.findAllForUser(user.id);
  }

  @Put(':date')
  upsert(@CurrentUser() user: AuthenticatedUser, @Param('date') date: string, @Body() dto: UpsertDayOverrideDto) {
    return this.dayOverridesService.upsert(user.id, date, dto);
  }

  @Delete(':date')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('date') date: string) {
    return this.dayOverridesService.remove(user.id, date);
  }
}
