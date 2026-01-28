import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ImagesController } from './images.controller';

@Global()
@Module({
  controllers: [ImagesController],
  providers: [S3Service],
  exports: [S3Service],
})
export class CommonModule {}
