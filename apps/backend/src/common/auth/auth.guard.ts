import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtVerifyService } from './jwt-verify.service';
import { UsersService } from '../../modules/users/users.service';
import { AuthenticatedUser } from './authenticated-user';

interface AuthRequest {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtVerify: JwtVerifyService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();

    if (this.isDevBypass()) {
      const devUserId = request.headers['x-dev-user-id'];
      if (devUserId) {
        return this.handleDevBypass(request, devUserId);
      }

      // In dev mode, decode JWT without JWKS verification
      const token = this.extractToken(request);
      if (token) {
        return this.handleDevJwt(request, token);
      }

      throw new UnauthorizedException(
        'Dev bypass: provide x-dev-user-id header or Authorization Bearer token',
      );
    }

    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing authorization token');

    try {
      const payload = await this.jwtVerify.verify(token);
      const sub = payload.sub;
      if (!sub) throw new UnauthorizedException('Token missing sub claim');

      const user = await this.usersService.getOrCreate(
        sub,
        payload.email as string | undefined,
      );

      request.user = {
        userId: user.id,
        externalId: user.externalId,
        email: user.email ?? undefined,
        role: user.role,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`JWT verification failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: AuthRequest): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? (token ?? null) : null;
  }

  private isDevBypass(): boolean {
    return (
      process.env.AUTH_DEV_BYPASS === 'true' &&
      ['development', 'test'].includes(process.env.NODE_ENV ?? '')
    );
  }

  private async handleDevBypass(
    request: AuthRequest,
    devUserId: string,
  ): Promise<boolean> {
    const devRole = request.headers['x-dev-role'] ?? 'user';
    const user = await this.usersService.getOrCreate(devUserId);

    request.user = {
      userId: user.id,
      externalId: user.externalId,
      email: user.email ?? undefined,
      role: devRole,
    };
    return true;
  }

  private async handleDevJwt(
    request: AuthRequest,
    token: string,
  ): Promise<boolean> {
    try {
      const payloadB64 = token.split('.')[1];
      if (!payloadB64) throw new Error('Malformed token');
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString(),
      ) as { sub?: string; email?: string };

      const sub = payload.sub;
      if (!sub) throw new UnauthorizedException('Token missing sub claim');

      const user = await this.usersService.getOrCreate(sub, payload.email);

      request.user = {
        userId: user.id,
        externalId: user.externalId,
        email: user.email ?? undefined,
        role: user.role,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`Dev JWT decode failed: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
