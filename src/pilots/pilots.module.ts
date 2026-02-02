import { Module } from '@nestjs/common';
import { PilotsController } from './pilots.controller';
import { PilotsService } from './pilots.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [PilotsController],
  providers: [PilotsService, S3Service],
  exports: [PilotsService],
})
export class PilotsModule {}
