import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillsService } from './skills.service';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillDto,
  UpdateUserSkillDto,
} from './dto';
import type { Response } from 'express';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ============================================
  // Skill Categories
  // ============================================

  @Get('categories')
  async findAllCategories() {
    return this.skillsService.findAllCategories();
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.skillsService.findCategoryById(+id);
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateSkillCategoryDto) {
    return this.skillsService.createCategory(dto);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateSkillCategoryDto,
  ) {
    return this.skillsService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.skillsService.deleteCategory(+id);
  }

  // ============================================
  // Skills
  // ============================================

  @Get()
  async findAllSkills() {
    return this.skillsService.findAllSkills();
  }

  @Get('tree')
  async getSkillTree() {
    return this.skillsService.getSkillTree();
  }

  @Get('tree/user/:userId')
  async getSkillTreeWithUserLevels(@Param('userId') userId: string) {
    return this.skillsService.getSkillTreeWithUserLevels(+userId);
  }

  @Get('category/:categoryId')
  async findSkillsByCategory(@Param('categoryId') categoryId: string) {
    return this.skillsService.findSkillsByCategory(+categoryId);
  }

  @Get(':id')
  async findSkillById(@Param('id') id: string) {
    return this.skillsService.findSkillById(+id);
  }

  @Post()
  async createSkill(@Body() dto: CreateSkillDto) {
    return this.skillsService.createSkill(dto);
  }

  @Patch(':id')
  async updateSkill(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.updateSkill(+id, dto);
  }

  @Delete(':id')
  async deleteSkill(@Param('id') id: string) {
    return this.skillsService.deleteSkill(+id);
  }

  @Patch(':id/order')
  async updateSkillOrder(
    @Param('id') id: string,
    @Body() body: { displayOrder: number },
  ) {
    return this.skillsService.updateSkillOrder(+id, body.displayOrder);
  }

  // ============================================
  // User Skills
  // ============================================

  @Get('user/:userId')
  async findUserSkills(@Param('userId') userId: string) {
    return this.skillsService.findUserSkills(+userId);
  }

  @Patch('user/:userId/skill/:skillId')
  async updateUserSkill(
    @Param('userId') userId: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateUserSkillDto,
  ) {
    return this.skillsService.updateUserSkill(+userId, +skillId, dto);
  }

  @Get('user/:userId/activities')
  async findUserSkillActivities(@Param('userId') userId: string) {
    return this.skillsService.findUserSkillActivities(+userId);
  }

  // ============================================
  // Department Skills
  // ============================================

  @Get('department/:departmentId/summary')
  async getDepartmentSkillsSummary(@Param('departmentId') departmentId: string) {
    return this.skillsService.getDepartmentSkillsSummary(+departmentId);
  }
}
