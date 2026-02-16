# Authentication Flow

Complete guide to authentication in the DiveFreely backend.

## Overview

DiveFreely uses **Supabase JWT authentication**:
1. Mobile app authenticates with Supabase
2. Supabase issues JWT (access token)
3. Mobile sends JWT in `Authorization: Bearer <token>` header
4. Backend verifies JWT via JWKS (JSON Web Key Set)
5. Backend extracts user info from JWT claims
6. Backend creates/fetches User record on first API call

## JWT Structure

Supabase JWTs contain these claims:

```json
{
  "sub": "auth-provider|user-id",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "https://your-project.supabase.co/auth/v1"
}
```

## AuthGuard Implementation

Located at: `apps/backend/src/common/auth/auth.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedError,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private configService: ConfigService) {
    const jwksUrl = this.configService.get<string>('SUPABASE_JWKS_URL');
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Dev bypass mode
    if (this.configService.get<string>('AUTH_DEV_BYPASS') === 'true') {
      return this.handleDevBypass(request);
    }

    // Extract token from Authorization header
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    try {
      // Verify JWT with JWKS
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.configService.get<string>('SUPABASE_JWT_ISSUER'),
        audience: 'authenticated',
      });

      // Attach payload to request for @CurrentUser decorator
      (request as any).user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role || 'user',
      };

      return true;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private handleDevBypass(request: FastifyRequest): boolean {
    const userId = request.headers['x-dev-user-id'] as string;
    const role = request.headers['x-dev-role'] as string;

    if (!userId) {
      throw new UnauthorizedError('Dev bypass: x-dev-user-id header required');
    }

    (request as any).user = {
      sub: userId,
      email: `${userId}@dev.local`,
      role: role || 'user',
    };

    return true;
  }
}
```

## CurrentUser Decorator

Located at: `apps/backend/src/common/auth/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { JWTPayload } from './types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JWTPayload => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return (request as any).user;
  },
);
```

## JWT Payload Type

Located at: `apps/backend/src/common/auth/types.ts`

```typescript
export interface JWTPayload {
  sub: string;        // External user ID from auth provider
  email: string;
  role: 'user' | 'moderator' | 'admin';
}
```

## User getOrCreate Pattern

When a request arrives with a valid JWT, the backend needs to ensure a User record exists.

### UsersService Implementation

Located at: `apps/backend/src/modules/users/users.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  /**
   * Get user by external ID, create if not exists
   */
  async getOrCreate(externalId: string, email: string): Promise<User> {
    let user = await this.repository.findByExternalId(externalId);

    if (!user) {
      user = await this.repository.create({
        externalId,
        email,
        displayName: email.split('@')[0], // Default display name
      });
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
```

### Usage in Controllers

Controllers that need the User record (not just JWT payload):

```typescript
@Controller('spots')
@UseGuards(AuthGuard)
export class SpotsController {
  constructor(
    private readonly spotsService: SpotsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateSpotDto,
    @CurrentUser() jwtPayload: JWTPayload,
  ) {
    // Get or create user record
    const user = await this.usersService.getOrCreate(
      jwtPayload.sub,
      jwtPayload.email,
    );

    // Use user.id for foreign keys
    return this.spotsService.create(dto, user.id);
  }
}
```

## Dev Bypass Mode

For local development without real Supabase authentication.

### Environment Setup

```bash
# .env.development
AUTH_DEV_BYPASS=true
```

### Making Requests

```bash
curl http://localhost:3000/spots \
  -H "x-dev-user-id: user_123" \
  -H "x-dev-role: user"
```

With moderator role:

```bash
curl http://localhost:3000/spots/abc123 \
  -X DELETE \
  -H "x-dev-user-id: mod_456" \
  -H "x-dev-role: moderator"
```

### Security Notes

- **NEVER enable `AUTH_DEV_BYPASS=true` in production**
- Use environment-specific .env files (.env.development, .env.production)
- Verify `NODE_ENV=production` disables dev bypass
- Add test in CI to ensure dev bypass cannot be enabled in prod builds

## Authorization Patterns

### Owner-Only Actions

```typescript
async update(
  id: string,
  dto: UpdateSpotDto,
  userId: string,
  userRole: string,
): Promise<DiveSpot> {
  const spot = await this.findById(id);

  // Only owner or mods/admins can update
  if (spot.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
    throw new UnauthorizedError('You can only update your own spots');
  }

  return this.repository.update(id, dto);
}
```

### Role-Based Actions

```typescript
async deleteUser(
  targetUserId: string,
  currentUserRole: string,
): Promise<void> {
  // Only admins can delete users
  if (currentUserRole !== 'admin') {
    throw new ForbiddenError('Only admins can delete users');
  }

  await this.repository.softDelete(targetUserId);
}
```

### Time-Based Rules (48h Edit Window)

```typescript
async updateReport(
  id: string,
  dto: UpdateReportDto,
  userId: string,
  userRole: string,
): Promise<Report> {
  const report = await this.findById(id);

  // Check ownership
  if (report.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
    throw new UnauthorizedError('You can only update your own reports');
  }

  // Check 48h window for non-mods
  if (report.createdBy === userId && !['moderator', 'admin'].includes(userRole)) {
    const hoursSinceCreation =
      (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 48) {
      throw new ForbiddenError('Reports can only be edited within 48 hours');
    }
  }

  return this.repository.update(id, dto);
}
```

## Testing Auth

### Mocking AuthGuard

```typescript
describe('SpotsController', () => {
  let controller: SpotsController;
  let service: jest.Mocked<SpotsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SpotsController],
      providers: [
        { provide: SpotsService, useValue: createMockService() },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(SpotsController);
    service = module.get(SpotsService);
  });

  it('should create spot', async () => {
    const dto = { title: 'Test Spot', /* ... */ };
    const user = { sub: 'user_123', email: 'test@example.com', role: 'user' };

    await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, 'user_123');
  });
});
```

### Testing AuthGuard Directly

```typescript
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_DEV_BYPASS') return 'true';
        return 'mock-value';
      }),
    } as any;

    guard = new AuthGuard(configService);
  });

  it('should allow dev bypass with valid headers', async () => {
    const context = createMockExecutionContext({
      headers: {
        'x-dev-user-id': 'user_123',
        'x-dev-role': 'user',
      },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual({
      sub: 'user_123',
      email: 'user_123@dev.local',
      role: 'user',
    });
  });

  it('should reject dev bypass without user id', async () => {
    const context = createMockExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedError);
  });
});
```

## Environment Variables

Required for production:

```bash
# .env.production
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/jwks
SUPABASE_JWT_ISSUER=https://your-project.supabase.co/auth/v1
AUTH_DEV_BYPASS=false  # CRITICAL: Must be false
```

Required for development:

```bash
# .env.development
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/jwks
SUPABASE_JWT_ISSUER=https://your-project.supabase.co/auth/v1
AUTH_DEV_BYPASS=true  # Enables dev bypass
```

---

*Reference file for backend-dev skill*
