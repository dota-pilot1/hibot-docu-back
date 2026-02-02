import { Module } from '@nestjs/common';
import { DbAdminController } from './db-admin.controller';
import { DbAdminService } from './db-admin.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [DbAdminController],
  providers: [DbAdminService, S3Service],
  exports: [DbAdminService],
})
export class DbAdminModule {}
