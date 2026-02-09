import { Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class JwtVerifyService {
  private readonly logger = new Logger(JwtVerifyService.name);
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private getJwks() {
    if (!this.jwks) {
      const jwksUrl = process.env.AUTH_JWKS_URL;
      if (!jwksUrl) throw new Error('AUTH_JWKS_URL not configured');
      this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    }
    return this.jwks;
  }

  async verify(token: string): Promise<JWTPayload> {
    const issuer = process.env.AUTH_ISSUER;
    const { payload } = await jwtVerify(token, this.getJwks(), {
      issuer,
    });
    return payload;
  }
}
