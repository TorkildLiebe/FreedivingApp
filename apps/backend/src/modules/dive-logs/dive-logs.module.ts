import { Module } from '@nestjs/common';
import { DiveLogsController } from './dive-logs.controller';
import { DiveLogsService } from './dive-logs.service';
import { DiveLogsRepository } from './dive-logs.repository';
import { DiveLogPhotoStorageService } from './dive-log-photo-storage.service';

@Module({
  controllers: [DiveLogsController],
  providers: [DiveLogsService, DiveLogsRepository, DiveLogPhotoStorageService],
  exports: [DiveLogsService],
})
export class DiveLogsModule {}
