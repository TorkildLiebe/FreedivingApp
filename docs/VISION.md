# DiveFreely – Vision

## 1. Purpose
DiveFreely helps people in Norway discover good places to freedive, and share simple, useful info after a dive. The goal is a clear, lightweight tool you can trust when planning and logging dives. It is available in Norwegian and English to accommodate different users.

## 2. The Core Problem
- There’s no single, reliable place to find freediving spots in Norway.
- Divers struggle to plan **when** conditions will be good (visibility, current, waves, weather).
- It’s hard to find **other divers** in the area you want to dive.
- Marine research lacks open, high-quality community data about life in the Norwegian sea.

## 3. The Vision
A living map of Norwegian freediving where:
- Spots are easy to find on a clean map, with quick reports on visibility and conditions.
- Divers can **find each other** and plan dives together safely.
- Data (visibility, biodiversity observations, safety notes) can be **shared with research** and local communities.
- The app helps you **plan the best time to dive** using signals like currents, waves, and weather—starting simple, improving over time.

## 4. Guiding Principles
- **Mobile first, simple always** — fast map and quick report flow.
- **Feature‑based Modules** — code is organized by feature (vertical slices) rather than strict layers, while still keeping domain logic decoupled from infrastructure (making it easy to swap out parts later).
- **Data over social** — focus on trustworthy, useful data before social features.
- **Open, well-documented stack** — TypeScript, Supabase (Postgres/PostGIS + Auth + Storage), React Native/Expo; strong types and clear APIs.
- **Automation for one developer** — scripts, CI, and seeds that make it easy to build, test, and ship.

## 5. MVP Scope
- **Auth & profiles** (Supabase): `/me`, public profiles, edit my profile.
- **Dive spots**: create, update (center immutable), soft delete, list by BBOX, get by id.
- **Dive reports**: create, update (within 48h) with visibility (0-30m), current strength, optional notes; list inside spot detail.
- **Spot ratings**: 1-5 stars per user per spot (separate from dive reports, upsert semantics).
- **Photos**: attachments on **spots** (≤5) and **reports** (≤5) via pre‑signed uploads; captions allowed; no emoji.
- **Map**: Norgeskart tiles on client; clustering in frontend.
- **Favorites**: users can mark/unmark dive spots as favorites for quick access (personal list).
- **Multilingual UI**: interface supports English and Norwegian (user can choose preferred language).
- **Out of scope**: social feed, chat, realtime tracking, global “latest” feed, admin UI.

*Last updated: February 2026*