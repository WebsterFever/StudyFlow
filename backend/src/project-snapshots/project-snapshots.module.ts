import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectSnapshot } from './project-snapshot.entity';
import { ProjectFile } from './project-file.entity';
import { StudyNote } from '../study-notes/study-note.entity';
import { StudyItem } from '../study-items/study-item.entity';
import { ProjectSnapshotsService } from './project-snapshots.service';
import { ProjectSnapshotsController } from './project-snapshots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectSnapshot, ProjectFile, StudyNote, StudyItem])],
  providers: [ProjectSnapshotsService],
  controllers: [ProjectSnapshotsController],
})
export class ProjectSnapshotsModule {}
