# Manual Testing Guide - Interactive Map with Spots

## Prerequisites

- Node.js 18+ installed
- Supabase local development running
- iOS Simulator or Android Emulator (or physical device)

## Setup

### 1. Start Backend

```bash
# Terminal 1: Start backend server
cd apps/backend
pnpm start:dev

# Terminal 2: Seed test data
cd apps/backend
pnpm prisma:seed
```

**Expected output:**
```
🌊 Starting seed...
✓ Created test user: test@divefreely.com
✓ Created 25 dive spots
🌊 Seed completed!
```

**Verify database:**
```bash
pnpm prisma:studio
```
- Navigate to `DiveSpot` table
- Should see 25 spots in Norway (Oslofjord area)

### 2. Start Mobile App

```bash
# Terminal 3: Start Expo
cd apps/mobile
npx expo start

# Press 'i' for iOS or 'a' for Android
```

## Test Flow

### Test 1: User Signup & Sync

**Steps:**
1. App opens → Should redirect to login screen
2. Tap "Sign up" link
3. Enter email: `test-user-1@example.com`
4. Enter password: `password123`
5. Tap "Sign Up"

**Expected:**
- ✅ Redirects to map screen
- ✅ Backend creates user in `public.User` table
- ✅ Check Prisma Studio: New user appears with:
  - `email`: `test-user-1@example.com`
  - `externalId`: Supabase UUID
  - `role`: `USER`
  - `preferredLanguage`: `EN`

**Backend logs** (Terminal 1):
```
LOG [UsersService] Creating user: test-user-1@example.com
LOG [UsersService] User created: <user-id>
```

### Test 2: Profile Access

**Steps:**
1. On map screen, tap profile button (top-right avatar)
2. Should navigate to `/profile`

**Expected:**
- ✅ Profile loads successfully
- ✅ Shows user email
- ✅ Shows initials avatar (or avatar image if set)
- ✅ Shows role, join date, language

**If it fails:**
- Check backend is running
- Check network inspector for `/users/me` request
- Verify JWT token is in request headers

### Test 3: Interactive Map with Spots

**Steps:**
1. Go back to map screen
2. Map centers on your location (or Norway default)
3. Pan/zoom around Oslofjord area (lat: 59.9, lon: 10.7)

**Expected:**
- ✅ Blue markers appear on map
- ✅ Markers show dive spot titles
- ✅ Loading indicator shows while fetching
- ✅ Markers update when panning/zooming

**Verify spot markers:**
- Should see spots near Oslo:
  - "Hovedøya Wreck"
  - "Drøbak Marina Drop-off"
  - "Tisler Reef" (Hvaler)
  - And 22 more...

**Tap a marker:**
- Should see title in callout
- Console logs: `Spot pressed: <spot-id> <spot-title>`

### Test 4: Dynamic Loading

**Steps:**
1. Zoom out to see all of Norway
2. Observe "Loading spots..." indicator
3. Zoom in to Oslofjord area
4. Pan to different regions

**Expected:**
- ✅ API calls trigger on region change
- ✅ Spots load for current viewport
- ✅ Backend logs show bbox queries

**Backend logs:**
```
LOG [SpotsController] GET /spots?latMin=59.0&latMax=60.0&lonMin=10.0&lonMax=11.0
LOG [SpotsRepository] Found 8 spots in bbox
```

### Test 5: Truncation Warning

**Steps:**
1. Create 300+ spots in a small area (optional, requires seeding more data)
2. Zoom to that area

**Expected:**
- ⚠️ Yellow warning: "Too many spots. Zoom in for more results."
- Only 300 spots rendered (default limit)

### Test 6: Login with Existing User

**Steps:**
1. Logout from profile
2. Login with: `test@divefreely.com` / (password from Supabase)

**Expected:**
- ✅ Logs in successfully
- ✅ Backend retrieves existing user (no duplicate created)
- ✅ Profile shows user data

## Troubleshooting

### Issue: "Unable to load profile"

**Cause:** Backend not running or not reachable

**Fix:**
1. Check backend is running: `curl http://localhost:3000/health`
2. Check mobile config: `apps/mobile/app.json` → `EXPO_PUBLIC_API_URL`
3. For iOS Simulator: Use `http://localhost:3000`
4. For Android Emulator: Use `http://10.0.2.2:3000`

### Issue: No spots appear on map

**Cause:** Database not seeded or backend not running

**Fix:**
```bash
cd apps/backend
pnpm prisma:seed
```

Verify in Prisma Studio: `DiveSpot` table should have 25 rows.

### Issue: Map shows error "Could not retrieve location"

**Cause:** Location permissions not granted

**Fix:**
- iOS: Allow location access in simulator
- Android: Settings → Apps → Expo Go → Permissions → Location

### Issue: Markers don't update when panning

**Cause:** React Query caching or state issue

**Fix:**
1. Pull to refresh on map (if implemented)
2. Restart app
3. Check console for errors

## Backend API Testing (Optional)

Test endpoints directly with curl:

### Get spots in bbox:
```bash
curl "http://localhost:3000/spots?latMin=59.0&latMax=60.0&lonMin=10.0&lonMax=11.0"
```

**Expected response:**
```json
{
  "items": [
    {
      "id": "...",
      "title": "Hovedøya Wreck",
      "centerLat": 59.9139,
      "centerLon": 10.7522,
      ...
    }
  ],
  "count": 8,
  "truncated": false
}
```

### Get current user (requires auth):
```bash
# Get token from mobile app (check network inspector)
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3000/users/me
```

## Automated Testing & CI

### Running Tests Locally

**Run backend tests:**
```bash
pnpm test:backend          # Unit tests only
pnpm test:backend:cov      # With coverage report
pnpm test:e2e              # End-to-end tests
```

**Run full CI test suite (before creating PR):**
```bash
pnpm test:ci               # Runs comprehensive checks
```

The `test:ci` command runs:
- Clean build of shared package
- Prisma client generation
- Backend linting
- Backend type checking
- Backend tests with coverage
- Backend build verification
- Coverage threshold check (80%)

### Git Hooks (Husky)

Automated checks run at different stages:

**Pre-commit** (runs on every commit):
- Prevents direct commits to `main` branch
- Lints backend and mobile
- Type checks all packages

**Pre-push** (runs before `git push`):
- Runs full CI test suite (`pnpm test:ci`)
- Ensures all tests pass before pushing

**Commit-msg** (validates commit format):
- Enforces conventional commits: `type#issue: description`
- Example: `feat#123: add user profile`

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit checks
git commit --no-verify -m "feat#123: emergency fix"

# Skip pre-push checks
git push --no-verify
```

⚠️ **Use sparingly!** Bypassing hooks may cause CI failures.

### CI Pipeline

Pull requests automatically run:
- Linting
- Type checking
- Unit tests with 80% coverage requirement
- E2E tests (with Supabase local instance)
- Build verification
- Security audit

**Triggers:**
- Changes to `apps/backend/**`
- Changes to `packages/shared/**`
- Changes to `pnpm-lock.yaml`
- Changes to CI workflow files

## Success Criteria

- ✅ New users created in backend on signup
- ✅ Profile accessible immediately after signup
- ✅ Map shows 25 test spots
- ✅ Spots load dynamically on pan/zoom
- ✅ Backend tests pass: 16/16
- ✅ Coverage: 83%+ statements
- ✅ Type checks pass (both apps)
- ✅ Linting passes (warnings only)

## Cleanup

To reset test data:
```bash
cd apps/backend
pnpm prisma migrate reset --force
pnpm prisma:seed
```

To delete test users from Supabase:
1. Supabase Dashboard → Authentication → Users
2. Find test users and delete manually
