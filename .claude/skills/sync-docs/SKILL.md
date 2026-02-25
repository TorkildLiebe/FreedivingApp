---
name: sync-docs
description: Keeps DiveFreely documentation synchronized with code changes, updates DOMAIN.md, ARCHITECTURE.md, USECASE.md when entities, patterns, or APIs change
---

# Document Synchronizer Skill

Keeps documentation in sync with code changes in the DiveFreely monorepo.

## When to Use This Skill

Use this skill to:
- Update docs after adding/changing domain entities
- Document new API endpoints or modules
- Sync architecture docs when patterns change
- Ensure DOMAIN.md matches validation code
- Update folder structure examples

## Design Drift Sync

For UI work, treat `docs/design-os-plan` as the canonical design reference.

- When implementation intentionally diverges from Design OS guidance, record explicit drift in delivery/reporting with rationale.
- If divergence is intended to persist, update canonical product docs to reflect the new behavior and avoid silent drift.
- If divergence is temporary or blocked by constraints, document residual risk and follow-up actions.

## What to Update When

### Domain Entity Changes

**When adding/modifying Prisma models:**
1. Update `docs/DOMAIN.md`:
   - Add new entity section
   - Document field constraints
   - Specify validation rules
   - Add relationship rules

2. Update `docs/ARCHITECTURE.md`:
   - Add to ER diagram description
   - Document new relationships

**Example:**
```
Code change: Added `difficulty` field to DiveSpot
Doc update: Update DOMAIN.md "Spot Domain Rules" section:
  - Difficulty: enum ['easy', 'moderate', 'difficult', 'expert']
  - Optional field, no emoji restriction
```

### API Endpoint Changes

**When adding/modifying controllers:**
1. Update `docs/USECASE.md`:
   - Add endpoint to API list
   - Document request/response
   - Specify auth requirements
   - Add use case flow if complex

2. Update API client in mobile:
   - Add method to infrastructure/api
   - Document in code comments

**Example:**
```
Code change: Added POST /spots/:id/photos
Doc update: Add to USECASE.md "Spot Management" section:
  - POST /spots/:id/photos - Upload spot photo (auth required)
  - Request: multipart/form-data with image
  - Response: { id, url, uploadedAt }
```

### Architecture Pattern Changes

**When introducing new patterns:**
1. Update `docs/ARCHITECTURE.md`:
   - Document pattern with code example
   - Explain when to use it
   - Show file structure

2. Update CLAUDE.md if pattern is critical

**Example:**
```
Code change: Introduced event-driven pattern for notifications
Doc update: Add "Event-Driven Patterns" section to ARCHITECTURE.md:
  - When to use: Async operations, side effects
  - Implementation: NestJS EventEmitter
  - Example: SpotCreatedEvent triggers notification
```

### New Module/Feature

**When adding features:**
1. Update `docs/ARCHITECTURE.md`:
   - Add module to folder structure
   - Document module responsibilities

2. Update `docs/USECASE.md`:
   - Add use case flows
   - Document new endpoints

3. Consider updating `docs/VISION.md`:
   - If feature changes MVP scope

**Example:**
```
Code change: Added reports module
Doc updates:
  - ARCHITECTURE.md: Add apps/backend/src/modules/reports/ structure
  - USECASE.md: Add "Dive Report Management" section
  - DOMAIN.md: Add "Report Domain Rules" section
```

### Validation Rule Changes

**When changing DTOs or domain validation:**
1. Update `docs/DOMAIN.md`:
   - Sync field constraints
   - Update max lengths
   - Document new validators

2. Verify code matches docs:
   - DTO `@MaxLength` matches DOMAIN.md
   - Service validation matches documented rules

**Example:**
```
Code change: Changed title max length from 100 to 80
Doc update: Update DOMAIN.md "Spot Domain Rules":
  - Title: Max 80 characters (was 100)
Update: Verify SpotsService enforces 80 char limit
```

## Sync Verification

### Check Code-to-Docs Alignment

**Domain rules:**
```bash
# Verify title constraints
grep -rn "@MaxLength" apps/backend/src/ | grep title
# Compare with DOMAIN.md "Title" sections
```

**API endpoints:**
```bash
# List all routes
grep -rn "@Get\|@Post\|@Put\|@Delete" apps/backend/src/modules/
# Compare with USECASE.md API lists
```

**Module structure:**
```bash
# Check actual modules
ls apps/backend/src/modules/
ls apps/mobile/src/features/
# Compare with ARCHITECTURE.md folder examples
```

### Check Docs-to-Code Alignment

**Verify documented rules are enforced:**
- DOMAIN.md "1000m proximity" → Check `SpotsService.create()`
- DOMAIN.md "Max 5 parking" → Check DTO `@ArrayMaxSize(5)`
- DOMAIN.md "48h edit window" → Check `ReportsService.update()`

## Documentation Files

### Primary Docs (apps/mobile/docs/)

- **DOMAIN.md** - Business rules, invariants, validation constraints
- **ARCHITECTURE.md** - System architecture, patterns, folder structure
- **USECASE.md** - User flows, API endpoints, feature descriptions
- **QUALITY.md** - Testing, security, performance standards
- **CONTRIBUTING.md** - Git workflow, branching, commit conventions
- **VISION.md** - Product scope, MVP boundaries, roadmap

### Project Instructions

- **CLAUDE.md** - High-level guidance for Claude Code
- Should reference docs/ files for details
- Update only for major architectural changes

## Common Sync Issues

❌ **Docs lag behind code:**
```
Code: Added `accessInfo` field 3 months ago
Docs: DOMAIN.md still doesn't mention it
Fix: Add accessInfo section to DOMAIN.md
```

❌ **Docs ahead of code:**
```
Docs: USECASE.md documents DELETE /reports/:id
Code: Endpoint not implemented yet
Fix: Remove from docs or mark as "Planned"
```

❌ **Contradictory rules:**
```
Docs: DOMAIN.md says "max 50 chars"
Code: DTO uses @MaxLength(100)
Fix: Align both to single source of truth
```

## Documentation Quality

**Good documentation:**
- ✅ Specific (mentions exact file paths, line numbers)
- ✅ Includes code examples
- ✅ References actual constraints from code
- ✅ Updated with every related code change

**Bad documentation:**
- ❌ Vague ("validate inputs properly")
- ❌ No examples
- ❌ Out of sync with code
- ❌ Generic advice not specific to DiveFreely

## Update Workflow

1. **Make code changes**
2. **Identify affected docs:**
   - Domain entity → DOMAIN.md, ARCHITECTURE.md
   - API endpoint → USECASE.md
   - Pattern change → ARCHITECTURE.md
   - New feature → Multiple docs
3. **Update docs with specific details**
4. **Verify alignment:**
   - Check constraints match
   - Verify examples are accurate
   - Test that documented APIs work
5. **Commit docs with code:**
   - Same PR/commit
   - Reference in commit message

## Quick Checks

Before PR:
- [ ] New domain fields documented in DOMAIN.md
- [ ] New endpoints listed in USECASE.md
- [ ] Validation rules match between docs and DTOs
- [ ] Architecture examples match actual structure
- [ ] No outdated info in docs

## Reference Files

- `doc-templates.md` - Templates for documenting new features

## Related Skills

- `/audit-rules` - Verify domain rules match docs
- `/backend-dev` - Backend patterns to document
- `/frontend-dev` - Mobile patterns to document

---

*Skill for keeping docs synchronized (Issue #53)*
