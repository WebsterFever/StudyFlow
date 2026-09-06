import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ProjectSnapshotsService } from './project-snapshots.service';
import { CreateProjectSnapshotDto } from './dto/create-project-snapshot.dto';

@Controller('project-snapshots')
@UseGuards(JwtAuthGuard)
export class ProjectSnapshotsController {
  constructor(private readonly projectSnapshotsService: ProjectSnapshotsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectSnapshotDto) {
    return this.projectSnapshotsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectSnapshotsService.findOne(user.id, id);
  }
}
