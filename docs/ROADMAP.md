# ROADMAP.md — DiveFreely (MVP)

Quick status of what's built and what's next. `[x]` = done, `[ ]` = not yet.
See DOMAIN.md for business rules, USECASE.md for flows, UI_DESIGN.md for component specs.

Core MVP flows are implemented and moving through final test sign-off. The next milestone below only tracks the remaining MVP backlog items that still fit the current product docs.

---

## M0: Foundation

- [x] Monorepo, tooling (pnpm, TypeScript, Husky)
- [x] NestJS backend with JWT auth and dev bypass
- [x] Prisma + PostGIS schema (User, DiveSpot, ParkingLocation)
- [x] REST API: user identity and spots CRUD
- [x] Expo Router app with MapLibre + Kartverket tiles
- [x] Bottom tab navigation (Map + Profile)

---

## M1: Design System & App Shell

- [x] Design tokens (emerald/teal/stone colors, Space Grotesk/Inter fonts)
- [x] Frosted glass components (nav bar, search bar, bottom sheets)
- [x] Styled tab bar with icons and safe area insets
- [x] Floating search bar on map view
- [x] Profile page as full-page layer above map

---

## M2: Map & Spots

- [x] Marker clustering and spot name search
- [x] Spot detail sheet (description, access info, conditions, dive log list)
- [x] Spot photos (upload and display, up to 5 URL-based attachments)
- [x] Spot creation flow (pin on map, then form)
- [x] Favorites (save/unsave spots, persisted per user)
- [x] Ratings summary on spot detail (average + latest visibility)

---

## M3: Dive Reports & Ratings

- [x] Dive log form (visibility, current, notes, photos)
- [x] Dive log list on spot detail (newest first)
- [x] Edit dive log (within 48h of creation)
- [x] Star rating sheet (auto-prompted after first dive at a spot)

---

## M4: Auth & Profiles

- [x] Auth screens (email/password login + signup, Google OAuth, forgot password)
- [x] Profile page (avatar, alias, bio, activity stat strip)
- [x] My lists (dive reports, created spots, saved spots)
- [x] Inline profile editing (alias, bio, avatar upload)
- [x] Language picker (English / Norsk) and logout
- [ ] Password change flow (row exists in profile UI, not wired yet)
- [ ] Legal flow (row exists in profile UI, not wired yet)


---

## Post-MVP

- Offline support and local caching
- Social features (follow divers, activity feed, dive buddy matching)
- Admin moderation dashboard
- Weather and tide integration
- Discovery feed (global latest reports and spots)
- Rich photo attachments (captions / separate photo records)

---

*Last updated: March 2026*
