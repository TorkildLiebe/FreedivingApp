import { Global, Module } from '@nestjs/common';
import { JwtVerifyService } from './jwt-verify.service';

@Global()
@Module({
  providers: [JwtVerifyService],
  exports: [JwtVerifyService],
})
export class AuthModule {}
