import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService, S3Service],
  exports: [FavoritesService],
})
export class FavoritesModule {}
