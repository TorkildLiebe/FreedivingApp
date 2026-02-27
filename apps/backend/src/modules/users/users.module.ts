import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuthGuard } from '../../common/auth';
import { UserAvatarStorageService } from './user-avatar-storage.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UserAvatarStorageService,
    AuthGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
