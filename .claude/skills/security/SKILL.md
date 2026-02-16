---
name: security
description: Reviews code for security vulnerabilities including OWASP Top 10, auth/authorization issues, injection attacks, and DiveFreely-specific security concerns
---

# Security Review Skill

Reviews code for security vulnerabilities and best practices in the DiveFreely monorepo.

## When to Use This Skill

Use this skill to:
- Review new features for security vulnerabilities
- Audit auth and authorization logic
- Check for injection vulnerabilities
- Validate secrets handling
- Pre-PR security checklist

## OWASP Top 10 Checks

### 1. Injection (SQL, NoSQL, Command)

**SQL Injection:**
- ✅ Use Prisma parameterized queries
- ✅ Use `$queryRaw` with template literals (auto-escapes)
- ❌ Never concatenate user input into SQL

```typescript
// GOOD - Prisma auto-escapes
await prisma.$queryRaw`SELECT * FROM spots WHERE id = ${userInput}`;

// BAD - String concatenation
await prisma.$queryRawUnsafe(`SELECT * FROM spots WHERE id = '${userInput}'`);
```

**Command Injection:**
- ❌ Never pass user input to `child_process.exec`
- ✅ Use `execFile` with args array if needed

### 2. Broken Authentication

**JWT Verification:**
- ✅ Verify JWT with JWKS
- ✅ Check issuer and audience
- ❌ Never skip token verification in production
- ❌ Never decode JWT without verification

```typescript
// GOOD - Verify with JWKS
const { payload } = await jwtVerify(token, jwks, {
  issuer: SUPABASE_JWT_ISSUER,
  audience: 'authenticated',
});

// BAD - Decode without verification
const payload = jwt.decode(token); // INSECURE
```

**Dev Bypass:**
- ❌ NEVER enable `AUTH_DEV_BYPASS=true` in production
- ✅ Verify `NODE_ENV=production` disables dev bypass
- ✅ Add CI test to ensure dev bypass cannot be enabled

### 3. Sensitive Data Exposure

**Secrets:**
- ❌ Never log JWTs, passwords, tokens
- ❌ Never commit secrets to git
- ✅ Use environment variables for all secrets
- ✅ Use `.env.example` without real values

**Response Data:**
- ❌ Never expose `createdBy` user IDs in API responses
- ❌ Never expose `isDeleted` field in public APIs
- ✅ Use response DTOs with `@Exclude()` decorator
- ✅ Use Prisma `select` to limit returned fields

```typescript
// GOOD - Response DTO excludes sensitive fields
export class SpotResponseDto {
  @Expose() id: string;
  @Expose() title: string;
  @Exclude() createdBy: string;
  @Exclude() isDeleted: boolean;
}
```

### 4. Authorization

**Ownership Checks:**
- ✅ Always verify ownership before mutations
- ✅ Check `spot.createdBy === userId` before update/delete
- ✅ Allow mods/admins to bypass ownership checks

**Role Checks:**
- ✅ Verify role before privileged operations
- ❌ Never trust client-sent role (use JWT claim only)
- ✅ Use `userRole in ['moderator', 'admin']` for privileged actions

```typescript
// GOOD - Ownership check
const spot = await this.findById(id);
if (spot.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
  throw new UnauthorizedError('Not authorized');
}

// BAD - No authorization check
await this.repository.update(id, dto); // Anyone can update!
```

### 5. Security Misconfiguration

**CORS:**
- ✅ Restrict CORS to known origins
- ❌ Never use `origin: '*'` in production
- ✅ Use environment-specific CORS config

**Rate Limiting:**
- ✅ Already configured (60 req/min per IP)
- ✅ Apply to all endpoints by default
- ✅ Stricter limits for auth endpoints

**Headers:**
- ✅ Helmet.js already configured in backend
- ✅ HSTS, X-Frame-Options, CSP headers set

### 6. XSS (Cross-Site Scripting)

**Mobile (React Native):**
- ✅ React Native Text components auto-escape
- ❌ Never render HTML from user input
- ✅ No dangerouslySetInnerHTML in mobile

**Backend (API):**
- ✅ No HTML rendering (JSON API only)
- ✅ Sanitize input at validation layer if needed

### 7. Insecure Deserialization

**JSON Parsing:**
- ✅ NestJS auto-validates with class-validator
- ✅ Use DTOs for all request bodies
- ❌ Never use `eval()` or `Function()`

### 8. Using Components with Known Vulnerabilities

**Dependencies:**
- ✅ Run `pnpm audit` regularly
- ✅ Update dependencies with `pnpm update`
- ✅ Fix high/critical vulnerabilities immediately

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix
```

### 9. Insufficient Logging & Monitoring

**Logging:**
- ✅ Log authentication attempts
- ✅ Log authorization failures
- ✅ Log domain errors
- ❌ Never log sensitive data (passwords, tokens, PII)

```typescript
// GOOD - Log error without sensitive data
logger.error('Failed to create spot', { spotId, userId, error: err.message });

// BAD - Logs sensitive data
logger.error('Failed', { token, password }); // NEVER DO THIS
```

### 10. API Security

**Input Validation:**
- ✅ Validate all DTOs with class-validator
- ✅ Validate array sizes (`@ArrayMaxSize`)
- ✅ Validate string lengths (`@MaxLength`)
- ✅ Validate formats (`@IsEmail`, `@IsLatitude`)

**File Uploads:**
- ✅ Use pre-signed URLs for uploads
- ✅ Validate MIME types
- ✅ Limit file sizes (10MB max)
- ❌ Never allow direct file uploads to server

## DiveFreely-Specific Security

### Location Privacy

- ❌ Never expose exact user location without permission
- ✅ Only show spot locations (user-submitted)
- ✅ Strip EXIF GPS data from uploaded photos
- ❌ Never track user location in background

### Photo Uploads

- ✅ Use Supabase pre-signed URLs
- ✅ Validate MIME type before generating URL
- ✅ Set expiration on pre-signed URLs (15 min)
- ✅ Scan uploads for malware (Supabase feature)

### Parking Location Accuracy

- ✅ Limit parking precision to ~10m (5 decimal places)
- ❌ Never expose exact coordinates of private property
- ✅ Validate parking is within 5000m of spot

## Quick Security Audit Commands

```bash
# Find hard-coded secrets
grep -rn "password\|secret\|token\|key" apps/ --include="*.ts" --exclude-dir=node_modules

# Find missing AuthGuard
grep -rn "@Post\|@Put\|@Delete" apps/backend/src/ | grep -v "UseGuards"

# Find SQL injection risks
grep -rn "\$queryRawUnsafe" apps/backend/

# Find console.log (remove before prod)
grep -rn "console.log" apps/ --include="*.ts" --exclude-dir=node_modules

# Check for dev bypass in prod
grep -rn "AUTH_DEV_BYPASS" apps/backend/
```

## Security Checklist

Before merging:

- [ ] All mutations have `@UseGuards(AuthGuard)`
- [ ] Ownership/role checked before updates
- [ ] No secrets in code or logs
- [ ] DTOs validate all inputs
- [ ] Error messages don't leak sensitive info
- [ ] `AUTH_DEV_BYPASS` cannot be enabled in production
- [ ] No console.log statements
- [ ] Pre-signed URLs used for file uploads
- [ ] Tests cover authorization logic

## Reference Files

For detailed security patterns:
- `security-checklist.md` - Complete checklist
- `../backend-dev/auth-flow.md` - Auth patterns

## Related Skills

- `/backend-dev` - Auth guard and authorization
- `/audit-rules` - Domain validation
- `/test-backend` - Testing auth logic

---

*Skill for security review (Issue #53)*
