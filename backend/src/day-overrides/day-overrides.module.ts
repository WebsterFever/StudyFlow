import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DayOverride } from './day-override.entity';
import { DayOverridesService } from './day-overrides.service';
import { DayOverridesController } from './day-overrides.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([DayOverride]), GoalsModule],
  providers: [DayOverridesService],
  controllers: [DayOverridesController],
  exports: [DayOverridesService],
})
export class DayOverridesModule {}
