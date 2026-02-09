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
      return this.handleDevBypass(request);
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

  private async handleDevBypass(request: AuthRequest): Promise<boolean> {
    const devUserId = request.headers['x-dev-user-id'];
    const devRole = request.headers['x-dev-role'] ?? 'user';

    if (!devUserId)
      throw new UnauthorizedException(
        'Dev bypass: x-dev-user-id header required',
      );

    const user = await this.usersService.getOrCreate(devUserId);

    request.user = {
      userId: user.id,
      externalId: user.externalId,
      email: user.email ?? undefined,
      role: devRole,
    };
    return true;
  }
}
