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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectType } from './types/project-type';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get('tree')
    @ApiOperation({ summary: 'Get full project tree' })
    getTree(@Request() req: any) {
        return this.projectsService.getTree(req.user.userId);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Get categories by type' })
    @ApiQuery({ name: 'type', enum: ProjectType })
    getCategoriesByType(@Request() req: any, @Query('type') type: ProjectType) {
        return this.projectsService.getCategoriesByType(req.user.userId, type);
    }

    @Post('categories')
    @ApiOperation({ summary: 'Create a new category' })
    createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
        return this.projectsService.createCategory(req.user.userId, dto);
    }

    @Patch('categories/:id')
    @ApiOperation({ summary: 'Update a category' })
    updateCategory(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.projectsService.updateCategory(req.user.userId, +id, dto);
    }

    @Delete('categories/:id')
    @ApiOperation({ summary: 'Delete a category' })
    async deleteCategory(@Request() req: any, @Param('id') id: string) {
        await this.projectsService.deleteCategory(req.user.userId, +id);
        return { message: 'Category deleted successfully' };
    }

    @Get('contents/:categoryId')
    @ApiOperation({ summary: 'Get contents by category' })
    getContents(@Request() req: any, @Param('categoryId') categoryId: string) {
        return this.projectsService.getContents(req.user.userId, +categoryId);
    }

    @Post('contents')
    @ApiOperation({ summary: 'Create a new content' })
    createContent(@Request() req: any, @Body() dto: CreateContentDto) {
        return this.projectsService.createContent(req.user.userId, dto);
    }

    @Patch('contents/:id')
    @ApiOperation({ summary: 'Update a content' })
    updateContent(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateContentDto,
    ) {
        return this.projectsService.updateContent(req.user.userId, +id, dto);
    }

    @Delete('contents/:id')
    @ApiOperation({ summary: 'Delete a content' })
    async deleteContent(@Request() req: any, @Param('id') id: string) {
        await this.projectsService.deleteContent(req.user.userId, +id);
        return { message: 'Content deleted successfully' };
    }
}
