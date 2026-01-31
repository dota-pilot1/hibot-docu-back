import { Module } from '@nestjs/common';
import { DocumentFoldersService } from './document-folders.service';
import { DocumentFoldersController } from './document-folders.controller';

@Module({
  controllers: [DocumentFoldersController],
  providers: [DocumentFoldersService],
  exports: [DocumentFoldersService],
})
export class DocumentFoldersModule {}
