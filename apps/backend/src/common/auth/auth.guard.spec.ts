import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtVerifyService } from './jwt-verify.service';
import { UsersService } from '../../modules/users/users.service';
import type { AuthenticatedUser } from './authenticated-user';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtVerify: jest.Mocked<JwtVerifyService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'uuid-1',
    externalId: 'ext-1',
    email: 'test@example.com',
    alias: null,
    bio: null,
    avatarUrl: null,
    role: 'user',
    preferredLanguage: 'no',
    favoriteSpotIds: [],
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  interface MockRequest {
    headers: Record<string, string>;
    user?: AuthenticatedUser;
  }

  const createMockContext = (
    headers: Record<string, string> = {},
  ): { ctx: ExecutionContext; request: MockRequest } => {
    const request: MockRequest = { headers };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { ctx, request };
  };

  beforeEach(() => {
    jwtVerify = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtVerifyService>;

    usersService = {
      getOrCreate: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    guard = new AuthGuard(jwtVerify, usersService);
  });

  describe('JWT mode', () => {
    beforeEach(() => {
      process.env.AUTH_DEV_BYPASS = 'false';
    });

    it('should throw UnauthorizedException when no token', async () => {
      const { ctx } = createMockContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should verify JWT and attach user to request', async () => {
      jwtVerify.verify.mockResolvedValue({
        sub: 'ext-1',
        email: 'test@example.com',
      });
      usersService.getOrCreate.mockResolvedValue(mockUser);

      const { ctx, request } = createMockContext({
        authorization: 'Bearer valid-token',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(jwtVerify.verify).toHaveBeenCalledWith('valid-token');
      expect(usersService.getOrCreate).toHaveBeenCalledWith(
        'ext-1',
        'test@example.com',
      );
      expect(request.user).toEqual({
        userId: 'uuid-1',
        externalId: 'ext-1',
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      jwtVerify.verify.mockRejectedValue(new Error('invalid'));

      const { ctx } = createMockContext({
        authorization: 'Bearer invalid-token',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token has no sub', async () => {
      jwtVerify.verify.mockResolvedValue({});

      const { ctx } = createMockContext({
        authorization: 'Bearer token-no-sub',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('dev bypass mode', () => {
    beforeEach(() => {
      process.env.AUTH_DEV_BYPASS = 'true';
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.AUTH_DEV_BYPASS = 'false';
      process.env.NODE_ENV = 'test';
    });

    it('should accept x-dev-user-id header', async () => {
      usersService.getOrCreate.mockResolvedValue(mockUser);

      const { ctx } = createMockContext({
        'x-dev-user-id': 'dev-user-1',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(usersService.getOrCreate).toHaveBeenCalledWith('dev-user-1');
    });

    it('should use x-dev-role header for role override', async () => {
      usersService.getOrCreate.mockResolvedValue(mockUser);

      const { ctx, request } = createMockContext({
        'x-dev-user-id': 'dev-user-1',
        'x-dev-role': 'admin',
      });

      await guard.canActivate(ctx);

      expect(request.user?.role).toBe('admin');
    });

    it('should throw when x-dev-user-id missing in dev bypass', async () => {
      const { ctx } = createMockContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
