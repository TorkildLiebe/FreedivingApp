# Comprehensive Guide: Using Claude Code Effectively with DiveFreely-Alpha

## Quick Reference

### When You Need Something Done Right

**Before asking Claude:**
1. Be specific: "Implement pagination for spots list endpoint following the pattern in users.controller.ts" ✅
2. Not: "Add pagination" ❌

**Reference conventions explicitly:**
- "Follow vertical slice architecture (ARCHITECTURE.md §3)"
- "Use domain error patterns from /common/errors/"
- "Follow file naming: kebab-case for files, PascalCase for classes"cd Dive

**Common whitelisted commands** (from your settings):
- `pnpm install`, `pnpm test`, `pnpm type-check`
- `npx tsc`, `npx prisma migrate`
- `git add`, `git checkout`

**Use MCP servers for external integrations:**
```bash
claude mcp add --transport http github https://mcp.github.com
claude mcp list
/mcp  # In Claude Code: authenticate & check status
```

---

## 1. Preventing Convention Drift

### Problem
Claude forgets project patterns over long sessions, creates files with wrong naming, ignores architecture patterns.

### Solutions

#### A. Explicit Convention References

**In every request that involves new code:**

```
Good: "Create parking service following vertical slice pattern (ARCHITECTURE.md §3):
- parking.controller.ts
- parking.service.ts
- parking.repository.ts
- dto/ folder with CreateParkingDto"

Bad: "Create a parking service"
```

**For error handling:**
```
Good: "Throw SpotNotFoundException (extends DomainException, maps to 404)
from spots.service.ts, following error patterns in /common/errors/"

Bad: "Handle the error"
```

**For naming:**
```
Good: "Create dive-condition.service.ts (kebab-case) with DiveConditionService class (PascalCase)"

Bad: "Create a dive condition service file"
```

#### B. Use Hooks for Enforcement

Create `.claude/hooks/pre-edit.sh` to enforce conventions:

```bash
#!/bin/bash
# Block edits that violate naming conventions
if [[ "$FILE_PATH" =~ [A-Z] ]] && [[ "$FILE_PATH" =~ \.ts$ ]]; then
  echo "Error: TypeScript files must be kebab-case"
  exit 1
fi
```

**Critical:** Review hooks thoroughly - they run with your credentials!

#### C. Reference Documentation Proactively

**Start complex requests with:**
- "Per ARCHITECTURE.md §3 vertical slices..."
- "Following DOMAIN.md §2.3 validation rules..."
- "Using error patterns from CLAUDE.md §Error Handling..."

**Remind Claude of constraints:**
- "Remember: soft deletes (isDeleted=false filter)"
- "Remember: max 5 photos per spot"
- "Remember: 1000m minimum spot proximity"

#### D. Settings Configuration

**In `.claude/settings.local.json`** (gitignored, your personal preferences):

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm --filter backend test:*)",
      "Bash(pnpm --filter backend lint:*)",
      "Bash(npx prisma migrate:*)"
    ],
    "deny": [
      "**/.env",
      "**/prisma/migrations/**"
    ]
  }
}
```

---

## 2. Ensuring Complete Functionality

### Problem
Claude implements what you asked for but misses obvious UX requirements: loading states, error messages, edge cases, permissions.

### Solutions

#### A. Plan-First Approach

**For any feature involving >3 files or >2 concepts:**

```bash
# Start in plan mode
claude --permission-mode plan
```

**Request structure:**
```
"I need to implement [feature]. Before you start:

1. Explore the codebase for similar patterns
2. Create a multi-phase plan with:
   - TODO list for each phase
   - Acceptance criteria
   - Tests to create
   - UX completeness checklist

Each phase must include: loading states, error handling,
edge cases, permissions, validation."
```

#### B. UX Completeness Checklist

**Include in every feature request:**

```
Implement [feature] with complete UX:

Frontend:
□ Loading state while fetching
□ Error state with user-friendly message
□ Empty state (no results)
□ Success state
□ Optimistic updates where appropriate
□ Form validation with helpful messages

Backend:
□ Input validation (DTOs with class-validator)
□ Authorization checks (owner/mod/admin)
□ Error responses with proper HTTP codes
□ Pagination/limits to prevent overload
□ Soft delete filtering (isDeleted=false)

Tests:
□ Happy path
□ Error paths (unauthorized, not found, validation)
□ Edge cases (empty arrays, null values, max limits)
□ Permission checks
□ State transitions
```

#### C. Multi-Phase Breakdown

**Example request:**
```
Implement photo upload for dive spots. Use 3 phases:

Phase 1: Backend foundation
- TODO: Create photo entity, repository, service
- Acceptance: Can create photo records in DB
- Tests: Unit tests for service, repository mocks
- Run: pnpm --filter backend test, lint

Phase 2: Upload integration
- TODO: Supabase Storage integration, controller endpoints
- Acceptance: Can upload to storage, create DB record
- Tests: E2E tests for upload endpoint, auth checks
- Run: pnpm --filter backend test:e2e, lint

Phase 3: Frontend integration
- TODO: Upload form, preview, error handling
- Acceptance: Users can upload, see loading/error/success
- Tests: Component tests with upload scenarios
- Run: pnpm --filter mobile test, lint

Constraints: Max 5 photos per spot, 5MB max, jpg/png only
```

#### D. Exploration Before Implementation

**Always start with:**
```
"Before implementing [feature], explore:
1. How does [similar feature] work?
2. What patterns exist for [concept]?
3. What tests exist for [similar feature]?

Then create a plan following those patterns."
```

---

## 3. Writing Effective Tests

### Problem
Tests Claude creates only verify what it implemented, not what *should* work. Tests pass even when implementation has bugs.

### Solutions

#### A. Test Domain Behavior, Not Mocks

**Bad test (only checks mock was called):**
```typescript
it('should find spots', async () => {
  await service.findAll();
  expect(mockRepository.findAll).toHaveBeenCalled();
});
```

**Good test (verifies behavior):**
```typescript
it('should exclude soft-deleted spots from results', async () => {
  mockRepository.findAll.mockResolvedValue([
    { id: '1', isDeleted: false },
    { id: '2', isDeleted: true },
  ]);

  const result = await service.findAll();

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('1');
  expect(mockRepository.findAll).toHaveBeenCalledWith(
    expect.objectContaining({ where: { isDeleted: false } })
  );
});
```

#### B. Test Invariants (Domain Rules)

**From CLAUDE.md Critical Constraints, your tests must verify:**

```typescript
describe('Spot proximity validation', () => {
  it('should reject spots within 1000m of existing spot', async () => {
    mockRepository.findNearby.mockResolvedValue([existingSpot]);

    await expect(
      service.create({ lat: 59.1234, lon: 10.1234, ...})
    ).rejects.toThrow(SpotTooCloseException);
  });
});

describe('Photo limits', () => {
  it('should reject 6th photo upload', async () => {
    mockRepository.countPhotos.mockResolvedValue(5);

    await expect(
      service.addPhoto(spotId, photoData)
    ).rejects.toThrow(MaxPhotosExceededException);
  });
});

describe('Report edit window', () => {
  it('should reject edit after 48h for non-mod', async () => {
    const report = {
      createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      userId: 'user1'
    };

    await expect(
      service.updateReport(reportId, updates, 'user1', Role.USER)
    ).rejects.toThrow(EditWindowExpiredException);
  });

  it('should allow mod to edit after 48h', async () => {
    const report = {
      createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      userId: 'user1'
    };

    await expect(
      service.updateReport(reportId, updates, 'mod1', Role.MODERATOR)
    ).resolves.toBeDefined();
  });
});
```

#### C. Test Error Paths

**For every service method, test:**

```typescript
describe('SpotService.findById', () => {
  it('should return spot when found', async () => {
    // Happy path
  });

  it('should throw SpotNotFoundException when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.findById('invalid'))
      .rejects.toThrow(SpotNotFoundException);
  });

  it('should throw SpotNotFoundException when soft-deleted', async () => {
    mockRepository.findById.mockResolvedValue({ isDeleted: true });

    await expect(service.findById('deleted'))
      .rejects.toThrow(SpotNotFoundException);
  });
});
```

#### D. Test State Transitions

**Frontend tests must cover:**

```typescript
describe('AuthContext', () => {
  it('should transition loading → authenticated on successful sign-in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn(email, password);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.session).toBeDefined();
  });

  it('should transition loading → error on failed sign-in', async () => {
    mockAuth.signIn.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.signIn(email, 'wrong'))
        .rejects.toThrow();
    });

    expect(result.current.user).toBeNull();
  });
});
```

#### E. Test Integration Points

**Test guards, filters, validators:**

```typescript
describe('SpotController', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .post('/spots')
      .send(validSpotData);

    expect(response.status).toBe(401);
  });

  it('should validate DTO', async () => {
    const response = await request(app)
      .post('/spots')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 'invalid' }); // Should be number

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('lat');
  });

  it('should map domain exceptions to HTTP codes', async () => {
    jest.spyOn(service, 'create')
      .mockRejectedValue(new SpotTooCloseException());

    const response = await request(app)
      .post('/spots')
      .set('Authorization', `Bearer ${token}`)
      .send(validSpotData);

    expect(response.status).toBe(409); // Conflict
  });
});
```

#### F. Request Pattern for Tests

**When asking Claude to write tests:**

```
"Write tests for SpotsService.create that verify:

Domain behavior (not just mock calls):
- New spot is created with correct fields
- Proximity validation (rejects <1000m, from CLAUDE.md §Critical Constraints)
- Max photos limit (5, from CLAUDE.md)
- Soft delete filtering (isDeleted=false)

Error paths:
- SpotTooCloseException when within 1000m
- SpotNotFoundException when parent not found
- UnauthorizedException when user lacks permission

Integration:
- Repository called with correct parameters
- Transaction used for multi-step creation
- User ID from auth context matches creator

Follow existing test patterns in spots.service.spec.ts"
```

---

## 4. Request Engineering

### Specificity Principles

#### Level 1: Vague (Leads to drift)
```
❌ "Add pagination"
❌ "Fix the bug"
❌ "Create a service for parking"
```

#### Level 2: Specific (Better)
```
⚠️ "Add pagination to the spots list"
⚠️ "Fix the bug where deleted spots appear"
⚠️ "Create a parking service with CRUD operations"
```

#### Level 3: Explicit (Best)
```
✅ "Add cursor-based pagination to GET /spots endpoint:
- Add `cursor` and `limit` query params to GetSpotsDto
- Implement in spots.service.ts following pattern in users.service.ts
- Return { data, nextCursor, hasMore }
- Default limit 20, max 100
- Add tests covering: first page, subsequent pages, last page, empty results"

✅ "Fix bug where soft-deleted spots appear in list:
- Add `isDeleted: false` filter to repository.findAll()
- Verify filter exists in all query methods
- Add test: 'should exclude soft-deleted spots' in spots.service.spec.ts
- Follow soft delete pattern from CLAUDE.md §Data Patterns"

✅ "Create parking module following vertical slice architecture (ARCHITECTURE.md §3):
- parking.controller.ts: CRUD endpoints with @UseGuards(JwtAuthGuard)
- parking.service.ts: business logic, validate within 5000m of spot
- parking.repository.ts: Prisma queries with soft delete filtering
- dto/: CreateParkingDto, UpdateParkingDto with class-validator
- __tests__/: unit + e2e tests
- Max 5 parkings per spot, dedupe within 2m (CLAUDE.md §Critical Constraints)"
```

### Step-by-Step Instructions

**For complex features:**

```
"Implement dive condition reporting in 3 steps:

Step 1: Explore patterns
- Review how dive-report module is structured
- Check how photos are handled in reports
- Identify validation patterns

Step 2: Backend implementation
- Create conditions module (controller, service, repository, DTOs)
- Endpoints: POST /conditions, GET /conditions, PATCH /conditions/:id
- Validation: required fields (visibility, temperature, date)
- Business rules: 48h edit window (CLAUDE.md), owner/mod permissions
- Tests: service unit tests, controller e2e tests

Step 3: Frontend integration
- Form with condition fields
- Loading/error/success states
- Date picker validation (no future dates)
- Unit/visibility conversions (metric/imperial)
- Tests: form validation, submission, error handling

After each step: run tests, linting, type-check"
```

### Referencing Domain Constraints

**Always include relevant constraints:**

```
"Implement spot creation with these constraints (from CLAUDE.md §Critical Constraints):

- Validate proximity: reject if any spot within 1000m
- Photo limit: max 5 photos
- Text validation: no emoji in displayName or title
- Soft deletes: always filter isDeleted=false
- Transaction: use Prisma $transaction for spot + initial photo

Test all constraints explicitly."
```

---

## 5. Advanced Features

### A. Plan Mode

**Use when:**
- Feature involves >5 files
- Uncertain about architecture approach
- Want to review before changes

```bash
claude --permission-mode plan

# Claude explores, proposes plan, waits for approval
# Type 'continue' to execute or refine plan
```

**In plan mode, Claude can:**
- Read files
- Search codebase
- Propose changes
- Create detailed plans

**Claude cannot:**
- Edit files
- Run tests
- Execute commands
- Make commits

### B. Extended Thinking

**Toggle with Tab key for:**
- Architectural decisions
- Complex debugging
- Performance optimization
- Security analysis

**Intensify with phrases:**
- "Think hard about..."
- "Carefully consider..."
- "Analyze thoroughly..."

### C. Sub-agents (When You Need Specialization)

**Example: Code review sub-agent**

Create `.claude/sub-agents/code-reviewer.md`:

```markdown
# Code Reviewer Sub-agent

## Purpose
Review code changes for consistency with DiveFreely-Alpha conventions.

## Process
1. Read changed files (from git diff)
2. Check against CLAUDE.md conventions
3. Verify architecture patterns (ARCHITECTURE.md)
4. Check domain constraints (DOMAIN.md)
5. Review test coverage

## Guidelines
- Flag files not in kebab-case
- Flag missing soft-delete filters
- Flag missing authorization checks
- Flag tests without error path coverage
- Flag domain constraint violations

Report findings as checklist with file:line references.
```

**Invoke automatically** (action-oriented description):
```markdown
## When to Use
Automatically review code after any multi-file change or before PR creation.
```

### D. Hooks for Automation

**Pre-edit hook:** Enforce conventions before edits

`.claude/hooks/pre-edit.sh`:
```bash
#!/bin/bash

# Block edits to files with uppercase in name
if [[ "$FILE_PATH" =~ [A-Z] ]] && [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  if [[ ! "$FILE_PATH" =~ (^[A-Z]|\.test\.|\.spec\.) ]]; then
    echo "❌ TypeScript files must be kebab-case: $FILE_PATH"
    exit 1
  fi
fi

# Block direct Prisma imports in domain code
if [[ "$FILE_PATH" =~ /domain/ ]] && grep -q "@prisma/client" "$TEMP_FILE"; then
  echo "❌ Domain code cannot import Prisma (ports/adapters pattern)"
  exit 1
fi

exit 0
```

**Post-edit hook:** Auto-format after edits

`.claude/hooks/post-edit.sh`:
```bash
#!/bin/bash

# Auto-format TypeScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  npx prettier --write "$FILE_PATH"
fi

exit 0
```

**Register in `.claude/settings.json`:**
```json
{
  "hooks": {
    "preEdit": ".claude/hooks/pre-edit.sh",
    "postEdit": ".claude/hooks/post-edit.sh"
  }
}
```

**⚠️ Security Warning:** Hooks run with your credentials. Review thoroughly!

---

## 6. MCP Servers: Extending Claude Code

### What Are MCP Servers?

**Model Context Protocol (MCP)** is an open standard that connects Claude Code to external tools, databases, and APIs. Instead of building custom integrations, MCP provides a unified protocol for accessing external data.

**Key concept:** MCP servers expose data/functionality → Claude Code connects as a client → You get enhanced capabilities

### When to Use MCP Servers vs Built-in Tools

#### Use Built-in Tools When:
- Reading/editing files in your project ✅
- Running bash commands ✅
- Searching code with grep/glob ✅
- Basic git operations ✅
- Standard development workflows ✅

#### Use MCP Servers When:
- Accessing external databases (Postgres, MongoDB)
- Integrating with SaaS platforms (GitHub Issues, Jira, Notion)
- Querying APIs not accessible via bash
- Need specialized tools (Stripe payments, Sentry monitoring)
- Want persistent connections across sessions
- Team needs shared tool access

### DiveFreely-Alpha: Recommended MCP Servers

#### Essential for Your Stack

**1. PostgreSQL MCP Server**
- **Use case:** Direct database queries, schema inspection, data analysis
- **When:** Debugging data issues, writing complex queries, analyzing dive spot distributions
- **Example:** "Show me all dive spots created in the last week with their photo counts"

**2. GitHub MCP Server**
- **Use case:** Advanced issue management, PR analysis, repository insights
- **When:** Creating issues with templates, analyzing PR patterns, automating workflows
- **Example:** "Create a bug issue for the spot proximity validation failure with proper labels"

**3. Supabase MCP Server** (if available)
- **Use case:** Direct access to your Supabase project
- **When:** Managing auth users, storage buckets, inspecting real-time subscriptions
- **Example:** "Show me all users who signed up today and their dive spot activity"

#### Useful for Development

**4. Sentry MCP Server**
- **Use case:** Error monitoring, debugging production issues
- **When:** Analyzing error patterns, creating issues from errors
- **Example:** "What are the top 5 errors in production this week?"

**5. Git MCP Server**
- **Use case:** Advanced git operations beyond built-in tools
- **When:** Complex history analysis, blame investigations, branch comparisons
- **Example:** "Show all files modified in feature branches not yet merged to main"

**6. Linear/Jira MCP Server**
- **Use case:** Project management integration
- **When:** Creating tasks, updating status, linking code to tickets
- **Example:** "Update issue #88 status to in-progress and add comment about implementation approach"

#### Nice to Have

**7. Figma MCP Server**
- **Use case:** Accessing design files, extracting design tokens
- **When:** Implementing UI based on designs, verifying spacing/colors
- **Example:** "What colors are used in the map view design?"

**8. Slack MCP Server**
- **Use case:** Team communication automation
- **When:** Posting deployment notifications, sharing insights
- **Example:** "Post to #dev-updates that PR #88 is ready for review"

### Setting Up MCP Servers

#### Installation Prerequisites

```bash
# For Python-based servers
brew install uv

# For Node.js-based servers (already have this)
node --version  # Should be v18+
```

#### Adding a Server

**Three transport types:**

1. **HTTP (Recommended)** - Remote cloud services
2. **Stdio** - Local processes on your machine
3. **SSE** - Deprecated, use HTTP instead

**Basic syntax:**
```bash
claude mcp add [--transport TYPE] [--scope SCOPE] NAME COMMAND [ARGS...]
```

#### Practical Examples for DiveFreely-Alpha

**1. PostgreSQL Server (Stdio)**

```bash
# Install the Postgres MCP server
npm install -g @modelcontextprotocol/server-postgres

# Add to Claude Code (user scope for personal use)
claude mcp add --transport stdio --scope user postgres \
  --env DATABASE_URL="postgresql://user:pass@localhost:5432/divefreely" \
  -- npx -y @modelcontextprotocol/server-postgres
```

**⚠️ Security:** Use read-only database credentials or create a limited-privilege user:
```sql
CREATE USER claude_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE divefreely TO claude_readonly;
GRANT USAGE ON SCHEMA public TO claude_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_readonly;
```

**2. GitHub Server (HTTP)**

```bash
# Add GitHub MCP server (project scope for team)
claude mcp add --transport http --scope project github \
  https://mcp.github.com

# Authenticate in Claude Code
# Type: /mcp
# Follow OAuth flow in browser
```

**3. Git Server (Stdio)**

```bash
# Add Git MCP server (user scope)
claude mcp add --transport stdio --scope user git \
  -- npx -y @modelcontextprotocol/server-git
```

**4. Sentry Server (HTTP)**

```bash
# Add Sentry (requires auth token)
claude mcp add --transport http --scope project sentry \
  https://mcp.sentry.dev/mcp

# Authenticate via /mcp command
```

### Configuration Scopes

| Scope | Location | Use Case | Team Access |
|-------|----------|----------|-------------|
| `local` | Session only | Experimental testing | No |
| `user` | `~/.claude.json` | Personal utilities | No |
| `project` | `.mcp.json` (git) | Shared team tools | Yes ✅ |

**For DiveFreely-Alpha:**
- **Project scope:** GitHub, Sentry, Jira (team needs access)
- **User scope:** Postgres (personal DB credentials), Git (personal use)
- **Local scope:** Testing new servers before committing

#### Project Configuration Example

**`.mcp.json` in repository root:**

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://mcp.github.com"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "jira": {
      "type": "http",
      "url": "${JIRA_URL:-https://divefreely.atlassian.net}/mcp",
      "headers": {
        "Authorization": "Bearer ${JIRA_TOKEN}"
      }
    }
  }
}
```

**`.env` (gitignored):**
```bash
JIRA_URL=https://divefreely.atlassian.net
JIRA_TOKEN=your_personal_token_here
```

**Environment variable expansion:**
- `${VAR}` - Required, fails if not set
- `${VAR:-default}` - Optional with fallback

### Using MCP Servers in Claude Code

#### Resource References with @mentions

```
# Query specific resources
@github:issue://88
@sentry:error://12345
@postgres:table://dive_spots
```

**Example requests:**
```
"Analyze @github:issue://88 and suggest implementation approach"

"Check @sentry:error://top for production errors this week"

"Query @postgres:table://dive_spots for spots created within 500m of each other"
```

#### MCP Slash Commands

MCP servers can provide custom slash commands:

```bash
# List GitHub PRs
/mcp__github__list_prs

# Create Jira issue
/mcp__jira__create_issue "Bug: Spot proximity validation" High

# Query Sentry
/mcp__sentry__recent_errors 7days

# Execute Postgres query
/mcp__postgres__query "SELECT COUNT(*) FROM dive_spots WHERE created_at > NOW() - INTERVAL '7 days'"
```

#### Authentication Flow

1. Add server: `claude mcp add --transport http github https://mcp.github.com`
2. In Claude Code, run: `/mcp`
3. Click link to authenticate in browser
4. Tokens stored securely with auto-refresh
5. Verify: `claude mcp list` shows "authenticated"

### Managing MCP Servers

```bash
# List all configured servers
claude mcp list

# Show specific server details
claude mcp get github

# Remove a server
claude mcp remove github

# Reset project choices (re-approve servers)
claude mcp reset-project-choices

# Debug mode (see connection issues)
claude --mcp-debug
```

### Security Considerations

#### Critical Warnings

⚠️ **MCP servers execute code on your machine** - Review thoroughly before installation

⚠️ **Third-party servers are not verified by Anthropic** - Use trusted sources only

⚠️ **Prompt injection risk** - Servers fetching untrusted content can be exploited

⚠️ **Credentials exposure** - Never commit API tokens to git

#### Security Best Practices

**1. Database Access**
```bash
# ❌ Don't use admin credentials
DATABASE_URL="postgresql://admin:admin@prod/db"

# ✅ Create read-only user
DATABASE_URL="postgresql://claude_readonly:secure@localhost/divefreely"
```

**2. API Tokens**
```bash
# ❌ Don't hardcode in .mcp.json
{
  "headers": {
    "Authorization": "Bearer sk_live_abc123"
  }
}

# ✅ Use environment variables
{
  "headers": {
    "Authorization": "Bearer ${GITHUB_TOKEN}"
  }
}
```

**3. Scope Management**
```bash
# ❌ Don't share personal credentials
claude mcp add --scope project postgres --env DATABASE_URL="$MY_PERSONAL_DB"

# ✅ Use project-specific service accounts
claude mcp add --scope project postgres --env DATABASE_URL="${PROJECT_DB_URL}"
```

**4. Permission Minimization**
- Grant minimum necessary access
- Use read-only credentials when possible
- Set token expiration dates
- Revoke immediately if exposed
- Audit MCP server access logs

**5. Project Server Approval**

First time a project server is used:
```
⚠️ This project wants to use MCP server "postgres"
Command: npx @modelcontextprotocol/server-postgres
Environment: DATABASE_URL=***

[ Approve once ] [ Approve always ] [ Deny ]
```

**Review carefully** before approving!

### When to Use MCP Servers: Decision Matrix

| Task | Built-in Tool | MCP Server | Recommendation |
|------|--------------|------------|----------------|
| Read project file | Read tool ✅ | Filesystem MCP | Built-in |
| Run tests | Bash ✅ | N/A | Built-in |
| Query Postgres | Bash + psql ⚠️ | Postgres MCP ✅ | MCP (better UX) |
| Create GitHub issue | gh CLI ✅ | GitHub MCP ✅ | Either (MCP for automation) |
| Search codebase | Grep ✅ | Git MCP | Built-in |
| Analyze git history | Bash + git ⚠️ | Git MCP ✅ | MCP (complex queries) |
| Check Sentry errors | WebFetch ⚠️ | Sentry MCP ✅ | MCP (structured data) |
| Update Jira ticket | WebFetch + API ❌ | Jira MCP ✅ | MCP |
| Access Figma designs | WebFetch ❌ | Figma MCP ✅ | MCP |

**Rule of thumb:**
- **Built-in tools:** File operations, bash commands, simple workflows
- **MCP servers:** External services, complex queries, persistent connections

### Practical Workflows for DiveFreely-Alpha

#### Workflow 1: Feature Development

```
User: "Implement photo upload limit validation (max 5 per spot)"

Claude with Postgres MCP:
1. Queries @postgres to check current schema
2. Analyzes existing photo records distribution
3. Implements validation in service
4. Writes tests based on real data patterns
5. Verifies no spots exceed limit in production
```

#### Workflow 2: Bug Investigation

```
User: "Users reporting spots appearing incorrectly on map"

Claude with Postgres + Sentry MCP:
1. Checks @sentry for related errors
2. Queries @postgres for affected spot coordinates
3. Identifies spots with invalid bbox calculations
4. Proposes fix with data migration
5. Creates @github issue with findings
```

#### Workflow 3: Data Analysis

```
User: "Generate report on dive spot activity"

Claude with Postgres MCP:
1. Queries spot creation trends
2. Analyzes user engagement patterns
3. Identifies popular locations
4. Generates visualization-ready data
5. Suggests features based on insights
```

#### Workflow 4: Deployment Preparation

```
User: "Prepare for production deployment"

Claude with GitHub + Sentry + Postgres MCP:
1. Reviews @github PRs merged since last deploy
2. Checks @sentry for baseline error rates
3. Validates @postgres migrations are applied
4. Creates deployment checklist
5. Posts readiness summary to @slack
```

### Output Management

MCP servers can return large amounts of data. Claude Code warns when output exceeds 10,000 tokens.

**Configure limits:**
```bash
# Set higher limit for data-heavy queries
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

**Default:** 10,000 tokens
**Maximum:** 25,000 tokens

**Use case:** Database queries returning hundreds of rows, comprehensive error logs

### Advanced: Enterprise Management

For team deployments, configure centrally:

**macOS:** `/Library/Application Support/ClaudeCode/managed-mcp.json`
**Linux:** `/etc/claude-code/managed-mcp.json`
**Windows:** `C:\ProgramData\ClaudeCode\managed-mcp.json`

**Control in `managed-settings.json`:**
```json
{
  "allowedMcpServers": [
    "github",
    "sentry",
    "jira"
  ],
  "deniedMcpServers": [
    "postgres",  // Prevent direct DB access
    "filesystem"  // Prevent file system access
  ]
}
```

**Denylist takes precedence** over allowlist.

### Troubleshooting MCP Servers

#### Server Not Connecting

```bash
# Enable debug mode
claude --mcp-debug

# In Claude Code, check status
/mcp

# Verify configuration
claude mcp get servername
```

**Common issues:**
- Missing prerequisites (`uv`, `node`)
- Invalid credentials in environment variables
- Firewall blocking HTTP transport
- OAuth token expired (re-authenticate with `/mcp`)

#### Authentication Failures

```bash
# Remove and re-add server
claude mcp remove github
claude mcp add --transport http github https://mcp.github.com

# Re-authenticate
# In Claude Code: /mcp
```

#### Permission Denied

```bash
# Check database user permissions
psql -U claude_readonly -d divefreely -c "SELECT * FROM dive_spots LIMIT 1;"

# Verify API token scopes
# GitHub: Settings → Developer settings → Personal access tokens
```

#### Server Not Found

```bash
# Verify scope
claude mcp list --scope user
claude mcp list --scope project
claude mcp list --scope local

# Check .mcp.json exists (project scope)
cat .mcp.json
```

### Best Practices Summary

✅ **DO:**
- Use project scope for team-shared servers
- Store sensitive tokens in environment variables
- Create read-only database users for MCP access
- Review server configurations before approval
- Test servers in local scope first
- Document MCP setup in project README
- Use MCP for external integrations
- Grant minimum necessary permissions

❌ **DON'T:**
- Commit API tokens to git
- Use admin credentials for MCP servers
- Approve untrusted third-party servers
- Share personal credentials via project scope
- Use MCP for basic file/bash operations
- Ignore security warnings
- Skip authentication review
- Grant excessive permissions

### Quick Reference: Common Commands

```bash
# Add servers
claude mcp add --transport http --scope project github https://mcp.github.com
claude mcp add --transport stdio --scope user postgres --env DATABASE_URL="$DB" -- npx -y @modelcontextprotocol/server-postgres

# Manage servers
claude mcp list
claude mcp get github
claude mcp remove github
claude mcp reset-project-choices

# In Claude Code
/mcp                          # Authenticate & check status
@github:issue://88            # Reference resource
/mcp__github__list_prs        # Execute MCP command

# Debug
claude --mcp-debug
export MAX_MCP_OUTPUT_TOKENS=25000
```

### Resources

- **MCP Specification:** https://spec.modelcontextprotocol.io
- **Official Servers:** https://github.com/modelcontextprotocol/servers
- **Postgres MCP:** https://github.com/modelcontextprotocol/servers/tree/main/src/postgres
- **GitHub MCP:** https://mcp.github.com
- **Community Servers:** Search "mcp-server" on npm/GitHub

---

## 7. DiveFreely-Alpha Specific Patterns

### Vertical Slice Architecture Reminders

**When creating new features:**

```
"Create [feature] module following vertical slice pattern:

/apps/backend/src/modules/[feature]/
  ├── [feature].controller.ts       # Endpoints, guards, swagger
  ├── [feature].service.ts          # Business logic, orchestration
  ├── [feature].repository.ts       # Data access, Prisma queries
  ├── [feature].module.ts           # NestJS module registration
  ├── domain/
  │   ├── [feature].entity.ts      # Domain model (no DB deps)
  │   └── [feature].errors.ts      # Domain exceptions
  ├── dto/
  │   ├── create-[feature].dto.ts  # Input validation
  │   ├── update-[feature].dto.ts  # Partial updates
  │   └── [feature]-response.dto.ts # Output shape
  └── __tests__/
      ├── [feature].service.spec.ts    # Unit tests
      └── [feature].controller.e2e-spec.ts # Integration tests

Repository injects PrismaService, not used directly in service.
Domain errors extend DomainException from /common/errors/.
Controller uses @UseGuards(JwtAuthGuard) for auth.
DTOs use class-validator decorators (@IsString, @IsOptional, etc.)."
```

### Module Structure Checklist

**Every module must have:**

```
□ Controller with:
  - JwtAuthGuard on protected endpoints
  - Swagger decorators (@ApiTags, @ApiResponse)
  - DTO validation (auto via ValidationPipe)
  - Exception handling (auto via filters)

□ Service with:
  - Business logic only (no DB/HTTP/Storage calls)
  - Calls to repository for data
  - Throws domain exceptions (not HTTP exceptions)
  - Transaction handling via repository

□ Repository with:
  - PrismaService injection
  - All queries filter isDeleted=false
  - Transaction support ($transaction wrapper)
  - Interface for testability

□ DTOs with:
  - class-validator decorators
  - Clear property names
  - Swagger decorators (@ApiProperty)

□ Tests with:
  - Service unit tests (mock repository)
  - Controller e2e tests (real DB via docker)
  - 80% coverage minimum
  - Error paths covered
```

### Common Validation Patterns

**From your codebase:**

```typescript
// Coordinates validation
@IsNumber()
@Min(-90)
@Max(90)
lat: number;

@IsNumber()
@Min(-180)
@Max(180)
lon: number;

// Text validation (no emoji)
@IsString()
@Matches(/^[^\u{1F600}-\u{1F64F}]+$/u, {
  message: 'displayName cannot contain emoji'
})
displayName: string;

// Array limits
@IsArray()
@MaxLength(5, { message: 'Maximum 5 photos allowed' })
photos: PhotoDto[];

// Enum validation
@IsEnum(DiveLevel)
level: DiveLevel;

// Optional with default
@IsOptional()
@IsBoolean()
@Default(false)
isPublic?: boolean;
```

### Testing Standards

**Your coverage requirements:**

```
- Target: 80% (defined in CLAUDE.md)
- Current: 83%+ statements
- CI enforces thresholds (fails PR if below)
- Pre-push hook runs full test suite

Test types:
1. Unit: Domain logic, services (mock repository)
2. Integration: Controllers (real DB via docker)
3. E2E: Critical user flows (signup → create spot → upload photo)

Every service method needs:
- Happy path test
- Error path tests (NotFound, Validation, Unauthorized)
- Edge case tests (null, empty, max limits)
- Permission tests (owner, mod, admin)
```

---

## 8. Troubleshooting Common Issues

### Issue 1: Context Loss / Drift

**Symptoms:**
- Claude creates `DiveSpot.service.ts` instead of `dive-spot.service.ts`
- Forgets to filter `isDeleted=false`
- Uses Prisma directly in service instead of repository
- Forgets domain constraints (proximity, photo limits)

**Solutions:**

**Immediate fix:**
```
"Stop. Review CLAUDE.md before continuing:
- File naming: kebab-case (§File Naming)
- Soft deletes: always filter isDeleted=false (§Data Patterns)
- Architecture: repository pattern, no Prisma in service (§Architecture Patterns)
- Constraints: [specific constraint from §Critical Constraints]

Revise the implementation following these conventions."
```

**Prevention:**
- Start requests with: "Following CLAUDE.md conventions..."
- Reference specific sections: "(CLAUDE.md §Data Patterns)"
- Use hooks to enforce (see §5.D)
- Break into smaller, focused requests

### Issue 2: Incomplete Implementation

**Symptoms:**
- Endpoint works but has no error handling
- Form submits but no loading state
- Feature works but no authorization check
- CRUD operations but no soft delete

**Solutions:**

**Immediate fix:**
```
"The implementation is incomplete. Add:

Missing functionality:
- Loading state while [operation]
- Error handling for [failure cases]
- Authorization check (owner/mod/admin)
- Soft delete filtering
- Validation for [edge cases]

Update tests to cover these additions."
```

**Prevention:**
- Use UX Completeness Checklist (§2.B)
- Multi-phase planning (§2.C)
- Exploration before implementation (§2.D)
- Explicit acceptance criteria in request

### Issue 3: Test Superficiality

**Symptoms:**
- Tests only verify mock calls: `expect(mock.fn).toHaveBeenCalled()`
- Tests pass but bugs exist in production
- No error path coverage
- No edge case coverage

**Solutions:**

**Immediate fix:**
```
"These tests don't verify behavior, only mock calls. Rewrite to test:

Domain behavior:
- Does findAll() actually exclude soft-deleted items?
- Does create() reject spots within 1000m?
- Does update() enforce 48h edit window?

Error paths:
- What happens when item not found?
- What happens when validation fails?
- What happens when unauthorized?

Edge cases:
- Empty arrays
- Null values
- Max limits exceeded
- Concurrent operations

Follow test patterns in spots.service.spec.ts lines 45-89."
```

**Prevention:**
- Request tests for invariants explicitly (§3.B)
- Require error path coverage (§3.C)
- Reference existing good tests
- Review tests before accepting implementation

### Issue 4: Architecture Violations

**Symptoms:**
- Prisma imported in service
- HTTP exceptions in domain code
- No repository layer
- Controller has business logic

**Solutions:**

**Immediate fix:**
```
"Architecture violation detected. Fix:

1. Move Prisma queries to repository
2. Replace HttpException with domain exception (DomainException)
3. Move business logic from controller to service
4. Inject repository into service, not PrismaService

Follow vertical slice pattern (ARCHITECTURE.md §3) and
ports/adapters pattern (ARCHITECTURE.md §4)."
```

**Prevention:**
- Use pre-edit hooks to block violations (§5.D)
- Reference architecture docs explicitly
- Use code-reviewer sub-agent (§5.C)
- Review generated code against ARCHITECTURE.md

### Issue 5: Missing Domain Constraints

**Symptoms:**
- Can upload 10 photos (should be max 5)
- Can create spots 100m apart (should be 1000m)
- Can edit report after 72h (should be 48h)
- Parking 10km away (should be within 5000m)

**Solutions:**

**Immediate fix:**
```
"Implementation violates domain constraints from CLAUDE.md §Critical Constraints:

Missing constraints:
- [List specific constraints]

Add validation:
1. In DTO: @MaxLength(5) for photos
2. In service: proximity check before create
3. In service: edit window check before update
4. In service: distance validation for parking

Add tests for each constraint."
```

**Prevention:**
- List constraints in every feature request
- Reference CLAUDE.md §Critical Constraints explicitly
- Create constraint validation checklist
- Run domain validation tests in CI

---

## 9. Request Templates

### Template: New Feature

```
Implement [feature name] following DiveFreely-Alpha conventions.

Architecture (ARCHITECTURE.md §3 vertical slices):
- Module: /apps/backend/src/modules/[feature]/
- Files: [feature].controller.ts, [feature].service.ts, [feature].repository.ts
- DTOs: Create[Feature]Dto, Update[Feature]Dto
- Tests: Unit (service) + E2E (controller)

Domain constraints (CLAUDE.md §Critical Constraints):
- [List relevant constraints]

UX requirements:
- Loading state while [operation]
- Error handling for [scenarios]
- Authorization: [who can access]
- Validation: [required fields, limits]

Acceptance criteria:
- [ ] User can [action 1]
- [ ] User sees loading/error/success states
- [ ] User cannot [unauthorized action]
- [ ] System enforces [constraint]

Tests must cover:
- Happy path
- Error paths (NotFound, Validation, Unauthorized)
- Edge cases (empty, null, max limits)
- Domain constraints
- Permission checks

After implementation: pnpm --filter backend test, lint
```

### Template: Bug Fix

```
Fix bug: [description]

Current behavior:
- [What happens now]

Expected behavior:
- [What should happen]

Root cause investigation:
1. Check [relevant service/controller]
2. Look for missing [validation/filter/check]
3. Review related tests in [test file]

Fix requirements:
- Follow existing pattern in [similar code]
- Add missing [validation/filter/check]
- Ensure [constraint] is enforced
- Update/add tests to prevent regression

Tests must verify:
- Bug is fixed (specific scenario)
- Related scenarios still work
- Edge cases handled

After fix: pnpm --filter backend test, lint
```

### Template: Refactoring

```
Refactor [component] to [improvement]

Current issues:
- [Problem 1]
- [Problem 2]

Refactoring goals:
- [Goal 1]
- [Goal 2]

Constraints:
- No breaking changes to API
- Maintain test coverage (currently 83%+)
- Follow architecture patterns (ARCHITECTURE.md)
- Keep file naming conventions (CLAUDE.md)

Process:
1. Run existing tests (ensure all pass)
2. Make refactoring changes
3. Run tests again (ensure still pass)
4. Add tests for new code paths
5. Verify no coverage decrease

After refactoring: pnpm --filter backend test:cov, lint
```

---

## 10. Quick Wins

### Before Every Session

1. **Remind Claude of key conventions:**
```
"Quick reminder before we start:
- Files: kebab-case, classes: PascalCase
- Soft deletes: always filter isDeleted=false
- Architecture: vertical slices, repository pattern
- Tests: behavior not mocks, 80% coverage target"
```

2. **Reference relevant docs:**
```
"We're working on [feature]. Relevant docs:
- Architecture: ARCHITECTURE.md §3
- Domain rules: DOMAIN.md §2.3
- Constraints: CLAUDE.md §Critical Constraints"
```

### During Implementation

1. **Check progress against plan:**
```
"Pause. Review what we've implemented against the acceptance criteria.
What's missing?"
```

2. **Verify conventions:**
```
"Review the files created. Do they follow:
- File naming conventions?
- Architecture patterns?
- Error handling patterns?
- Test coverage requirements?"
```

3. **Test completeness:**
```
"Review the tests. Do they cover:
- Domain constraints?
- Error paths?
- Edge cases?
- Permission checks?"
```

### Before Committing

1. **Run quality checks:**
```bash
pnpm --filter backend lint
pnpm --filter backend type-check
pnpm --filter backend test:cov
```

2. **Review changes:**
```
"List all files changed. For each:
- Does it follow conventions?
- Are tests complete?
- Is documentation updated?"
```

3. **Verify domain constraints:**
```
"Verify implementation enforces (from CLAUDE.md §Critical Constraints):
- Spot proximity: 1000m
- Photo limits: max 5
- Edit windows: 48h
- Soft deletes: filtered
- [other relevant constraints]"
```

---

## 11. Success Metrics

**You'll know Claude Code is working well when:**

✅ Files follow naming conventions without reminders

✅ Architecture patterns are consistent across features

✅ Tests catch real bugs before they reach production

✅ Domain constraints are enforced in every implementation

✅ Authorization checks are never forgotten

✅ Loading/error states are included by default

✅ Soft delete filtering is applied everywhere

✅ Code reviews find few convention violations

✅ Test coverage stays above 80%

✅ You spend less time correcting Claude's mistakes

---

## Resources

- **Project docs:** `.claude/` folder
- **Architecture:** `ARCHITECTURE.md`
- **Domain rules:** `DOMAIN.md`
- **Testing:** `QUALITY.md`
- **Conventions:** `CLAUDE.md`
- **Claude Code docs:** https://docs.claude.com/en/docs/claude-code

---

**Last updated:** 2025-11-11 (Added MCP Servers section)
