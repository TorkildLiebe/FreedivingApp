# CLAUDE CODE PLAYBOOK — FreedivingApp

> An opinionated operating manual for building FreedivingApp with Claude Code.
> Stack: Expo (React Native + Web) · NestJS + Fastify · Prisma · Supabase · pnpm monorepo.
> Solo developer. Speed, security, low cost.

---

## Table of Contents

1. [Mental Model of Claude Code](#1-mental-model-of-claude-code)
2. [Tools](#2-tools)
3. [Memory & Context Management](#3-memory--context-management)
4. [Skills](#4-skills)
5. [Hooks](#5-hooks)
6. [Agents & Multi-Agent Architecture](#6-agents--multi-agent-architecture)
7. [Sub-Tasks & Decomposition](#7-sub-tasks--decomposition)
8. [MCP Servers](#8-mcp-servers)
9. [Plugins & Extensions](#9-plugins--extensions)
10. [Background Tasks](#10-background-tasks)
11. [Testing with Claude Code](#11-testing-with-claude-code)
12. [Full Solo Developer Workflow](#12-full-solo-developer-workflow)
13. [Claude Usage Across Development Stages](#13-claude-usage-across-development-stages)
14. [Cost Optimization](#14-cost-optimization)
15. [Security & Risk Management](#15-security--risk-management)
16. [Opinionated Recommendations](#16-opinionated-recommendations)

---

## 1. Mental Model of Claude Code

### How It Actually Works

Claude Code runs an **agentic loop** with three blended phases:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GATHER    │────▶│    ACT      │────▶│   VERIFY    │
│  context    │     │  edit/run   │     │  test/check │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       └───────────────────────────────────────┘
              (course-correct if needed)
```

Each turn, Claude:
1. **Reads** your prompt + CLAUDE.md + loaded skills + conversation history
2. **Decides** which tools to call (Read, Edit, Bash, Grep, etc.)
3. **Executes** tool calls, reads results
4. **Repeats** until the task is done or it needs your input

You can interrupt at any point. Claude doesn't "remember" between sessions — it re-reads CLAUDE.md fresh each time, plus any auto-memory files.

### The Context Window is Your Most Scarce Resource

The context window is **200K tokens**. That sounds large, but it fills fast:

| What consumes context | Approximate cost |
|---|---|
| CLAUDE.md + rules files | 500–2000 tokens |
| Each file read | 200–5000 tokens |
| Each tool call + result | 100–2000 tokens |
| Conversation history | Grows continuously |
| Loaded skills | 200–500 tokens each |
| System instructions | ~3000 tokens (fixed) |

When context fills up, Claude **auto-compacts**: it summarizes older conversation into a shorter form. This loses detail. You lose nuance.

**Key implications:**
- Smaller CLAUDE.md = more room for actual work
- `/clear` between unrelated tasks = fresh context
- `/compact "focus on the spots module"` = controlled summarization
- `/context` = see what's consuming space
- Delegate verbose operations (test output, log analysis) to **subagents** — their context is separate

### How to Structure Work for Reliability

Claude performs best when:

1. **Tasks are small and specific** — "Add proximity validation to CreateDiveSpot" beats "Implement the spots module"
2. **Context is pre-loaded** — Reference specific files, not "look around the codebase"
3. **Success criteria are clear** — "The test in spots.service.spec.ts should pass" beats "make sure it works"
4. **Verification happens after each step** — Run tests, lint, type-check between changes

Claude performs worst when:
- Given vague multi-file tasks with no anchor points
- Asked to "refactor everything" with no clear goal
- The context window is polluted with irrelevant history
- There's no way to verify correctness

---

## 2. Tools

### Built-in Tools — Use the Right One

| Task | Use This | Not This |
|---|---|---|
| Read a file | `Read` tool | `cat`, `head`, `tail` via Bash |
| Edit a file | `Edit` tool | `sed`, `awk` via Bash |
| Create a file | `Write` tool | `echo >`, heredoc via Bash |
| Find files by name | `Glob` tool | `find`, `ls` via Bash |
| Search file contents | `Grep` tool | `grep`, `rg` via Bash |
| Run commands | `Bash` tool | — |
| Explore codebase | `Task` (Explore agent) | Manual Grep chains |

**Why this matters:** Dedicated tools give Claude structured results it can reason about reliably. Bash output is raw text that Claude has to parse — more tokens, more errors.

### Patterns That Work

**Read-before-edit (mandatory):**
```
# Good: Claude reads the file, understands structure, makes targeted edit
"Read apps/backend/src/modules/spots/spots.service.ts, then add proximity validation to createSpot"

# Bad: Claude guesses at file structure, writes wrong code
"Add proximity validation to the spots service"
```

**Grep-before-implement:**
```
# Good: Find existing patterns first
"Grep for 'DomainError' in apps/backend/src to see how errors are structured, then create SpotProximityError"

# Bad: Invent a new pattern
"Create an error class for proximity violations"
```

**Verify after each change:**
```
# Good: Change, then immediately verify
"Edit the service, then run pnpm test:backend to verify"

# Bad: Make 5 changes, then check
"Update the service, controller, DTO, repository, and module, then test"
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Instead |
|---|---|---|
| Big-bang edits | Claude writes entire files from memory, introduces bugs | Edit specific sections |
| Skipping file reads | Claude hallucinates file structure | Always read first |
| Chaining 10 Bash commands | One failure corrupts the chain | Sequential verification |
| Asking Claude to "find" via Bash | `find` output is noisy, expensive | Use Glob/Grep tools |
| Writing new files when existing ones work | File bloat, duplicated logic | Edit existing files |

---

## 3. Memory & Context Management

### The 6 Memory Levels

Claude Code loads memory in priority order (highest first):

| Level | Location | Scope | Use For |
|---|---|---|---|
| 1. Managed policy | Organization-level | All users | Enterprise rules |
| 2. Project memory | `.claude/CLAUDE.md` | All team members | Architecture, conventions, constraints |
| 3. Project rules | `.claude/rules/*.md` | All team members | Topic-specific rules (path-scoped) |
| 4. User memory | `~/.claude/CLAUDE.md` | You only, all projects | Personal preferences |
| 5. Project local | `CLAUDE.local.md` | You only, this project | Local env quirks, experiments |
| 6. Auto memory | `~/.claude/projects/<project>/memory/` | You only, this project | Learned patterns, debugging notes |

### What Goes Where for FreedivingApp

**`.claude/CLAUDE.md`** (checked into git — you already have this):
- Architecture patterns (vertical slices, ports/adapters)
- Domain constraints (1000m proximity, 48h edit window)
- File naming conventions
- Pre-completion checklist

**`.claude/rules/`** (checked into git, modular):
```
.claude/rules/
├── backend.md          # NestJS patterns, module structure
├── mobile.md           # Expo patterns, platform-specific files
├── prisma.md           # Schema conventions, migration rules
└── testing.md          # Jest patterns, coverage requirements
```

Path-scoped example (`.claude/rules/backend.md`):
```markdown
---
paths:
  - "apps/backend/**"
---
# Backend Rules
- Every module: controller → service → repository
- DTOs use class-validator decorators
- Domain errors extend DomainError from common/errors/
- Soft deletes: always filter isDeleted=false
```

**`CLAUDE.local.md`** (gitignored — your local overrides):
```markdown
# Local Dev
- My Supabase is at port 54322 (non-default)
- Currently focused on the reports module
- Prefer verbose test output: --verbose flag
```

**Auto memory** (`~/.claude/projects/-Users-torkildliebe-FreedivingApp/memory/`):
- Claude automatically saves patterns it discovers
- `MEMORY.md` (first 200 lines) loaded into system prompt
- Topic files loaded on demand
- You can also manually write here: "Remember that the spots module uses raw SQL for bbox queries"

### Context Commands

| Command | When to Use |
|---|---|
| `/clear` | Starting a new, unrelated task. Clears everything. |
| `/compact` | Mid-task, context getting large. Add focus: `/compact "spots module proximity validation"` |
| `/context` | Debugging why Claude seems confused — see what's loaded |
| `/init` | First time setup for CLAUDE.md |

### @imports

Reference external files from CLAUDE.md:
```markdown
## Domain Rules
@docs/DOMAIN.md

## Architecture
@docs/ARCHITECTURE.md
```

This pulls content inline. Use sparingly — each import adds to context cost. Only import what Claude needs for most tasks. Put niche docs in `.claude/rules/` with path scoping instead.

---

## 4. Skills

### What Skills Are

Skills are **reusable prompt templates** that Claude can execute. They're Markdown files with YAML frontmatter that define:
- When they can be triggered (user-invocable vs model-invocable)
- What tools they can use
- Whether they run in a forked context (subagent)
- What arguments they accept

### Where Skills Live

```
.claude/skills/          # Project skills (checked into git)
~/.claude/skills/        # Personal skills (your machine only)
```

Each skill is a directory with a `SKILL.md` file:
```
.claude/skills/
├── backend-feature/
│   └── SKILL.md
├── frontend-feature/
│   └── SKILL.md
├── test-writer/
│   └── SKILL.md
├── business-rules-audit/
│   └── SKILL.md
├── security-review/
│   └── SKILL.md
├── prisma-guardian/
│   └── SKILL.md
└── api-contract/
    └── SKILL.md
```

### Skill Definitions for FreedivingApp

#### 1. Backend Feature Implementer

`.claude/skills/backend-feature/SKILL.md`:
```markdown
---
name: backend-feature
description: Implement a backend feature following vertical slice architecture
user-invocable: true
argument-hint: "<module-name> <feature-description>"
---

# Backend Feature Implementer

Implement the feature described in $ARGUMENTS following these rules:

## Pre-flight
1. Read docs/DOMAIN.md for entity specs and invariants
2. Read docs/ARCHITECTURE.md §3 for module structure
3. Read docs/USECASE.md for the relevant operational flow
4. Check existing modules in apps/backend/src/modules/ for patterns

## Implementation Order
1. **Domain errors** in common/errors/ (if new error types needed)
2. **DTOs** with class-validator decorators (whitelist: true)
3. **Repository** methods (Prisma queries, always filter isDeleted=false)
4. **Service** with business logic (throw domain errors, use $transaction for multi-step)
5. **Controller** with guards, decorators, and proper HTTP status codes
6. **Module** registration (imports, providers, exports)
7. **Tests** for service and controller (target 80% coverage)

## Constraints
- File naming: kebab-case
- No emoji in text fields (displayName, title, caption)
- Coordinates: WGS84, 6 decimal places
- Spot proximity: 1000m minimum between centers
- Parking: max 5, within 5000m, dedupe <2m
- Report edits: 48h window (owner) or mod/admin bypass

## Verification
Run: pnpm test:backend && pnpm lint:backend && cd apps/backend && pnpm tsc --noEmit
```

#### 2. Frontend Feature Implementer

`.claude/skills/frontend-feature/SKILL.md`:
```markdown
---
name: frontend-feature
description: Implement a native mobile feature following Expo Router + feature-based architecture
user-invocable: true
argument-hint: "<feature-name> <description>"
---

# Frontend Feature Implementer

Implement the frontend feature described in $ARGUMENTS.

## Pre-flight
1. Read apps/mobile/app/ for existing route structure
2. Read apps/mobile/src/features/ for existing feature patterns
3. Check apps/mobile/src/infrastructure/api/client.ts for API client usage
4. Check apps/mobile/src/shared/ for reusable components and theme

## Architecture Rules
- **Routes** in app/ are thin — just import and render the screen component
- **Feature code** lives in src/features/<feature-name>/
- Structure per feature:
  ```
  src/features/<name>/
  ├── screens/          # Screen components
  ├── components/       # Feature-specific components
  ├── hooks/            # Data fetching, state logic
  ├── types.ts          # Feature types
  └── __tests__/        # Tests
  ```
- Platform-specific: use `.ios.tsx` / `.android.tsx` when iOS/Android behavior differs
- Auth state: use `useAuth()` from src/features/auth/context/auth-context.tsx
- API calls: use the Axios client from src/infrastructure/api/client.ts
- Navigation: use Expo Router's `useRouter()`, `Link`, typed routes

## Constraints
- Must work on BOTH iOS and Android (test both platforms)
- Use the existing Colors theme from src/shared/theme/Colors.ts
- No new dependencies without justification
- Accessible: follow WCAG AA baseline

## Verification
Run: cd apps/mobile && pnpm test && pnpm lint && pnpm tsc --noEmit
Test on iOS: pnpm ios
Test on Android: pnpm android
```

#### 3. Business Rules Auditor

`.claude/skills/business-rules-audit/SKILL.md`:
```markdown
---
name: business-rules-audit
description: Audit code against DOMAIN.md invariants
user-invocable: true
context: fork
argument-hint: "<module-name or file-path>"
---

# Business Rules Auditor

Audit the code at $ARGUMENTS against docs/DOMAIN.md.

## Checks
1. Read docs/DOMAIN.md completely
2. Read all service files in the target module
3. For each entity invariant in DOMAIN.md, verify:
   - Is it enforced in the service layer? (not just DTO validation)
   - Are edge cases handled? (empty strings, boundary values, null)
   - Are error types correct? (Invalid* → 400, *NotFound* → 404, etc.)
4. Check that soft deletes are filtered in ALL repository queries
5. Check that ownership/role checks exist where required
6. Check coordinate validation (WGS84 bounds: lat -90..90, lon -180..180)

## Output Format
Report as a checklist:
- ✅ Rule enforced: [rule] — [location]
- ❌ Rule missing: [rule] — [where it should be]
- ⚠️ Rule partially enforced: [rule] — [what's missing]
```

#### 4. Test Writer

`.claude/skills/test-writer/SKILL.md`:
```markdown
---
name: test-writer
description: Write comprehensive tests for a module or file
user-invocable: true
argument-hint: "<file-path or module-name>"
---

# Test Writer

Write tests for $ARGUMENTS.

## Pre-flight
1. Read the target file(s) to understand what needs testing
2. Read existing test files in the same module for patterns
3. Read docs/DOMAIN.md for business rules that need test coverage
4. Check apps/backend/package.json or apps/mobile/jest.config.js for test config

## Backend Test Patterns (NestJS + Jest)

### Unit Tests (*.spec.ts next to source file)
```typescript
// Pattern: mock repository, test service logic
const mockRepository = {
  findById: jest.fn(),
  create: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    TargetService,
    { provide: TargetRepository, useValue: mockRepository },
  ],
}).compile();
```

### What to Test
- **Happy path**: valid input → expected output
- **Domain invariants**: each rule from DOMAIN.md gets a test
  - Spot proximity (1000m)
  - Parking limits (max 5, within 5000m, dedupe <2m)
  - Report edit window (48h)
  - Text constraints (no emoji, length limits)
- **Error paths**: invalid input → correct DomainError subclass
- **Edge cases**: boundary values, empty arrays, null optionals
- **Soft deletes**: deleted records return 404, not the record
- **Auth**: unauthorized access → 401/403

### Coverage Target
- Minimum 80% line coverage
- 100% coverage on domain validation logic

## Frontend Test Patterns (Jest + React Native Testing Library)
```typescript
// Pattern: render component, assert behavior
import { render, screen } from '@testing-library/react-native';
// Use screen.getByText, fireEvent, waitFor
```

## Verification
Run tests and report coverage:
- Backend: pnpm test:backend -- --coverage --collectCoverageFrom='src/modules/<module>/**'
- Mobile: cd apps/mobile && pnpm test -- --coverage
```

#### 5. Security Reviewer

`.claude/skills/security-review/SKILL.md`:
```markdown
---
name: security-review
description: Security audit of recent changes
user-invocable: true
context: fork
argument-hint: "<module-name or 'all'>"
---

# Security Reviewer

Audit $ARGUMENTS for security issues.

## Checks
1. **Auth/AuthZ**: Every controller endpoint has @UseGuards(AuthGuard). Ownership checks on mutations.
2. **Input validation**: All DTOs use class-validator. ValidationPipe with whitelist:true strips unknown fields.
3. **SQL injection**: No raw SQL with string interpolation. Prisma parameterized queries only.
4. **XSS**: No dangerouslySetInnerHTML. No unescaped user content in React Native.
5. **Secrets**: No hardcoded keys, tokens, or passwords. Check .env files are gitignored.
6. **IDOR**: Resource access checks owner/role before returning data.
7. **Rate limiting**: Endpoints have rate limits (60 req/min default).
8. **Error leaks**: DomainExceptionFilter catches errors. No stack traces in responses.
9. **Soft delete bypass**: No query paths that return isDeleted=true records.
10. **File uploads**: Pre-signed URLs only. No direct file acceptance.
11. **CORS**: Configured in main.ts for allowed origins only.
12. **Dependencies**: Check for known vulnerabilities (pnpm audit).

## Output
- 🔴 Critical: [issue] — must fix before merge
- 🟡 Warning: [issue] — fix soon
- 🟢 OK: [area checked] — no issues
```

#### 6. Prisma Schema Guardian

`.claude/skills/prisma-guardian/SKILL.md`:
```markdown
---
name: prisma-guardian
description: Validate Prisma schema changes against domain rules
user-invocable: true
disable-model-invocation: true
---

# Prisma Schema Guardian

Before applying any Prisma schema change:

1. Read apps/backend/prisma/schema.prisma
2. Read docs/DOMAIN.md for entity specs
3. Verify the proposed change against:
   - Entity field types match DOMAIN.md
   - Required vs optional fields are correct
   - String length constraints match (title: 80, description: 2000, etc.)
   - Relations are correct (DiveSpot → User, ParkingLocation → DiveSpot)
   - Indexes exist for query patterns (isDeleted + lat/lon for bbox)
   - Soft delete fields (isDeleted, deletedAt) on all main entities
4. Check that a migration file will be created (not just a schema edit)
5. Flag any breaking changes (column drops, type changes, required field additions)

## Output
- ✅ Safe to migrate
- ⚠️ Review needed: [concern]
- 🛑 Breaking change: [what and why]
```

#### 7. API Contract Enforcer

`.claude/skills/api-contract/SKILL.md`:
```markdown
---
name: api-contract
description: Verify API endpoints match documented contracts
user-invocable: true
context: fork
argument-hint: "<module-name>"
---

# API Contract Enforcer

Verify the API contract for $ARGUMENTS.

1. Read docs/USECASE.md for the expected API flows
2. Read the controller file(s) in the target module
3. Read all DTO files in the module's dto/ directory
4. Verify:
   - HTTP methods match use case docs (GET for reads, POST for creates, PATCH for updates, DELETE for soft-deletes)
   - Request DTOs validate all required fields per DOMAIN.md
   - Response DTOs return only documented fields (no leaking internal fields like isDeleted)
   - Status codes match error taxonomy (400, 401, 403, 404, 409)
   - Auth guard is applied to all endpoints
   - Pagination follows conventions (limit, offset or cursor)
5. Flag any undocumented endpoints or missing documented endpoints
```

### Avoiding Over-Fragmentation

**Rule of thumb:** If you'd use a skill less than once a week, don't create it. Merge it into a broader skill or just write the prompt inline.

**Good granularity:** 5–8 project skills that map to your main workflows.
**Bad granularity:** 20 micro-skills like "add-import", "create-dto", "add-test-case".

Skills should represent **complete workflows**, not individual steps.

---

## 5. Hooks

### What Hooks Are

Hooks are **automated scripts** that run in response to Claude Code events. They execute outside of Claude's context — Claude doesn't see hook output unless the hook blocks an action with feedback.

### The 14 Hook Events

| Event | When It Fires | Use Case |
|---|---|---|
| `SessionStart` | New conversation begins | Load environment, start services |
| `UserPromptSubmit` | You press Enter | Validate/transform your prompt |
| `PreToolUse` | Before a tool executes | Block dangerous operations |
| `PermissionRequest` | User prompted for permission | Auto-approve known-safe actions |
| `PostToolUse` | After a tool completes | Format output, run linters |
| `PostToolUseFailure` | Tool call fails | Log errors, suggest fixes |
| `Notification` | Claude sends notification | Forward to Slack/terminal |
| `SubagentStart` | Subagent spawns | Track agent usage |
| `SubagentStop` | Subagent finishes | Collect results |
| `Stop` | Claude stops responding | Run post-completion checks |
| `TeammateIdle` | Agent team member idles | Reassign work |
| `TaskCompleted` | Task marked done | Trigger next step |
| `PreCompact` | Before context compaction | Save important context |
| `SessionEnd` | Conversation ends | Cleanup, save metrics |

### Hook Types

1. **Command hook** — runs a shell command
2. **Prompt hook** — single-turn LLM evaluation (returns `{"decision": "allow"}` or `{"decision": "block", "reason": "..."}`)
3. **Agent hook** — multi-turn verification with tool access

### Practical Hooks for FreedivingApp

#### Auto-format on file write

In `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "type": "command",
        "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q '\"file_path\".*\\.ts'; then npx prettier --write \"$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path')\"; fi"
      }
    ]
  }
}
```

#### Block Prisma schema edits without migration context

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "type": "command",
        "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'schema.prisma'; then echo 'BLOCKED: Use /prisma-guardian skill before editing schema.prisma. Then create a migration with: pnpm prisma:migrate' >&2; exit 2; fi"
      }
    ]
  }
}
```

#### Prevent secrets in files

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "type": "command",
        "command": "content=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.new_string // .content // empty'); if echo \"$content\" | grep -qiE '(sk_live|password\\s*=|secret_key|SUPABASE_SERVICE_ROLE)'; then echo 'BLOCKED: Detected potential secret in file content' >&2; exit 2; fi"
      }
    ]
  }
}
```

#### Run lint after Stop

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "cd /Users/torkildliebe/FreedivingApp && pnpm lint 2>&1 | tail -20"
      }
    ]
  }
}
```

### Hook Communication

- **stdin**: JSON with event context (tool name, inputs, outputs)
- **exit 0**: Proceed normally
- **exit 2**: Block the action, stderr becomes feedback to Claude
- **Any other exit**: Treated as hook error, action proceeds

---

## 6. Agents & Multi-Agent Architecture

### What Is an Agent?

An **agent** is an autonomous instance of Claude that has its own context window, tool access, and task objective. Think of it as a separate Claude "worker" that:

1. Receives a task description
2. Independently decides which tools to use
3. Executes a sequence of actions (the "agentic loop")
4. Returns a result to whoever spawned it

**Key distinction:** When you chat with Claude Code, you're interacting with the **main agent**. When the main agent spawns a subagent via the `Task` tool, that subagent gets:
- Its own fresh context window (not shared with main)
- A subset of tools (depending on agent type)
- A max turn limit
- No visibility into the main conversation (unless you pass context in the prompt)

This isolation is powerful: subagent work doesn't pollute your main context, and subagents can run in parallel.

### Built-in Subagent Types

| Type | Model | Tools | Read-Only | Use For |
|---|---|---|---|---|
| **Explore** | Haiku (fast, cheap) | Glob, Grep, Read, WebSearch, WebFetch | Yes | Codebase exploration, finding files, understanding patterns |
| **Plan** | Inherits parent | Glob, Grep, Read, WebSearch, WebFetch | Yes | Designing implementation approaches |
| **General-purpose** | Inherits parent | All tools | No | Complex multi-step tasks, research + action |
| **Bash** | Inherits parent | Bash only | No | Running commands, git operations |

### Custom Agents

Define reusable agents in `.claude/agents/<name>.md`:

```markdown
---
name: security-gate
description: Reviews code changes for security issues before commits
model: sonnet
tools:
  - Read
  - Grep
  - Glob
  - Bash
maxTurns: 15
skills:
  - security-review
---

# Security Gate Agent

You are a security reviewer for the FreedivingApp.
Before any code is committed, review changes for:
- Auth bypass vulnerabilities
- SQL injection risks
- Secret exposure
- IDOR vulnerabilities
- Missing input validation

Read the git diff and apply the security-review skill.
Report findings as 🔴 Critical / 🟡 Warning / 🟢 OK.
```

### When to Use Single vs Multi-Agent

| Scenario | Approach | Why |
|---|---|---|
| Fix a bug in one file | Single agent (you + Claude) | Low complexity, fast |
| Implement a new module | Single agent with plan mode | Manageable scope |
| Explore unfamiliar code | Spawn Explore agent | Keeps main context clean |
| Implement + test + review | Sequential subagents | Each step verified independently |
| Compare 3 approaches | Parallel Explore agents | Fast research, no context pollution |
| Full feature with security review | Orchestrator pattern | Main agent coordinates specialists |

### The Orchestrator Pattern

For complex features, your main conversation acts as the **orchestrator**:

```
You (prompt) ──▶ Main Agent (orchestrator)
                    ├──▶ Explore Agent: "Find existing patterns for reports module"
                    ├──▶ Plan Agent: "Design the DiveReport implementation"
                    │
                    │  (you approve the plan)
                    │
                    ├──▶ Main Agent: implements the code
                    ├──▶ Bash Agent: "Run pnpm test:backend"
                    ├──▶ General-purpose Agent: "Audit against DOMAIN.md"
                    └──▶ Security Gate Agent: "Review the diff"
```

### Cost-Aware Agent Design

| Agent Type | Cost | When to Use |
|---|---|---|
| Explore (Haiku) | ~$0.001/task | File discovery, pattern matching, quick reads |
| Plan (Sonnet) | ~$0.01/task | Architecture decisions, implementation design |
| General-purpose (Sonnet) | ~$0.05/task | Multi-file implementation, complex research |
| General-purpose (Opus) | ~$0.15/task | Complex reasoning, subtle bugs, architecture |

**Rule:** Start with the cheapest agent that can do the job. Upgrade only when the task requires deeper reasoning.

### Agent Teams (Experimental)

Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. A team lead delegates to specialist agents that work in parallel. ~7x token usage — use only for large, parallelizable tasks. As a solo developer on a budget, **skip this for now**.

---

## 7. Sub-Tasks & Decomposition

### Why Decomposition Matters

Large prompts → unpredictable results. Small prompts → deterministic results.

**The rule:** If you can't verify the result in under 30 seconds, the task is too big.

### Sub-Task Template

```
## Task: [specific action]

### Context
- Module: [path]
- Related files: [list]
- Domain rules: [from DOMAIN.md]

### Steps
1. [Read specific file]
2. [Make specific change]
3. [Verify with specific command]

### Success Criteria
- [ ] [Testable assertion]
- [ ] [Another testable assertion]
```

### Concrete Example: Creating a Dive Spot

**Bad (big-bang prompt):**
> "Implement the full CreateDiveSpot feature with proximity validation, parking limits, all the business rules, DTOs, tests, and wire it up."

**Good (decomposed):**

**Task 1: Domain error**
```
Create SpotProximityError in apps/backend/src/common/errors/.
Follow the pattern in domain.error.ts and spot-not-found.error.ts.
HTTP status: 409. Message: "A dive spot already exists within 1000m of this location."
Write a test in domain.error.spec.ts.
Run: pnpm test:backend -- domain.error.spec
```

**Task 2: DTO**
```
Create CreateDiveSpotDto in apps/backend/src/modules/spots/dto/.
Fields per DOMAIN.md: title (1-80 chars), description (0-2000), centerLat (-90..90), centerLon (-180..180), accessInfo (0-1000), parkingLocations (0-5 items, each with lat, lon, label).
Use class-validator decorators. Follow existing DTO patterns in the same directory.
```

**Task 3: Repository method**
```
Add createSpot and findNearbySpots methods to spots.repository.ts.
findNearbySpots: find non-deleted spots within 1000m of given lat/lon.
Use the Haversine formula or PostGIS ST_DWithin.
Always filter isDeleted=false.
```

**Task 4: Service method**
```
Add createSpot to spots.service.ts.
1. Call findNearbySpots — if any found, throw SpotProximityError
2. Validate parking (max 5, within 5000m, dedupe <2m)
3. Create spot in a $transaction
4. Return the created spot
Write tests covering: happy path, proximity violation, parking over limit, parking too far, parking dedup.
```

**Task 5: Controller + wiring**
```
Add POST /spots to spots.controller.ts.
Apply @UseGuards(AuthGuard). Use @CurrentUser() for createdById.
Return 201 on success. Wire up in spots.module.ts.
Run full test suite: pnpm test:backend
```

### Chaining Safely

Between each sub-task:
1. **Verify** — run tests, check types
2. **Commit** (optional) — save progress
3. **Clear context** (if needed) — `/compact` or `/clear`
4. **Start next task** with explicit file references

---

## 8. MCP Servers

### What MCP Is

**Model Context Protocol** (MCP) is a standard for connecting Claude to external tools and data sources. An MCP server exposes tools that Claude can call — like reading from a database, calling an API, or interacting with a service.

### Three Transport Types

| Transport | How It Works | Use Case |
|---|---|---|
| **HTTP** | REST-like endpoint | Cloud services, hosted tools (recommended) |
| **SSE** | Server-Sent Events | Legacy, being deprecated |
| **stdio** | Local process via stdin/stdout | Local tools, scripts |

### Three Scopes

| Scope | Config File | Who Sees It |
|---|---|---|
| **Local** | `~/.claude.json` | You only, per-project |
| **Project** | `.mcp.json` | All team members (checked into git) |
| **User** | `~/.claude/mcp.json` | You only, all projects |

### Recommended MCP Setup for FreedivingApp

**GitHub MCP** (already configured):
```json
{
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```
*When to prefer `gh` CLI instead:* For simple operations like `gh issue list`, `gh pr create`. The CLI is faster and uses less context than MCP tool calls. Use GitHub MCP when you need complex queries or Claude to autonomously interact with issues/PRs.

**Supabase MCP** (recommended to add):
```bash
claude mcp add supabase --transport http --url "https://mcp.supabase.com"
```
Useful for: checking database state, inspecting auth config, managing storage buckets — without leaving Claude Code.

**Context7** (optional, for up-to-date library docs):
```bash
claude mcp add context7 --transport http --url "https://mcp.context7.com"
```
Useful for: fetching current NestJS, Prisma, Expo documentation without web searches.

### When MCP Is Worth It vs Not

| Worth It | Not Worth It |
|---|---|
| Complex GitHub queries (search issues, cross-reference PRs) | Simple `gh issue list` |
| Database introspection during debugging | Running `pnpm prisma:studio` |
| Automated workflows needing service access | One-off API calls (use `curl`) |
| When Claude needs to autonomously interact with a service | When you can just paste the output |

### Security Considerations

- MCP servers get whatever credentials you configure — audit what you share
- Prefer read-only tokens where possible
- Don't configure MCP servers with admin/service-role keys
- Use environment variables (`${VAR}`) for secrets, never hardcode

---

## 9. Plugins & Extensions

### What Plugins Are

Plugins bundle skills, hooks, agents, MCP servers, and LSP servers into shareable, installable packages. They're the highest-level unit of Claude Code extensibility.

### Recommended Plugins

| Plugin | What It Does | Why You Need It |
|---|---|---|
| **typescript-lsp** | TypeScript language server integration | Precise symbol navigation, auto error detection, go-to-definition. Claude "sees" type errors as they happen. |
| **playwright** | Browser automation and testing | E2E testing for your Expo web app. Catch visual regressions. |
| **code-review** | Automated code review patterns | Structured review of PRs before merge. |
| **context7** | Live library documentation | Up-to-date Prisma, NestJS, Expo docs without web searches. |
| **explanatory-output-style** | Already installed — educational output | You have this active. |

### Installing Plugins

```
/plugin                    # Browse marketplace
claude --plugin-dir ./my-plugin  # Test local plugin
```

### How Plugins Fit in the Workflow

```
Feature Work:
  typescript-lsp → catches type errors in real-time as Claude edits
  context7 → Claude references current API docs, not outdated training data

Review:
  code-review → structured review before PR
  playwright → E2E tests on web version

Product Management:
  GitHub MCP → issue tracking, PR management, project board updates
  Notion MCP → sync specs and docs (available in marketplace)
```

### Product Management Integration

Your GitHub Project Board tracks features. Claude can:
1. Read issues with `gh issue list` or GitHub MCP
2. Create implementation tasks from issues
3. Update issue status after implementation
4. Create PRs linked to issues with `gh pr create`

For Notion (if you adopt it): install the Notion MCP to let Claude read/write specs, update project status, and sync documentation — all without leaving the terminal.

---

## 10. Background Tasks

### When to Use Background Tasks

Background tasks let you continue working while a process runs. Push any running command to background with **Ctrl+B**.

### Common Patterns for FreedivingApp

**Start dev servers before working:**
```
# Type this, then Ctrl+B to background each one
pnpm dev:backend
pnpm dev:mobile
pnpm dev:infra
```

**Run tests while continuing to code:**
```
# Start a test run, then Ctrl+B
pnpm test:backend -- --watch
```

**Build check in background:**
```
cd apps/backend && pnpm tsc --noEmit
```

### Managing Background Tasks

| Action | How |
|---|---|
| List all tasks | `/tasks` |
| Kill a task | Press **K** and select |
| Check output | Read the output file path shown in `/tasks` |

### Best Practice

Start `pnpm dev:backend` in background at the beginning of every session. This way:
- Claude can `curl localhost:3000/health` to verify changes work
- You can test API endpoints without leaving Claude Code
- Hot-reload catches compilation errors immediately

---

## 11. Testing with Claude Code

### Test-Driven Workflow

The most reliable pattern:

1. **Write the test first** (use `/test-writer` skill)
2. **Run it — watch it fail** (confirms test is meaningful)
3. **Implement the feature**
4. **Run it — watch it pass**
5. **Run full suite** to catch regressions

### What Claude Should Write vs What You Write

| Claude Writes Well | You Should Write |
|---|---|
| Unit tests for services (mock repository, test logic) | Integration tests touching real DB |
| DTO validation tests (boundary values, invalid input) | E2E flows requiring real auth |
| Component render tests (does it render, basic interactions) | Visual/UX tests requiring human judgment |
| Error path tests (what happens when X fails) | Performance tests |
| Edge case coverage (empty arrays, null values, boundaries) | Security penetration tests |

### Jest Patterns for This Stack

**Backend — Service unit test:**
```typescript
describe('SpotsService.createSpot', () => {
  it('should throw SpotProximityError when spot exists within 1000m', async () => {
    mockRepository.findNearbySpots.mockResolvedValue([existingSpot]);
    await expect(service.createSpot(dto, userId))
      .rejects.toThrow(SpotProximityError);
  });

  it('should throw InvalidParkingError when parking > 5000m from center', async () => {
    mockRepository.findNearbySpots.mockResolvedValue([]);
    const dto = createSpotDtoWith({ parkingLocations: [farAwayParking] });
    await expect(service.createSpot(dto, userId))
      .rejects.toThrow(InvalidParkingError);
  });
});
```

**Mobile — Hook test:**
```typescript
describe('useSpots', () => {
  it('should fetch spots for given bbox', async () => {
    const { result } = renderHook(() => useSpots(bbox));
    await waitFor(() => expect(result.current.spots).toHaveLength(3));
  });
});
```

### Running Tests Efficiently

```bash
# Single module (fast feedback)
pnpm test:backend -- --testPathPattern=spots

# Watch mode (background it with Ctrl+B)
pnpm test:backend -- --watch

# Coverage for a specific module
pnpm test:backend -- --coverage --collectCoverageFrom='src/modules/spots/**'

# All tests before commit
pnpm test:backend && cd apps/mobile && pnpm test
```

### Coverage Target

- **80% line coverage** overall (per QUALITY.md)
- **100% coverage** on domain validation logic (proximity, parking, edit window)
- **Don't chase 100% everywhere** — test behavior, not implementation

---

## 12. Full Solo Developer Workflow

This is the end-to-end workflow for building a feature in FreedivingApp. Each step is concrete and actionable.

### Step 1: Feature Idea

Start with a GitHub issue. Use `gh` CLI:

```bash
gh issue create --title "feat: add dive report creation" --body "Users should be able to create dive reports for spots they've visited. See USECASE.md for flow."
```

### Step 2: Formalize Business Rules

Ask Claude to extract rules from your docs:

```
Read docs/DOMAIN.md and docs/USECASE.md.
List all business rules for DiveReport creation.
Format as a checklist I can use for acceptance criteria.
```

Result: A concrete checklist like:
- [ ] visibilityMeters: 0–60
- [ ] currentStrength: 1–5
- [ ] rating: 1–5 (optional)
- [ ] divedAt: not in the future
- [ ] Anti-duplication: same user + spot within 2h with Δ visibility ≤ 1.0 and same currentStrength → 409
- [ ] Author is immutable after creation
- [ ] Edit window: 48h (owner) or bypass (mod/admin)

### Step 3: Create Minimal Spec

Don't over-specify. Your spec is the issue body + the business rules checklist + a reference to USECASE.md. Claude has access to all your docs.

### Step 4: Task Breakdown

Use plan mode or ask Claude directly:

```
I'm implementing feat#<issue>: DiveReport creation.
Break this into sub-tasks following the backend-feature skill pattern.
Reference docs/DOMAIN.md and docs/USECASE.md for rules.
Each sub-task should be independently verifiable.
```

### Step 5: Controlled Implementation

Work through sub-tasks one at a time:

```bash
# Create feature branch
git checkout -b feat/dive-report-creation

# Start Claude Code
claude

# In Claude:
/backend-feature reports "Create DiveReport with full validation per DOMAIN.md"
```

Between sub-tasks:
- Run tests: `pnpm test:backend`
- Check types: `cd apps/backend && pnpm tsc --noEmit`
- `/compact` if context is growing

### Step 6: Automated Review

```
/business-rules-audit reports
/api-contract reports
```

### Step 7: Security Validation

```
/security-review reports
```

### Step 8: Manual Sanity Check

```bash
# Start backend if not running
pnpm dev:backend

# Test the endpoint manually
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -H "x-dev-user-id: seed-user-001" \
  -d '{"spotId": "...", "visibilityMeters": 8, "currentStrength": 3, "divedAt": "2026-02-10T12:00:00Z"}'
```

### Step 9: PR Creation

```bash
# In Claude:
# "Create a PR for this feature. Link to issue #<number>."

# Or manually:
gh pr create --title "feat#<issue>: add dive report creation" --body "..."
```

### Step 10: Post-Merge Validation

```bash
git checkout main && git pull
pnpm test:backend
pnpm lint
cd apps/backend && pnpm tsc --noEmit
```

---

## 13. Claude Usage Across Development Stages

### UI/UX Design

**Claude's role:** Brainstorming, component structure, accessibility.
**Not Claude's role:** Visual design, color choices, pixel-perfect layouts.

```
# Good prompt:
"Design the component hierarchy for a DiveReport creation form.
It needs: spot selector, visibility slider (0-60m), current strength (1-5 stars),
optional rating (1-5), date picker (not future), photo attachments (max 5).
Must work on both iOS and Android. Follow existing patterns in src/features/map/."

# Don't ask:
"Make a beautiful UI for reports"
```

**Workflow:**
1. Sketch rough wireframe yourself (paper or Figma)
2. Ask Claude to design component hierarchy
3. Ask Claude to implement components with accessibility
4. Manually review the visual result
5. Iterate on styling yourself or with specific feedback

### Software Design & Architecture

**Claude's role:** Exploring trade-offs, validating against existing patterns, designing module structure.

```
# Good prompt:
"I need to add a reports module. Read the existing spots module structure
and docs/ARCHITECTURE.md. Propose the reports module following the same patterns.
Include: controller, service, repository, DTOs, domain errors.
What additional considerations does DOMAIN.md raise for reports vs spots?"
```

**Use plan mode** for architecture decisions. Let Claude explore the codebase, propose a design, and get your approval before writing code.

### Software Implementation

**Claude's role:** Writing code, following established patterns, running tests.

This is where Claude shines. Use skills for structured implementation. Decompose into sub-tasks. Verify continuously.

**Key principle:** Claude implements, you verify. Never trust large changes without running tests and reading the diff.

### Security

**Claude's role:** Automated scanning, pattern-based review, dependency auditing.
**Not Claude's role:** Threat modeling, deciding your security posture.

```bash
# Regular security check
/security-review all

# Dependency audit
pnpm audit

# Before any release
/security-review all
# + manual review of auth flows
```

### Product Management

**Claude's role:** Issue management, PR workflows, documentation updates.

```bash
# Triage issues
gh issue list --state open

# Ask Claude to prioritize
"Read these open issues. Considering VISION.md MVP scope,
which should I work on next? Consider dependencies between features."

# After implementation
gh issue close <number> --comment "Implemented in PR #<number>"
```

### Documentation

**Claude's role:** Keeping docs in sync with code changes.

```
"I just added the reports module. Update docs/ARCHITECTURE.md to include it
in the module list. Update docs/DOMAIN.md if any invariants changed.
Don't add fluff — match the existing style."
```

### Database & Migrations

**Claude's role:** Schema changes, migration generation, seed data.

```
# Always use the guardian first
/prisma-guardian

# Then make changes
"Add DiveReport model to schema.prisma per DOMAIN.md.
Include all fields, relations, and indexes.
Then generate a migration: pnpm prisma:migrate"
```

---

## 14. Cost Optimization

### Token Usage Breakdown

Typical Claude Code session costs:
- **Sonnet 4.5**: ~$0.05–0.20 per task (most work)
- **Opus 4.6**: ~$0.15–0.50 per task (complex reasoning)
- **Haiku**: ~$0.001–0.01 per task (exploration)

Average: **$6/day** for active development with Sonnet.

### Strategies to Reduce Cost

#### 1. Clear Context Between Tasks
```
/clear    # Start fresh — biggest single cost saver
```
Every unrelated message in history costs tokens on every subsequent turn. A 50-message conversation costs 5–10x more per turn than a fresh one.

#### 2. Use the Right Model

| Task | Model | Why |
|---|---|---|
| File search, pattern finding | Haiku (Explore agent) | 20x cheaper than Sonnet |
| Standard implementation | Sonnet | Best cost/quality ratio |
| Complex debugging, architecture | Opus | Worth the premium for hard problems |
| Quick questions | Haiku | Fast, cheap |

Switch with `/model sonnet` or `/model opus`.

#### 3. Be Specific in Prompts

```
# Expensive (Claude explores everything):
"Fix the bug in the spots module"

# Cheap (Claude goes straight to the file):
"In apps/backend/src/modules/spots/spots.service.ts, the listByBBox method
doesn't filter isDeleted=false. Add the filter."
```

#### 4. Keep CLAUDE.md Lean

Your current CLAUDE.md is ~4100 bytes — that's good. Don't let it grow beyond ~500 lines. Move specialized instructions to `.claude/rules/` with path scoping so they only load when relevant.

#### 5. Delegate Verbose Operations to Subagents

```
# Expensive (test output fills main context):
"Run all tests and fix any failures"

# Cheap (subagent absorbs the output):
# Use Task tool with Bash agent: "Run pnpm test:backend and report only failures"
```

#### 6. Don't Re-read Files Unnecessarily

If you just read a file 2 messages ago and haven't changed it, Claude still has it in context. Don't ask to read it again.

#### 7. Use /compact Strategically

```
/compact "focus on the reports module implementation"
```

This summarizes history but keeps relevant details. Use when context is >50% full (check with `/context`).

### Repository Structure for AI Efficiency

Your current structure is already good. Key principles:

- **Small, focused files** — Claude reads whole files. 200-line files are better than 2000-line files.
- **Consistent patterns** — Claude generalizes from examples. If all services follow the same pattern, Claude needs to read fewer files.
- **Co-located tests** — `*.spec.ts` next to source means Claude reads both in one directory scan.
- **Meaningful file names** — `create-dive-spot.dto.ts` is self-documenting. Claude knows what it contains before reading.

---

## 15. Security & Risk Management

### Prompt Injection

**Risk:** Malicious content in files, API responses, or user input could manipulate Claude's behavior.

**Mitigations:**
- Claude Code flags suspicious tool results automatically
- Don't pipe untrusted external content directly into prompts
- Review Claude's actions on any file that came from external sources
- Use hooks to block writes to sensitive files (`.env`, auth configs)

### Schema Drift

**Risk:** Claude modifies schema.prisma in ways that don't match DOMAIN.md.

**Mitigations:**
- Use the Prisma Guardian skill (blocks unreviewed changes)
- Hook on schema.prisma edits (require explicit approval)
- Always run `pnpm prisma:validate` after schema changes
- Compare schema against DOMAIN.md periodically: `/business-rules-audit`

### Unauthorized Business Rule Changes

**Risk:** Claude silently changes validation logic (e.g., removing the 1000m proximity check).

**Mitigations:**
- Business rules are documented in DOMAIN.md (source of truth)
- Run `/business-rules-audit` after implementation
- Tests encode business rules — if a test breaks, something changed
- Review diffs before committing (always `git diff` before `git add`)

### Secret Handling

**Rules:**
- `.env` files are gitignored (verify with `git check-ignore .env`)
- Never hardcode secrets in source files
- Use hook to block secrets in file writes (see Hooks section)
- Supabase service role key: **never** expose to client, **never** configure in MCP
- Use anon key for client-side Supabase operations

### GitHub Workflow Hardening

```bash
# Branch protection (if using GitHub Pro/Team):
# - Require PR reviews
# - Require status checks (lint, test)
# - Prevent force-push to main

# Current protection via Husky hooks:
# pre-commit: blocks direct commits to main
# pre-push: runs lint + tests
# commit-msg: enforces conventional commit format
```

### Supabase Security Best Practices

1. **Row Level Security (RLS):** Enable on all tables. Even with backend API, RLS is a safety net.
2. **Anon key:** Only in client apps. Limited to RLS-allowed operations.
3. **Service role key:** Only in backend. Never in mobile app, never in MCP config.
4. **Auth:** JWT verification via JWKS (you have this — `jwt-verify.service.ts`).
5. **Storage:** Pre-signed uploads only. No direct bucket access from client.
6. **Database:** Use connection pooling. Never expose the direct database URL publicly.

---

## 16. Opinionated Recommendations

### What You Should Stop Doing

1. **Stop writing big-bang prompts.** "Implement the whole feature" = unpredictable results. Decompose into 3–5 verifiable sub-tasks.
2. **Stop skipping `/clear`.** Every unrelated message in history taxes every future turn. Clear between tasks.
3. **Stop trusting Claude's output without running tests.** Claude is confident even when wrong. Always verify.
4. **Stop manually formatting code.** Use hooks or prettier — let machines do machine work.
5. **Stop re-reading your own docs to Claude.** Put them in CLAUDE.md or rules files. Claude reads them automatically.
6. **Stop using Opus for simple tasks.** Sonnet handles 90% of work at 3x lower cost. Haiku handles exploration at 20x lower cost.

### What You Should Start Doing

1. **Start using plan mode for features.** Think before code. Claude's plan mode explores the codebase and proposes an approach for your approval. This catches misunderstandings early.
2. **Start using skills for repeatable workflows.** The 7 skills above encode your architecture patterns. Use them.
3. **Start running `/business-rules-audit` after every feature.** Your DOMAIN.md invariants are your safety net. Verify them.
4. **Start using Explore agents for research.** `"Find how the auth guard works"` in an Explore agent keeps your main context clean.
5. **Start committing after each sub-task.** Small commits = easy reverts. `git commit -m "feat#42: add SpotProximityError"` after each step.
6. **Start backgrounding your dev servers.** `pnpm dev:backend` + Ctrl+B at the start of every session. Always have a running server to test against.
7. **Start using `/compact` proactively.** Don't wait for auto-compaction to lose important context. Compact with focus before it gets critical.

### What You Should Automate Immediately

1. **Pre-commit lint + type check** — Already done via Husky. Keep it.
2. **Auto-format on file write** — Add the PostToolUse hook for Prettier.
3. **Secret detection in file writes** — Add the PreToolUse hook (see Hooks section).
4. **Schema edit protection** — Add the PreToolUse hook for schema.prisma.
5. **GitHub Actions CI** — You're missing this. Add: lint + type-check + test on every PR.

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: cd apps/backend && pnpm tsc --noEmit
      - run: pnpm test:backend
      - run: cd apps/mobile && pnpm test
```

### What You Should Never Let Claude Do Unsupervised

1. **Push to main/remote.** Always review the diff first. Always.
2. **Delete files or directories.** Claude might think a file is unused when it's imported dynamically.
3. **Modify `.env` or auth configuration.** One wrong character = locked out of your own database.
4. **Run destructive git commands.** `git reset --hard`, `git push --force`, `git clean -f` — never without explicit intent.
5. **Modify Prisma schema without the guardian skill.** Schema changes cascade. One wrong migration = data loss.
6. **Install new dependencies.** Claude might add a dependency you don't need, or one with security issues. Always review `pnpm add` calls.
7. **Create or modify GitHub Actions workflows.** CI/CD changes affect your entire pipeline. Review manually.
8. **Modify Supabase configuration.** Auth settings, RLS policies, storage rules — these are security-critical.

---

## Quick Reference Card

```
SESSION START:
  pnpm dev:backend        → Ctrl+B (background)
  pnpm dev:mobile         → Ctrl+B (background)
  /context                → check what's loaded

DURING WORK:
  /clear                  → between unrelated tasks
  /compact "focus on X"   → when context grows
  /model sonnet           → default for implementation
  /model opus             → complex reasoning only

SKILLS:
  /backend-feature        → new backend feature
  /frontend-feature       → new frontend feature
  /test-writer            → write tests
  /business-rules-audit   → verify domain invariants
  /security-review        → security audit
  /prisma-guardian        → schema change review
  /api-contract           → API contract verification

BEFORE COMMIT:
  pnpm test:backend
  pnpm lint
  cd apps/backend && pnpm tsc --noEmit
  /security-review <module>

USEFUL COMMANDS:
  /tasks                  → list background tasks
  /context                → see context usage
  gh issue list           → check open issues
  gh pr create            → create pull request
```

---

*This playbook is a living document. Update it as your stack, patterns, and Claude Code features evolve.*
