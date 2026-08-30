import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DataService } from './data.service';
import { ImportPayloadDto } from './dto/import-payload.dto';

@Controller('data')
@UseGuards(JwtAuthGuard)
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('migrate-local')
  migrateLocal(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImportPayloadDto) {
    return this.dataService.migrateLocalData(user.id, dto);
  }

  @Post('restore')
  restore(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImportPayloadDto) {
    return this.dataService.restoreData(user.id, dto);
  }

  @Delete('wipe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async wipe(@CurrentUser() user: AuthenticatedUser) {
    await this.dataService.wipeAllData(user.id);
  }
}
