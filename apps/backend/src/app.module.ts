import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './common/auth';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { SpotsModule } from './modules/spots/spots.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, UsersModule, SpotsModule],
})
export class AppModule {}
