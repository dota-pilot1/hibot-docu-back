import { Module } from '@nestjs/common';
import { DesignSystemsController } from './design-systems.controller';
import { DesignSystemsService } from './design-systems.service';

@Module({
  controllers: [DesignSystemsController],
  providers: [DesignSystemsService],
  exports: [DesignSystemsService],
})
export class DesignSystemsModule {}
