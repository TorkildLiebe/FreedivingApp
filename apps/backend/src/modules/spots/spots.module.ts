import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { SpotsRepository } from './spots.repository';
import { SpotPhotoStorageService } from './spot-photo-storage.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SpotsController],
  providers: [SpotsService, SpotsRepository, SpotPhotoStorageService],
  exports: [SpotsService],
})
export class SpotsModule {}
