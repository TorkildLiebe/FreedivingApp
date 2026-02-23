# ROADMAP.md — DiveFreely (MVP)

Quick status of what's built and what's next. `[x]` = done, `[ ]` = not yet.
See DOMAIN.md for business rules, USECASE.md for flows, UI_DESIGN.md for component specs.

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

- [ ] Design tokens (emerald/teal/stone colors, Space Grotesk/Inter fonts)
- [ ] Frosted glass components (nav bar, search bar, bottom sheets)
- [ ] Styled tab bar with icons and safe area insets
- [ ] Floating search bar on map view
- [ ] Profile page as full-page layer above map

---

## M2: Map & Spots

- [ ] Marker clustering and spot name search
- [ ] Spot detail sheet (description, access info, conditions, dive log list)
- [ ] Spot photos (upload and display, up to 5)
- [ ] Spot creation flow (pin on map, then form)
- [ ] Favorites (save/unsave spots, persisted per user)
- [ ] Ratings summary on spot detail (average + latest visibility)

---

## M3: Dive Reports & Ratings

- [ ] Dive log form (visibility, current, notes, photos)
- [ ] Dive log list on spot detail (newest first)
- [ ] Edit dive log (within 48h of creation)
- [ ] Star rating sheet (auto-prompted after first dive at a spot)

---

## M4: Auth & Profiles

- [ ] Auth screens (email/password login + signup, Google OAuth, forgot password)
- [ ] Profile page (avatar, alias, bio, activity stat strip)
- [ ] My lists (dive reports, created spots, saved spots)
- [ ] Inline profile editing (alias, bio, avatar upload)
- [ ] Language picker (English / Norsk) and logout

---

## Post-MVP

- Password change flow
- Offline support and local caching
- Social features (follow divers, activity feed, dive buddy matching)
- Admin moderation dashboard
- Weather and tide integration
- Discovery feed (global latest reports and spots)

---

*Last updated: February 2026*
