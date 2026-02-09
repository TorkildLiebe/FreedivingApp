# Git & Collaboration Best Practices

## 1. Branch Strategy

### Branch naming

```
feat/123-add-dive-spots       # New feature (linked to issue #123)
fix/456-spot-proximity-check  # Bug fix
refactor/789-auth-module      # Refactoring
chore/update-dependencies     # Maintenance
docs/add-api-docs             # Documentation
test/spot-service-coverage    # Adding tests
```

### Rules
- **Never commit directly to `main`** (enforced by pre-commit hook)
- Create feature branches from `main`
- One feature per branch
- Keep branches short-lived (merge within days, not weeks)

### Workflow

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b feat/123-add-dive-spots

# 2. Work on your feature (multiple commits are fine)
git add specific-file.ts
git commit -m "feat#123: add dive spot model"

# 3. Push and create PR
git push -u origin feat/123-add-dive-spots
gh pr create --title "feat#123: add dive spots CRUD" --body "..."

# 4. After approval, merge via GitHub (squash or merge commit)
```

## 2. Commit Messages

### Conventional commits format

Our Husky hook enforces this pattern:

```
type#issue: description

Examples:
feat#123: add dive spot creation endpoint
fix#456: correct proximity check distance calculation
refactor#789: extract auth guard to common module
test#101: add unit tests for spot service
docs#102: update API documentation
chore: update pnpm dependencies
```

### Valid types

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `chore` | Maintenance, dependencies, configs |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Reverting a previous commit |

### Good vs bad commit messages

```bash
# GOOD - specific, imperative, linked to issue
feat#123: add proximity validation for dive spots
fix#456: handle null description in spot response DTO
refactor#789: move auth guard to common module
test#101: add edge cases for 48h edit window

# BAD - vague, past tense, no issue link
fix: fixed stuff
feat: changes
update code
WIP
```

### Rules
- **Imperative tense**: "add" not "added" or "adds"
- **Max 100 characters** for the description line
- **Reference the issue number** when applicable
- **One logical change per commit** - don't mix unrelated changes

## 3. Pre-commit Hooks (Husky)

Our project runs these checks automatically:

### Pre-commit (runs on every commit)
1. Prevents direct commits to `main`
2. Runs `pnpm lint:backend` and `pnpm lint:mobile`
3. Runs type-checking for backend and mobile

### Commit-msg (validates commit message)
- Enforces conventional commit format
- Validates type prefix
- Checks max length (100 chars)

### Pre-push (runs before pushing)
- Runs full test suite
- Blocks push if tests fail

### If hooks fail

```bash
# Fix the issue (lint error, type error, test failure)
# Then try again - DON'T skip hooks

# Emergency bypass (use very sparingly, explain in PR)
git commit --no-verify -m "feat#123: urgent hotfix"
```

## 4. Pull Requests

### PR template

```markdown
## Summary
- Added CRUD endpoints for dive spots
- Implemented proximity check (1000m minimum)
- Added validation for photo limits (max 5)

## Changes
- `apps/backend/src/modules/dive-spot/` - New module
- `apps/backend/prisma/schema.prisma` - Added DiveSpot model
- `apps/backend/prisma/migrations/` - New migration

## Test plan
- [ ] Unit tests for DiveSpotService
- [ ] E2E tests for endpoints
- [ ] Manual test: create spot near existing spot (should fail)
- [ ] Manual test: create spot with 6 photos (should fail)

## Related
Closes #123
```

### PR best practices

| Practice | Why |
|----------|-----|
| Keep PRs small (<400 lines) | Easier to review, fewer bugs |
| One feature per PR | Clear scope, easy to revert |
| Write a good description | Reviewer understands context |
| Include test plan | Proves you tested it |
| Self-review before requesting review | Catch obvious issues |
| Respond to all review comments | Don't leave threads unresolved |

### PR size guidelines

| Size | Lines Changed | Review Time | Risk |
|------|--------------|-------------|------|
| Small | <100 | Quick | Low |
| Medium | 100-400 | Moderate | Medium |
| Large | 400+ | Slow | High - split if possible |

## 5. Code Review

### What to look for as a reviewer

```
1. Correctness - Does it do what it's supposed to?
2. Edge cases - What about null, empty, max values?
3. Security - Auth checks, input validation, data exposure?
4. Tests - Are business rules tested? Edge cases?
5. Naming - Are names clear and consistent?
6. Domain rules - Proximity check, edit window, photo limits?
7. Soft deletes - Is isDeleted filtered everywhere?
```

### Review etiquette

```markdown
# GOOD review comments
"This query is missing isDeleted: false filter"
"Consider using Promise.all here since these queries are independent"
"The 48h edit window check should happen in the service, not controller"

# BAD review comments
"This is wrong"
"Why did you do it this way?"
"I would have done it differently"
```

### Prefix conventions for review comments

```
nit: minor style suggestion (non-blocking)
question: seeking understanding (non-blocking)
suggestion: proposed improvement (non-blocking)
issue: must be fixed before merge (blocking)
```

## 6. Git Operations

### Useful commands

```bash
# See what you're about to commit
git diff --staged

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Stash work-in-progress
git stash
git stash pop

# Interactive rebase to clean up commits before PR
git rebase -i main

# See commit history (clean format)
git log --oneline --graph -20

# Find which commit introduced a bug
git bisect start
git bisect bad          # Current commit is bad
git bisect good abc123  # This commit was good
# Git will binary search for the bad commit
```

### Rebasing vs merging

```bash
# Rebase your branch onto latest main (clean history)
git checkout feat/123-dive-spots
git rebase main

# If conflicts: fix them, then
git add .
git rebase --continue

# When to rebase: before creating PR, to get latest main changes
# When to merge: never merge main into your branch (rebase instead)
```

## 7. .gitignore Essentials

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/

# Environment files (secrets!)
.env
.env.local
.env.production

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db

# Test
coverage/

# Mobile
*.ipa
*.apk
*.aab

# Database
*.db
*.sqlite
```

## 8. GitHub CLI (gh)

```bash
# Create PR
gh pr create --title "feat#123: add dive spots" --body "..."

# List open PRs
gh pr list

# View PR details
gh pr view 42

# Check PR status (CI checks)
gh pr checks 42

# Create issue
gh issue create --title "Bug: proximity check fails at equator" --body "..."

# List issues
gh issue list --label "bug"

# Link PR to issue (in PR body)
# "Closes #123" or "Fixes #123"
```

## Quick Reference: Daily Workflow

```bash
# Morning: sync with main
git checkout main && git pull

# Start feature
git checkout -b feat/123-description

# Work...
git add specific-file.ts
git commit -m "feat#123: description"

# Push and PR
git push -u origin feat/123-description
gh pr create

# After review: merge via GitHub UI

# Cleanup
git checkout main && git pull
git branch -d feat/123-description
```

## Learn More

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Git Best Practices](https://sethrobertson.github.io/GitBestPractices/)
