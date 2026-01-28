import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('이미지 파일만 업로드할 수 있습니다.'),
            false,
          );
        }
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('jpg, png, gif, webp 형식만 지원합니다.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'lexical',
  ) {
    if (!file) {
      throw new BadRequestException('파일이 없습니다.');
    }

    // 고유한 파일명 생성
    const ext = file.originalname.split('.').pop() || 'jpg';
    const storedName = `${uuidv4()}.${ext}`;

    const url = await this.s3Service.uploadFile(file, folder, storedName);

    return {
      success: true,
      url,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
