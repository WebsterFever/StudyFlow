import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { StudyItemsService } from './study-items.service';
import { CreateStudyItemDto } from './dto/create-study-item.dto';
import { UpdateStudyItemDto } from './dto/update-study-item.dto';
import { BulkCreateStudyItemsDto } from './dto/bulk-create-study-items.dto';

@Controller('study-items')
@UseGuards(JwtAuthGuard)
export class StudyItemsController {
  constructor(private readonly studyItemsService: StudyItemsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.studyItemsService.findAllForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudyItemDto) {
    return this.studyItemsService.create(user.id, dto);
  }

  @Post('bulk')
  bulkCreate(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkCreateStudyItemsDto) {
    return this.studyItemsService.bulkCreate(user.id, dto.items);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStudyItemDto) {
    return this.studyItemsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studyItemsService.remove(user.id, id);
  }
}
