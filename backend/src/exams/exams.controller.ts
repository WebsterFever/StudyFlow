import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ReplaceReviewItemsDto } from './dto/replace-review-items.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goalId') goalId?: string) {
    return this.examsService.findAllForUser(user.id, goalId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.examsService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(user.id, id, dto);
  }

  @Put(':id/review-items')
  replaceReviewItems(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReplaceReviewItemsDto) {
    return this.examsService.replaceReviewItems(user.id, id, dto.studyItemIds);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.examsService.remove(user.id, id);
  }
}
