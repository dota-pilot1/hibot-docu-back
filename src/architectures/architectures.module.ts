import { Module } from '@nestjs/common';
import { ArchitecturesController } from './architectures.controller';
import { ArchitecturesService } from './architectures.service';

@Module({
  controllers: [ArchitecturesController],
  providers: [ArchitecturesService],
  exports: [ArchitecturesService],
})
export class ArchitecturesModule {}
