# Milestone 4: Auth & Profiles

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete; Milestones 2 and 3 help for wiring activity data

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Implement authentication and user profile management.

## Overview

Auth & Profiles covers user authentication (email/password, Google OAuth, password reset) and a full personal profile page. The auth page is a standalone full-screen view with a dramatic deep-ocean aesthetic. The profile page lives inside the app shell (passed as `pageContent`) and uses an iOS-settings-style layout showing activity stats, dive history, created spots, and saved favorites.

**Key Functionality:**
- Login with email/password or "Continue with Google"
- Sign up with alias, email, password, and optional avatar upload
- Password reset via email (with success confirmation state)
- Profile page with avatar (initials fallback), alias, bio, and activity stat strip
- iOS-settings-style grouped list: Activity, Account, More sections
- Activity detail views: Dive Reports list, My Spots list, Saved Spots list
- Inline profile editing (alias, bio, avatar)
- Language preference (English / Norsk)
- Password change form
- Legal text view
- Logout

## Components Provided

Copy from `product-plan/sections/auth-and-profiles/components/`:

- `AuthPage` — Full-screen auth page (login / signup / forgot password)
- `ProfilePage` — Profile management page (rendered inside the shell)

## Props Reference

**`AuthPage` props:**
```tsx
<AuthPage
  onLogin={(email, password) => handleLogin(email, password)}
  onGoogleLogin={() => handleGoogleLogin()}
  onSignUp={(alias, email, password, avatar) => handleSignUp(...)}
  onForgotPassword={(email) => sendPasswordReset(email)}
/>
```

**`ProfilePage` props:**
```tsx
<ProfilePage
  currentUser={authenticatedUser}
  diveReports={userDiveReports}
  createdSpots={userCreatedSpots}
  favorites={userFavorites}
  stats={activityStats}
  onEditProfile={(updates) => handleProfileEdit(updates)}
  onChangePassword={(payload) => handlePasswordChange(payload)}
  onLogout={() => handleLogout()}
  onChangeLanguage={(lang) => handleLanguageChange(lang)}
/>
```

**Shell integration for the profile page:**
```tsx
<AppShell
  mapContent={<YourMap />}
  pageContent={isProfileRoute ? <ProfilePage {...profileProps} /> : undefined}
  navigationItems={navItems}
  onNavigate={handleNav}
/>
```

## Expected User Flows

### Flow 1: Email Login

1. User visits the auth page
2. Enters email and password
3. Clicks "Log in"
4. **Outcome:** `onLogin(email, password)` fires; redirect to map on success

### Flow 2: Sign Up

1. User clicks "Sign up"
2. Optionally adds avatar photo
3. Fills alias, email, password
4. Clicks "Create account"
5. **Outcome:** `onSignUp(alias, email, password, file?)` fires; redirect to map on success

### Flow 3: Forgot Password

1. User clicks "Forgot password?"
2. Enters email
3. Clicks "Send reset link"
4. **Outcome:** Success state shows "Check your email" with the entered email address

### Flow 4: Edit Profile

1. On profile page, user clicks "Edit"
2. Inline form shows with current alias, bio, avatar upload
3. User edits and clicks "Save changes"
4. **Outcome:** `onEditProfile({ alias, bio, avatar })` fires; form closes

### Flow 5: View Dive Reports

1. User taps "Dive Reports" row in Activity section
2. List of dive report cards appears (spot name, date, stars, visibility, current)
3. Empty reports show 🤿 emoji and "No dive reports yet"
4. User taps "Back" to return to the main settings list

### Flow 6: Log Out

1. User taps "Log out" (red text) in More section
2. **Outcome:** `onLogout()` fires immediately; redirect to auth page

## Empty States

The profile detail views all include empty states:

- **Dive Reports empty:** 🤿 + "No dive reports yet"
- **My Spots empty:** 📍 + "No spots created yet"
- **Saved Spots empty:** ♥ + "No saved spots yet"
- **Favorite with no reports:** Shows "No reports" instead of visibility metric

## Testing

See `product-plan/sections/auth-and-profiles/tests.md` for UI behavior test specs covering:
- Auth form submission and validation
- View switching (login ↔ signup ↔ forgot password)
- Profile editing and cancellation
- Activity list navigation and empty states
- Language selection
- Logout

## Files to Reference

- `product-plan/sections/auth-and-profiles/README.md` — Feature overview
- `product-plan/sections/auth-and-profiles/tests.md` — UI behavior test specs
- `product-plan/sections/auth-and-profiles/components/` — React components
- `product-plan/sections/auth-and-profiles/types.ts` — TypeScript interfaces
- `product-plan/sections/auth-and-profiles/sample-data.json` — Test data
- `product-plan/sections/auth-and-profiles/screenshot-auth.png` — Auth page visual reference
- `product-plan/sections/auth-and-profiles/screenshot-profile.png` — Profile page visual reference

## Done When

- [ ] Auth page renders with login, signup, and forgot password views
- [ ] View switching works (links between views, form state clears on switch)
- [ ] Login form calls `onLogin` with correct credentials
- [ ] Google login button calls `onGoogleLogin`
- [ ] Sign up form calls `onSignUp` with alias, email, password, optional avatar
- [ ] Forgot password shows success state after submission
- [ ] Profile page renders inside the app shell via `pageContent`
- [ ] Stat strip shows correct counts
- [ ] Activity lists render with data and correct empty states
- [ ] Profile edit form works (inline, saves changes, cancels)
- [ ] Language picker selects and persists language
- [ ] Password change form works
- [ ] Log out calls `onLogout`
- [ ] Avatar initials fallback works when `avatarUrl` is null
