import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GoalsModule } from './goals/goals.module';
import { StudyItemsModule } from './study-items/study-items.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { DayOverridesModule } from './day-overrides/day-overrides.module';
import { StudyNotesModule } from './study-notes/study-notes.module';
import { DataModule } from './data/data.module';
import { RemindersModule } from './reminders/reminders.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Schema changes now go through src/migrations/ (see npm run migration:*),
        // run manually against Railway's DATABASE_URL before deploying. Synchronize
        // defaults OFF; only flip it on for quick local experimentation.
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        ssl: configService.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    UsersModule,
    AuthModule,
    GoalsModule,
    StudyItemsModule,
    StudySessionsModule,
    DayOverridesModule,
    StudyNotesModule,
    DataModule,
    RemindersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
