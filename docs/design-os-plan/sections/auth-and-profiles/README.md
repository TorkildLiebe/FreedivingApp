# Auth & Profiles

## Overview

Authentication and personal profile management for the freediving app. Covers sign-up, login (email/password + Google OAuth), password reset, and a personal profile page with activity stats, dive history, created spots, and saved favorites.

## User Flows

- User logs in with email/password or "Continue with Google"
- User signs up with alias (required), email, password, and optional avatar
- User requests password reset via "Forgot password?" — sees success confirmation
- Logged-in user views their profile page (inside the app shell via `pageContent`)
- Profile shows header (avatar, alias, bio), stat strip (reports, spots, saved, member since), and an iOS-settings-style grouped list
- User edits their profile inline (alias, bio, avatar)
- User navigates to detail views: Dive Reports, My Spots, Saved Spots, Language
- User changes their preferred language (English / Norsk)
- User logs out from the "More" section
- Password and Legal rows are visible in the current profile UI but act as placeholders only

## Design Decisions

- `AuthPage` is a full-screen standalone page with a deep ocean background — NOT rendered inside the shell
- `ProfilePage` is rendered inside the shell via `AppShell`'s `pageContent` prop
- The profile page uses an iOS-settings-style grouped list with rounded card groups
- Empty states use emoji + text (🤿 for no reports, 📍 for no spots, ♥ for no favorites)
- Edit form is inline (not modal), toggled by the "Edit" button in the header
- Language picker uses radio-style rows with a checkmark indicator

## Data Shapes

**Entities used:** `AuthUser`, `DiveReportSummary`, `CreatedSpot`, `FavoriteSpot`, `ActivityStats`, `EditProfilePayload`

## Visual Reference

See `screenshot-auth.png` for the authentication page design.
See `screenshot-profile.png` for the profile page design.

## Components Provided

- `AuthPage` — Full-screen auth page with login, signup, and forgot-password views
- `ProfilePage` — Profile management page with settings, activity views, and edit form

## Callback Props

### AuthPage

| Callback | Triggered When |
|----------|----------------|
| `onLogin` | User submits email/password login |
| `onGoogleLogin` | User clicks "Continue with Google" |
| `onSignUp` | User submits the sign-up form |
| `onForgotPassword` | User submits the forgot password form |

### ProfilePage

| Callback | Triggered When |
|----------|----------------|
| `onEditProfile` | User saves profile edits |
| `onLogout` | User taps "Log out" |
| `onChangeLanguage` | User selects a language |
