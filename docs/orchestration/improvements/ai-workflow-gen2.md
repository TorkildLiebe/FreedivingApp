# AI Workflow Generation 2: Tool-Driven Orchestration

## 1. Executive Summary

This document proposes a modernization of the FreedivingApp AI workflow, moving from **Text-Based Contracts** (parsing Markdown headers/trailers) to **Tool-Driven Contracts** (Function Calling / MCP).

**Goal**: Increase robustness, reduce context usage, and enable faster iteration by decoupling the "Process" (Orchestration) from the "Intelligence" (LLM).

## 2. The Diagnosis (Generation 1)

The current workflow (`.claude`, `.codex`, `monitor-agent`) suffers from:

1.  **Fragility**: Orchestration breaks if the LLM typos a Markdown header or "trailer line" (e.g., `RESULT: PASS`).
2.  **Context Bloat**: The `vertical-slice-implementor` loads massive context (Backend + Mobile + Testing + Audit) for every task, regardless of scope.
3.  **Split-Brain Config**: Rules are duplicated across `.claude` and `.codex`.
4.  **Brittle Paths**: Hardcoded dependencies on specific file paths (e.g., Design OS) in prompts make refactoring difficult.

## 3. The Vision (Generation 2)

### 3.1. Unified Configuration (`.ai`)

We will introduce a `.ai` directory to serve as the single source of truth for all AI assistants (Claude, Codex, Gemini, etc.).

```
.ai/
├── config.yaml          # Project-wide settings (paths, constraints)
├── rules/               # Shared rule definitions (replacing .claude/rules)
│   ├── backend.md
│   ├── mobile.md
│   └── ...
├── roles/               # Specialized Agent Prompts
│   ├── architect.md     # "Specifier"
│   ├── builder.md       # "Implementor"
│   └── qa.md            # "Verifier"
└── tools/               # Local scripts exposed as AI Tools
    ├── orchestrator     # State management (JSON)
    └── design-os        # Asset resolution
```

### 3.2. Deconstructed Roles

Instead of one "God Agent", we split the work into specialized roles:

#### Role 1: The Architect (Specifier)
*   **Focus**: Understanding, Planning, and Design Compliance.
*   **Input**: Issue Number.
*   **Tools**: `read_file`, `design-os resolve`, `orchestrator get-issue`.
*   **Output**: A structured `plan.json` file.
*   **Context**: Loads `DOMAIN.md`, `USECASE.md`, and `design-os` rules. *Does NOT load testing or implementation details.*

#### Role 2: The Builder (Implementor)
*   **Focus**: Code Generation and Adherence to Patterns.
*   **Input**: `plan.json`.
*   **Tools**: `write_file`, `git`, `backend-patterns` (RAG).
*   **Context**: Loads `backend-patterns.md` or `mobile-patterns.md` based on the plan.

#### Role 3: The Verifier (QA)
*   **Focus**: Correctness, Regressions, and Evidence.
*   **Input**: `plan.json` + Changed Files.
*   **Tools**: `run_test`, `capture_screenshot`, `orchestrator submit-result`.
*   **Context**: Loads `TESTING_GUIDE.md` and verification rules.

### 3.3. Tool-Based Orchestration

We replace the `monitor-agent` regex parsing with a deterministic CLI tool: `bin/orchestrator`.

**Example Workflow:**

1.  **Agent**: Calls `orchestrator next-task`.
2.  **Tool**: Returns JSON:
    ```json
    {
      "issue_id": 123,
      "title": "Add Dive Spot",
      "type": "feature",
      "status": "planning"
    }
    ```
3.  **Agent (Architect)**: Creates a plan and calls `orchestrator save-plan --issue 123 --file plan.json`.
4.  **Agent (Builder)**: Implements changes.
5.  **Agent (Verifier)**: Runs tests and calls `orchestrator submit-result`:
    ```bash
    orchestrator submit-result \
      --issue 123 \
      --status PASS \
      --evidence "screenshots/ios-123.png" \
      --mobile-touched true
    ```

This eliminates the risk of "missing headers" or "bad formatting" breaking the pipeline.

## 4. Generation 3: The "Autonomous Studio" (Future Vision)

Once the Tool-Driven foundation (Gen 2) is stable, we can layer high-level automation to improve Developer Experience (DX) and Project Health.

### 4.1. Observability: "The Newsroom"
Currently, progress is hidden in Markdown files.
**Concept**: A reporting agent that runs on a schedule (e.g., 9 AM).
*   **Action**: Reads `orchestrator` state and `git log`.
*   **Output**: A daily "Morning Briefing" in a dedicated channel (Slack/Discord) or a simple web dashboard.
*   **Content**: "3 Issues Closed, 1 Blocker (Waiting on Design), E2E Pass Rate: 98%".

### 4.2. Knowledge Management: "The Librarian"
Currently, docs rot quickly.
**Concept**: A proactive documentation agent triggered by PR merges.
*   **Trigger**: `post-merge` hook.
*   **Action**: Scans changed files. If `User.ts` (Domain Entity) changed but `docs/DOMAIN.md` didn't, it opens a PR: "chore: Sync DOMAIN.md with recent code changes".
*   **Goal**: Zero-drift documentation.

### 4.3. Proactive Maintenance: "The Janitor"
**Concept**: A background agent that runs weekly.
*   **Tasks**:
    *   Find unused exports (ts-prune).
    *   Identify "TODO" comments older than 3 months.
    *   Check for dependency updates (renovate-lite).
*   **Output**: A "Maintenance Report" issue with low-priority tasks.

### 4.4. Developer Experience: "Mission Control"
**Concept**: A TUI (Text User Interface) or Local Web App.
*   **Why**: CLI commands (`orchestrator submit-result ...`) are tedious for humans.
*   **Features**:
    *   Visual Board (Kanban style) of the current Milestone.
    *   One-click "Start Planning Issue #123".
    *   Real-time logs from the active Agent.
    *   "Emergency Stop" button to kill rogue agent runs.

### 4.5. Simulation: "The Synthetic User"
**Concept**: An agent that populates the dev environment.
*   **Problem**: Dev DB is often empty or stale.
*   **Action**: Uses the API to create realistic "Dive Spots", "Logs", and "Users" with LLM-generated content (stories, photos, reviews).
*   **Benefit**: Developers and Designers always work with "Production-grade" data complexity.

## 5. Migration Strategy

We will migrate incrementally to avoid disrupting active work.

### Phase 1: Foundation (Days 1-2)
1.  Create `.ai` directory structure.
2.  Port `.claude/rules/*.md` to `.ai/rules/` (cleaning them up).
3.  Create the `bin/orchestrator` CLI wrapper (Node.js script wrapping existing logic).

### Phase 2: The Architect (Days 3-4)
1.  Create `.ai/roles/architect.md`.
2.  Test the Architect role on a real issue:
    *   Does it find the right Design OS files?
    *   Does it produce a valid `plan.json`?

### Phase 3: The Builder & Verifier (Days 5-7)
1.  Create `.ai/roles/builder.md` and `.ai/roles/qa.md`.
2.  Update the `monitor-agent` (or creating a new `gen2-agent`) to use the new `orchestrator` tool instead of parsing Markdown.

### Phase 4: Deprecation (Day 8+)
1.  Archive `.claude` and `.codex` (or make them symlinks/aliases to `.ai`).
2.  Remove legacy regex-parsing scripts.

## 6. Benefits

| Feature | Generation 1 (Current) | Generation 2 (Proposed) | Generation 3 (Vision) |
| :--- | :--- | :--- | :--- |
| **Robustness** | Low (Regex) | High (JSON/Tools) | High (Self-Healing) |
| **Context** | High (All rules) | Low (Just-in-Time) | Low (Distributed) |
| **Orchestration** | Manual/Scripted | Tool-Driven | Autonomous/Event-Driven |
| **Observability** | Log files | CLI Status | Dashboards/Alerts |

---
**Status**: Proposal Draft
**Next Steps**: Approve Phase 1 (Foundation) to begin scaffolding.
