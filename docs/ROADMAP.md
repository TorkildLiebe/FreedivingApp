# ROADMAP.md — DiveFreely (MVP)

Milestone-based development plan. Each milestone lists mobile work, backend work, and schema changes. See **DOMAIN.md** for entities, **USECASE.md** for flows, **UI_DESIGN.md** for component specs.

---

## M0: Foundation (Complete)

Monorepo setup, auth flow, users, spots, map skeleton.

| Area | Deliverables |
|------|-------------|
| **Backend** | NestJS + Fastify, Prisma, Supabase Postgres + PostGIS, health module, users module (GetMe), spots module (CRUD, BBOX listing), auth guard (JWT/JWKS), dev bypass, OpenAPI docs |
| **Mobile** | Expo Router shell, Supabase Auth integration, MapLibre + Kartverket tiles, basic spot markers, auth context, API client |
| **Schema** | User, DiveSpot, ParkingLocation models |

---

## M1: Design System & App Shell

Set up design tokens and the persistent app shell that wraps all sections.

| Area | Deliverables |
|------|-------------|
| **Mobile** | Design tokens (colors: emerald/teal/stone, fonts: Space Grotesk/Inter/IBM Plex Mono via expo-font), 2-tab bottom nav (Map/Profile), frosted glass pattern, floating search bar, safe area insets, `shared/theme/` module |
| **Backend** | No changes |
| **Schema** | No changes |

**Done when:** Tokens configured, shell renders with fullscreen map, bottom tab bar switches Map/Profile, search bar visible on map view, profile renders via pageContent.

---

## M2: Map & Spots (Full)

Complete the map experience with clustering, detail sheets, favorites, ratings display, spot creation, search, and photos.

| Area | Deliverables |
|------|-------------|
| **Mobile** | Marker clustering, SpotDetailSheet (bottom sheet with description, access info, photos, aggregated visibility + rating, dive logs), favorite toggle (heart icon), star rating display, CreateSpotOverlay (pin placement + form), search bar filtering, empty states, `features/spots/` module |
| **Backend** | Spots: photo attachment endpoints, favorites endpoints (add/remove/list), GetSpotWithReports enrichment (averageRating, averageVisibility, latestReport, isFavorited, currentUserRating) |
| **Schema** | PhotoAttachment model, favoriteSpotIds on User |

**Done when:** Spot markers cluster, detail sheet shows correct data, favorites persist, spot creation flow works, search filters markers, empty states display.

---

## M3: Dive Reports & Ratings

Dive logging and the separate spot rating system.

| Area | Deliverables |
|------|-------------|
| **Mobile** | AddDiveForm (2-step: visibility 0-30m slider + current selector, then notes + photos), RatingSheet (5-star picker with labels, auto-prompted after first dive if no existing rating), `features/reports/` and `features/ratings/` modules |
| **Backend** | Reports module (create, update, add photo), SpotRating module (upsert, get average), anti-duplication check, 48h edit window |
| **Schema** | DiveReport model (with `notes`), SpotRating model (unique userId+spotId) |

**Done when:** Dive form submits, visibility slider works (0-30m), rating sheet appears after first dive at a spot, logged dives appear in spot detail and profile, spot average rating updates.

---

## M4: Auth & Profiles

Authentication pages and full profile management.

| Area | Deliverables |
|------|-------------|
| **Mobile** | AuthPage (login, signup with alias, Google OAuth, forgot password), ProfilePage (iOS-settings style: avatar with initials fallback, alias, bio, stat strip), activity views (ListMyReports, ListMySpots, ListMyFavoriteSpots), inline profile editing, language picker (en/no), logout |
| **Backend** | UpdateMyProfile (alias, bio, avatarUrl, preferredLanguage), GetUserProfile (public), ListMyReports, ListMySpots, GetMyStats endpoints |
| **Schema** | User: rename `displayName` -> `alias`, add `bio` |

**Done when:** Auth flows work (email + Google), profile shows stats, activity lists render with data and empty states, profile edit saves, language persists, logout redirects.

---

## Post-MVP

Features deferred beyond MVP:

- **Password change flow** — delegated to Supabase Auth SDK
- **Offline support** — local caching and sync
- **Social features** — follow divers, activity feed, dive buddy matching
- **Admin UI** — moderation dashboard, user management
- **locationDescription** — derived/computed field for spots
- **Advanced media** — image resizing, gallery views
- **Discovery feed** — global latest reports/spots
- **Weather/tide integration** — planning signals

---

*Last updated: February 2026*
