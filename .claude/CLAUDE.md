# CLAUDE.md

Project memory for Claude Code. Keep this file lean; detailed rules live in `.claude/rules/*.md`.

## Project Overview

DiveFreely is a pnpm monorepo:
- `apps/backend`: NestJS (Fastify), Prisma, Supabase Postgres + PostGIS
- `apps/mobile`: Expo React Native app (iOS + Android only, no web support)
- `packages/shared`: shared types/constants (`@freediving/shared`)

## Source of Truth

Use docs before introducing new patterns:
- `docs/DOMAIN.md`: domain invariants and business rules
- `docs/USECASE.md`: user flows and operations
- `docs/ARCHITECTURE.md`: architecture and dependency direction
- `docs/UI_DESIGN.md`: design system, component specs, and UI flows
- `docs/ROADMAP.md`: development milestones and implementation sequence
- `docs/VISION.md`: product scope and MVP constraints
- `docs/QUALITY.md`: security/quality/testing expectations
- `docs/CONTRIBUTING.md`: workflow and contribution rules

## Rules Layout

Use path-scoped rules in `.claude/rules/`:
- `backend.md`
- `mobile.md`
- `auth.md`
- `domain.md`
- `prisma.md`
- `testing.md`
- `workflow.md`

## Execution Standard

Task lifecycle (mandatory):
- Understand -> Plan -> Implement -> Verify -> Report

Before implementation:
- Gather context from relevant files and existing patterns.
- Ask targeted clarifying questions when ambiguity changes behavior, interfaces, data integrity, auth, or platform behavior.
- Proactively surface likely blind spots (edge cases, permission boundaries, data invariants, regressions).

## Verification-First Completion Gate

Do not declare work complete unless one of the following is true:
- Relevant verification checks were executed and results reported.
- A check could not be executed, and the response states exactly what was not run, why, and what risk remains unverified.

Minimum verification intent for behavior changes:
- Verify intended behavior in changed area.
- Verify no obvious regression in adjacent touched flows.
- Apply risk-based verification depth from `.claude/rules/testing.md`.

## Verification Evidence Format

Final delivery must include these sections:
- `Changes made`
- `Verification run`
- `Not run / limitations`
- `Risk notes`

Keep each section concise and specific (commands + pass/fail + residual risk).

## Global Non-Negotiables

- Preserve existing architecture and dependency direction.
- Keep domain logic framework-independent.
- Do not commit or open PRs unless explicitly requested.
- Prefer minimal, focused diffs over broad rewrites.
- Any behavior change must include tests or a clear testing rationale.
- Validate mobile-impacting changes for both iOS and Android.

## Commands

See `package.json` for available scripts.
