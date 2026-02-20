# Freedive App — Product Overview

## Summary

Freedive App is a mobile-first tool for discovering and planning freediving in Norway. Divers can find spots on an interactive map, log conditions after a dive, and build a shared knowledge base about Norwegian waters — helping everyone plan better and dive safer.

**Problems Solved:**
1. **No reliable place to find freediving spots in Norway** — A crowdsourced, map-based directory of Norwegian dive spots with descriptions, access info, and photos contributed by the diving community.
2. **Hard to know when conditions are good** — Dive reports let users log real conditions after every dive, building a live record others can trust when planning.
3. **Marine research lacks open community data** — Dive reports with visibility and observation data create an open, growing dataset shareable with research and local communities.
4. **Hard to find other divers in the area** — Public profiles and shared spot activity lay the groundwork for connecting divers.

**Key Features:**
- Interactive map with dive spot discovery and marker clustering
- Spot creation with GPS position, description, parking/access info, and photos
- Dive reports with visibility (meters), current rating (1–5), and overall rating (1–5)
- Photo attachments on spots (up to 5) and reports (up to 5) with optional captions
- Favorites for quick access to preferred spots
- User profiles with alias, avatar, and activity statistics
- Multilingual UI — Norwegian and English
- Norgeskart map tiles for accurate Norwegian geography

## Planned Sections

1. **Map & Spots** — Interactive map where users can discover, view, and create dive spots — with clustering, GPS positioning, descriptions, access info, and photos.
2. **Dive Reports** — Post-dive logging with visibility in meters, current rating, overall rating, and up to five photos per report — visible inside each spot's detail view.
3. **Auth & Profiles** — User authentication, editable profiles with alias and avatar, public profile views showing report authors, basic activity statistics, and a Favorites tab for quick access to saved dive spots.

## Product Entities

- **User** — Registered diver with public alias, avatar, and profile stats
- **DiveSpot** — Named location with GPS coordinates, description, access info, and photos
- **DiveReport** — Post-dive log with visibility (meters), current (1–5), optional photos/notes
- **SpotRating** — User's quality rating per spot (1–5 stars, unique per user+spot)
- **Photo** — Image attached to a spot or report (pre-signed upload)
- **Favorite** — Reference connecting a user to a saved dive spot

## Design System

**Colors:**
- Primary: emerald
- Secondary: teal
- Neutral: stone

**Typography:**
- Heading: Space Grotesk
- Body: Inter
- Mono: IBM Plex Mono

## Implementation Sequence

Build this product in milestones:

1. **Shell** — Set up design tokens and application shell (fullscreen map, bottom tab bar, search bar)
2. **Map & Spots** — Interactive map with spot discovery, detail sheets, and spot creation
3. **Dive Reports** — Multi-step dive logging form and spot rating sheet
4. **Auth & Profiles** — Authentication pages and user profile management

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
