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
import { DataModule } from './data/data.module';
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
        // MVP tradeoff: schema is kept in sync from entities instead of hand-written
        // migrations. Fine for this project's scope; set DB_SYNCHRONIZE=false once
        // you introduce real TypeORM migrations for a production-hardened setup.
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        ssl: configService.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    UsersModule,
    AuthModule,
    GoalsModule,
    StudyItemsModule,
    StudySessionsModule,
    DayOverridesModule,
    DataModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
