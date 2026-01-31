import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentFoldersService } from './document-folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('document-folders')
@Controller('document-folders')
export class DocumentFoldersController {
  constructor(
    private readonly documentFoldersService: DocumentFoldersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 생성' })
  @ApiResponse({ status: 201, description: '폴더 생성 성공' })
  create(@Body() createFolderDto: CreateFolderDto) {
    return this.documentFoldersService.create(createFolderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 목록 조회 (문서 포함)' })
  findAll() {
    return this.documentFoldersService.findAllWithDocuments();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentFoldersService.findOne(id);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 순서 변경' })
  reorder(@Body() body: { folderIds: number[] }) {
    return this.documentFoldersService.reorder(body.folderIds);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.documentFoldersService.update(id, updateFolderDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '폴더 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentFoldersService.remove(id);
  }
}
