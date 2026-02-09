# Security Best Practices

## 1. Authentication & Authorization

### Authentication (who are you?)
Handled by Supabase. Our backend verifies JWT tokens.

```typescript
// The flow:
// 1. Mobile app authenticates with Supabase (email/password, OAuth)
// 2. Supabase returns a JWT token
// 3. Mobile app sends token in Authorization header
// 4. Our backend AuthGuard verifies the token via JWKS
// 5. Guard attaches user context to the request
```

### Authorization (what can you do?)
Handled in our backend via guards and service-level checks.

```typescript
// Role-based access control
@Roles('admin', 'moderator')
@UseGuards(AuthGuard, RolesGuard)
@Delete(':id/hard')
async hardDelete(@Param('id') id: string) {}

// Resource ownership check (in service)
async updateReport(reportId: string, userId: string, dto: UpdateReportDto) {
  const report = await this.reportRepo.findById(reportId);
  if (!report) throw new ReportNotFoundError(reportId);

  // Only owner can edit (or mod/admin)
  if (report.createdById !== userId) {
    throw new ForbiddenError('You can only edit your own reports');
  }

  // 48-hour edit window for regular users
  const hoursSinceCreation = differenceInHours(new Date(), report.createdAt);
  if (hoursSinceCreation > 48) {
    throw new EditWindowExpiredError();
  }

  return this.reportRepo.update(reportId, dto);
}
```

### Never trust the client

```typescript
// BAD - trusting client-provided user ID
@Post()
create(@Body() dto: CreateSpotDto) {
  return this.service.create(dto); // dto.userId could be anyone!
}

// GOOD - use the authenticated user from the token
@Post()
create(@Body() dto: CreateSpotDto, @CurrentUser() user: AuthenticatedUser) {
  return this.service.create(dto, user.id); // user.id comes from verified JWT
}
```

## 2. Input Validation (OWASP #3: Injection)

### Validate everything at the boundary

```typescript
// DTOs with class-validator = automatic validation
export class CreateDiveSpotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-']+$/) // alphanumeric, spaces, hyphens, apostrophes
  name: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
```

### Whitelist validation (already enabled)

```typescript
// In main.ts - strips unknown properties and rejects them
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Throw error if unknown properties sent
    transform: true,              // Auto-transform types
  }),
);
```

This prevents attackers from injecting extra fields like `isAdmin: true` or `role: 'admin'`.

### SQL Injection protection

Prisma handles this automatically via parameterized queries. But for raw queries:

```typescript
// SAFE - Prisma parameterized query
const spot = await prisma.diveSpot.findFirst({
  where: { name: userInput }, // Prisma escapes this
});

// SAFE - Raw query with template literal (auto-parameterized)
const spots = await prisma.$queryRaw`
  SELECT * FROM dive_spots WHERE name = ${userInput}
`;

// DANGEROUS - Never do this
const spots = await prisma.$queryRawUnsafe(
  `SELECT * FROM dive_spots WHERE name = '${userInput}'`
);
```

## 3. Secrets Management

### Never commit secrets

```bash
# .gitignore should include:
.env
.env.local
.env.production
*.pem
*.key
```

### Use environment variables

```typescript
// GOOD - read from environment
const supabaseUrl = process.env.SUPABASE_URL;
const dbUrl = process.env.DATABASE_URL;

// BAD - hardcoded secrets
const supabaseUrl = 'https://myproject.supabase.co';
const dbUrl = 'postgresql://user:password@host/db';
```

### Environment variable checklist

| Variable | Contains | Sensitivity |
|----------|----------|------------|
| `DATABASE_URL` | DB credentials | HIGH |
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB access | CRITICAL |
| `SUPABASE_ANON_KEY` | Public API key | LOW (designed to be public) |
| `AUTH_JWKS_URL` | JWKS endpoint | LOW (public endpoint) |
| `AUTH_DEV_BYPASS` | Dev-only flag | Must be `false` in production |

### Critical: disable dev bypass in production

```typescript
// AUTH_DEV_BYPASS should NEVER be true in production
if (process.env.AUTH_DEV_BYPASS === 'true' && process.env.NODE_ENV === 'production') {
  throw new Error('AUTH_DEV_BYPASS must not be enabled in production');
}
```

## 4. CORS (Cross-Origin Resource Sharing)

```typescript
// In main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',      // Local development
    'https://yourdomain.com',     // Production
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,               // Allow cookies/auth headers
});

// BAD - allows any origin
app.enableCors({ origin: '*' });
// This means any website can make requests to your API
```

For mobile apps, CORS is less critical (native HTTP clients don't enforce CORS), but set it up properly anyway for any web-based admin panels.

## 5. Rate Limiting

Prevents abuse and brute-force attacks.

```typescript
// Using @nestjs/throttler (install when ready)
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,   // Time window: 60 seconds
          limit: 100,   // Max 100 requests per window
        },
      ],
    }),
  ],
})
export class AppModule {}

// Apply globally
app.useGlobalGuards(new ThrottlerGuard());

// Stricter limits on sensitive endpoints
@Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 per minute
@Post('auth/login')
async login() {}
```

## 6. Data Exposure Prevention

### Never return sensitive fields

```typescript
// BAD - returns everything including internal fields
@Get(':id')
async findUser(@Param('id') id: string) {
  return this.prisma.user.findUnique({ where: { id } });
  // Exposes: externalId, email, deletedAt, isDeleted...
}

// GOOD - select only public fields
@Get(':id')
async findUser(@Param('id') id: string) {
  return this.prisma.user.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      // externalId, email, etc. are NOT returned
    },
  });
}
```

### Sensitive fields that should never be in API responses

| Field | Why |
|-------|-----|
| `externalId` | Internal Supabase reference |
| `isDeleted` / `deletedAt` | Internal soft-delete state |
| `email` (other users) | Privacy - only return your own email |
| Database IDs of related internal records | Information leakage |

## 7. Error Information Leakage

### Don't expose internals in errors

```typescript
// BAD - reveals database structure
catch(error) {
  throw new HttpException(
    `Query failed: ${error.message}`, // "column 'x' does not exist"
    500,
  );
}

// BAD - reveals stack trace
catch(error) {
  throw new HttpException({ message: error.message, stack: error.stack }, 500);
}

// GOOD - log internally, return generic message
catch(error) {
  this.logger.error('Database query failed', {
    error: error.message,
    stack: error.stack,
    query: 'findDiveSpotById', // context for debugging
  });
  throw new InternalServerErrorException('An unexpected error occurred');
}
```

## 8. Content Security

### Validate uploads and user content

```typescript
// Photo uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS_PER_SPOT = 5;

// Text content - prevent XSS (relevant if we ever render HTML)
// Our API returns JSON, so XSS risk is mainly on the client side
// But still sanitize inputs:
@IsString()
@MaxLength(2000)
@Matches(/^[^<>]*$/) // No HTML tags
description: string;
```

### No emoji rule (our domain constraint)

```typescript
// displayName, title, caption must not contain emoji
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

@Matches(EMOJI_REGEX, { message: 'Must not contain emoji' })
```

## 9. OWASP Top 10 Checklist

| # | Vulnerability | Our Mitigation |
|---|--------------|----------------|
| 1 | Broken Access Control | AuthGuard, RolesGuard, ownership checks in services |
| 2 | Cryptographic Failures | Supabase handles password hashing, JWT signing |
| 3 | Injection | Prisma parameterized queries, class-validator DTOs |
| 4 | Insecure Design | Domain constraints enforced in services |
| 5 | Security Misconfiguration | CORS whitelist, ValidationPipe whitelist, no stack traces |
| 6 | Vulnerable Components | Dependabot/pnpm audit for dependency scanning |
| 7 | Auth Failures | Supabase handles auth, we verify JWT via JWKS |
| 8 | Data Integrity Failures | Signed JWTs, server-side validation |
| 9 | Logging Failures | NestJS Logger, structured error logging |
| 10 | SSRF | No user-provided URLs fetched server-side (yet) |

## 10. Development vs Production Checklist

| Setting | Development | Production |
|---------|-------------|------------|
| `AUTH_DEV_BYPASS` | `true` | `false` (CRITICAL) |
| `NODE_ENV` | `development` | `production` |
| Error detail | Full messages | Generic messages |
| CORS origin | `localhost:*` | Specific domains only |
| Rate limiting | Relaxed | Enforced |
| Logging level | Debug | Info/Warn/Error |
| HTTPS | Not required | Required |
| Database | Local Supabase | Hosted Supabase |

## Learn More

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
