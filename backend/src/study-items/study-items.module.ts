import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyItem } from './study-item.entity';
import { StudyItemsService } from './study-items.service';
import { StudyItemsController } from './study-items.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudyItem]), GoalsModule],
  providers: [StudyItemsService],
  controllers: [StudyItemsController],
  exports: [StudyItemsService],
})
export class StudyItemsModule {}
