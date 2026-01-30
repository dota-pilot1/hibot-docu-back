import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, S3Service],
  exports: [NotesService],
})
export class NotesModule {}
