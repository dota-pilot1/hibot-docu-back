import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JournalsService } from './journals.service';
import {
  CreateJournalCategoryDto,
  JournalType,
} from './dto/create-category.dto';
import { UpdateJournalCategoryDto } from './dto/update-category.dto';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('journals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  // ============================================
  // Category endpoints
  // ============================================

  @Get('categories/tree')
  @ApiOperation({ summary: 'Get category tree' })
  @ApiQuery({ name: 'type', enum: JournalType, required: false })
  getTree(@Request() req: any, @Query('type') type?: JournalType) {
    return this.journalsService.getTree(req.user.userId, type);
  }

  @Get('teams-with-journals')
  @ApiOperation({ summary: 'Get teams with journals' })
  @ApiQuery({ name: 'type', enum: JournalType, required: false })
  getTeamsWithJournals(@Request() req: any, @Query('type') type?: JournalType) {
    return this.journalsService.getTeamsWithJournals(req.user.userId, type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreateJournalCategoryDto) {
    return this.journalsService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Request() req: any,
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.journalsService.reorderCategories(
      req.user.userId,
      body.categoryIds,
      body.parentId,
    );
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateJournalCategoryDto,
  ) {
    return this.journalsService.updateCategory(req.user.userId, +id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Request() req: any, @Param('id') id: string) {
    await this.journalsService.deleteCategory(req.user.userId, +id);
    return { message: 'Category deleted successfully' };
  }

  // ============================================
  // Journal endpoints
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get all journals' })
  @ApiQuery({ name: 'categoryId', required: false })
  getJournals(@Request() req: any, @Query('categoryId') categoryId?: string) {
    return this.journalsService.getJournals(
      req.user.userId,
      categoryId ? +categoryId : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal by ID' })
  getJournalById(@Request() req: any, @Param('id') id: string) {
    return this.journalsService.getJournalById(req.user.userId, +id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new journal' })
  createJournal(@Request() req: any, @Body() dto: CreateJournalDto) {
    return this.journalsService.createJournal(req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal' })
  updateJournal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalsService.updateJournal(req.user.userId, +id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal' })
  async deleteJournal(@Request() req: any, @Param('id') id: string) {
    await this.journalsService.deleteJournal(req.user.userId, +id);
    return { message: 'Journal deleted successfully' };
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder journals' })
  async reorderJournals(
    @Request() req: any,
    @Body() body: { categoryId: number; journalIds: number[] },
  ) {
    await this.journalsService.reorderJournals(
      req.user.userId,
      body.categoryId,
      body.journalIds,
    );
    return { message: 'Journals reordered successfully' };
  }
}
