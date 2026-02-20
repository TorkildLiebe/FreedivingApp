# Test Specs: Auth & Profiles

These test specs are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Auth & Profiles covers user authentication (login, signup, password reset) and profile management (edit profile, view activity, change language/password, log out). The auth page is a full-screen standalone view; the profile page is rendered inside the app shell.

---

## User Flow Tests

### Flow 1: Email/Password Login

**Scenario:** User logs in with valid credentials

**Setup:**
- `AuthPage` is rendered with default view ('login')

**Steps:**
1. Page shows "Sign in to continue"
2. "Continue with Google" button is visible
3. User enters email "user@example.com"
4. User enters password "password123"
5. User clicks "Log in"

**Expected Results:**
- [ ] `onLogin` is called with ("user@example.com", "password123")

#### Validation

**Steps:**
1. User submits form with empty email or password

**Expected Results:**
- [ ] Native HTML5 validation prevents submission
- [ ] `onLogin` is NOT called

---

### Flow 2: Google Login

**Scenario:** User clicks "Continue with Google"

**Steps:**
1. User clicks the Google button

**Expected Results:**
- [ ] `onGoogleLogin` is called
- [ ] Button shows Google logo with "Continue with Google" label

---

### Flow 3: Sign Up

**Scenario:** User creates a new account

**Steps:**
1. User clicks "Sign up" link
2. Page shows "Create an account"
3. User clicks avatar area to upload a photo
4. User enters alias "deepwater_dag"
5. User enters email and password
6. User clicks "Create account"

**Expected Results:**
- [ ] `onSignUp` is called with (alias, email, password, file?)
- [ ] Avatar preview shows after file selection
- [ ] "Already have an account? Log in" link is visible

#### Without Avatar

**Steps:**
1. User fills in alias, email, password only
2. Clicks "Create account"

**Expected Results:**
- [ ] `onSignUp` is called with (alias, email, password, undefined)

---

### Flow 4: Forgot Password

**Scenario:** User requests a password reset

**Steps:**
1. On login view, user clicks "Forgot password?"
2. View changes to "Reset password"
3. User enters email "user@example.com"
4. User clicks "Send reset link"

**Expected Results:**
- [ ] `onForgotPassword` is called with "user@example.com"
- [ ] Success state shows: "Check your email" heading
- [ ] Shows confirmation: "We've sent a reset link to user@example.com"
- [ ] "← Back to login" link appears

---

### Flow 5: Navigate Between Auth Views

**Scenario:** User switches between login, signup, and forgot password

**Expected Results:**
- [ ] Login → "Sign up" link → switches to signup view
- [ ] Signup → "Log in" link → switches to login view
- [ ] Login → "Forgot password?" → switches to forgot password view
- [ ] Forgot password → "← Back to login" → switches to login view
- [ ] Switching views clears all form fields

---

### Flow 6: Edit Profile

**Scenario:** Logged-in user edits their alias and bio

**Setup:**
- `ProfilePage` is rendered with `currentUser` data

**Steps:**
1. Profile header shows user's alias and bio
2. User clicks "Edit" button
3. Edit form appears (alias input, bio textarea, avatar upload)
4. User changes alias to "new_alias"
5. User changes bio to "New bio text"
6. User clicks "Save changes"

**Expected Results:**
- [ ] Edit form shows pre-filled with current values
- [ ] `onEditProfile` is called with `{ alias: "new_alias", bio: "New bio text", avatar: null }`
- [ ] Edit form is hidden after save

#### Cancel Edit

**Steps:**
1. User opens edit form
2. User makes changes
3. User clicks "Cancel"

**Expected Results:**
- [ ] Form closes
- [ ] `onEditProfile` is NOT called
- [ ] Profile still shows original values (until real data is refreshed)

---

### Flow 7: View Activity Lists

**Scenario:** User navigates to "Dive Reports" from the settings menu

**Steps:**
1. Profile shows "Activity" section with "Dive Reports (6)" row
2. User clicks "Dive Reports" row
3. Dive Reports detail view appears with a "Back" button

**Expected Results:**
- [ ] Dive report cards show: spot name, date, star rating, visibility, current label
- [ ] Notes are shown (truncated to 2 lines) if present
- [ ] "Back" button returns to main settings menu

---

### Flow 8: Change Language

**Scenario:** User changes their preferred language

**Steps:**
1. User clicks "Language" in Account section (shows "English" as current)
2. Language picker shows two options: English (with checkmark), Norsk
3. User clicks "Norsk"

**Expected Results:**
- [ ] `onChangeLanguage` is called with "no"
- [ ] "Norsk" option shows checkmark
- [ ] "English" option loses checkmark

---

### Flow 9: Change Password

**Scenario:** User changes their password

**Steps:**
1. User clicks "Password" in Account section
2. Change Password view appears
3. User enters current password and new password
4. User clicks "Save password"

**Expected Results:**
- [ ] `onChangePassword` is called with `{ currentPassword, newPassword }`
- [ ] Returns to main menu after save

---

### Flow 10: Log Out

**Scenario:** User logs out

**Steps:**
1. User sees "Log out" row in "More" section (red text)
2. User clicks "Log out"

**Expected Results:**
- [ ] `onLogout` is called immediately
- [ ] Row has no chevron icon

---

## Empty State Tests

### No Dive Reports

**Setup:**
- `diveReports: []`

**Steps:**
1. User navigates to "Dive Reports"

**Expected Results:**
- [ ] Shows 🤿 emoji
- [ ] Shows "No dive reports yet"
- [ ] No report cards are rendered

### No Created Spots

**Setup:**
- `createdSpots: []`

**Expected Results:**
- [ ] Shows 📍 emoji
- [ ] Shows "No spots created yet"

### No Saved Spots (Favorites)

**Setup:**
- `favorites: []`

**Expected Results:**
- [ ] Shows ♥ symbol
- [ ] Shows "No saved spots yet"

### Favorite with No Reports

**Setup:**
- `favorites` contains an entry with `latestVisibilityMeters: null` and `latestReportDate: null`

**Expected Results:**
- [ ] Shows "No reports" in place of visibility metric
- [ ] No "Last report" date is shown

---

## Component Interaction Tests

### ProfilePage — Stat Strip

**Renders correctly with data:**
- [ ] Shows total reports count
- [ ] Shows unique spots dived count
- [ ] Shows favorites count
- [ ] Shows "Since" as abbreviated month + year (e.g., "Aug 2023")

### ProfilePage — Avatar

- [ ] Shows avatar image if `avatarUrl` is not null
- [ ] Shows initials (first letter of each word in alias, max 2 chars, uppercase) if `avatarUrl` is null
- [ ] Initials avatar uses emerald color scheme

### AuthPage — View Title

- [ ] Login view shows "Sign in to continue"
- [ ] Signup view shows "Create an account"
- [ ] Forgot password view shows "Reset password"

---

## Edge Cases

- [ ] Very long alias truncates in the profile header
- [ ] Very long bio wraps correctly without overflowing
- [ ] Settings rows with counts show the count from actual array lengths (not hardcoded)
- [ ] Account creation date in "Since" column handles different years correctly
- [ ] Avatar upload preview shows before form is submitted

---

## Accessibility Checks

- [ ] Login/signup form inputs have associated labels or aria-labels
- [ ] Password fields use `type="password"`
- [ ] "Forgot password?" is a keyboard-accessible button
- [ ] Settings rows respond to keyboard interaction (Enter/Space)
- [ ] "Log out" row is visually distinct (red text) and labeled appropriately

---

## Sample Test Data

```typescript
// Current user
const mockUser = {
  id: "user-1",
  alias: "Torkild",
  email: "torkild@example.com",
  bio: "Freediver based in Oslo.",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
  createdAt: "2023-08-15T10:22:00Z",
  preferredLanguage: "no" as const,
};

// Activity stats
const mockStats = {
  totalReports: 6,
  uniqueSpotsDived: 5,
  favoritesCount: 5,
  memberSince: "2023-08-15T10:22:00Z",
};

// Minimal dive report summary
const mockReport = {
  id: "report-1",
  spotId: "spot-1",
  spotName: "Steilneset Point",
  date: "2026-01-28T09:15:00Z",
  visibilityMeters: 12,
  currentStrength: 2 as const,
  overallRating: 5 as const,
  notes: "Exceptional day. Crystal clear water.",
  photos: [],
};

// Favorite with no reports
const mockFavoriteEmpty = {
  id: "fav-4",
  spotId: "spot-ext-5",
  spotName: "Gressholmen Arch",
  locationDescription: "Gressholmen island, Oslofjord",
  latestVisibilityMeters: null,
  latestReportDate: null,
};
```
