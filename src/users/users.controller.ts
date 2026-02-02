import {
  Controller,
  Get,
  Delete,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { S3Service } from '../common/s3.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own account' })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Request() req: any) {
    await this.usersService.delete(req.user.userId);
    return { success: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Check if user is admin
    const currentUser = await this.usersService.findById(req.user.userId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Prevent deleting own account via this endpoint
    if (id === req.user.userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.usersService.delete(id);
    return { success: true, message: 'User deleted successfully' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const ext = file.originalname.split('.').pop();
    const storedName = `${uuidv4()}.${ext}`;
    const imageUrl = await this.s3Service.uploadFile(
      file,
      'profile-images',
      storedName,
    );
    const user = await this.usersService.updateProfileImage(
      req.user.userId,
      imageUrl,
    );
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: string },
    @Request() req: any,
  ) {
    // Check if user is admin
    const currentUser = await this.usersService.findById(req.user.userId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update user roles');
    }

    // Prevent changing own role
    if (id === req.user.userId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    // Validate role
    if (!['USER', 'ADMIN'].includes(body.role)) {
      throw new ForbiddenException('Invalid role. Must be USER or ADMIN');
    }

    return this.usersService.updateRole(id, body.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user department' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/department')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { departmentId: number | null },
  ) {
    return this.usersService.updateDepartment(id, body.departmentId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder users within a department' })
  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  async reorderUsers(
    @Body() body: { userIds: number[]; departmentId: number | null },
    @Request() req: any,
  ) {
    // Check if user is admin
    const currentUser = await this.usersService.findById(req.user.userId);

    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reorder users');
    }

    await this.usersService.reorderUsers(body.userIds, body.departmentId);
    return { success: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check username availability' })
  @UseGuards(JwtAuthGuard)
  @Get('check-name/:name')
  async checkNameAvailability(
    @Param('name') name: string,
    @Request() req: any,
  ) {
    const isAvailable = await this.usersService.checkNameAvailability(
      name,
      req.user.userId,
    );
    return { available: isAvailable };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own username' })
  @UseGuards(JwtAuthGuard)
  @Patch('me/name')
  async updateMyName(@Body() body: { name: string }, @Request() req: any) {
    return this.usersService.updateName(req.user.userId, body.name);
  }
}
