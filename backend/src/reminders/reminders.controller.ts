import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { InternalSecretGuard } from '../common/guards/internal-secret.guard';
import { RemindersService } from './reminders.service';

@Controller('internal/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Called by the AWS Lambda on a 2-hour EventBridge schedule (never by the
   * frontend). Protected by a shared secret, not user JWTs — see InternalSecretGuard.
   */
  @Post('process')
  @UseGuards(InternalSecretGuard)
  @HttpCode(HttpStatus.OK)
  process() {
    return this.remindersService.processReminders();
  }
}
