---
name: security
description: Use to review FreedivingApp changes for security risks including auth, authorization, injection, secrets handling, and sensitive data exposure.
---

# Security

Use when the task involves security review, auth-sensitive behavior, or pre-merge risk checks.

## Load These Sources
- `.claude/skills/security/SKILL.md`
- `.claude/CLAUDE.md`
- `.claude/rules/auth.md`
- `.claude/rules/domain.md`
- `.claude/rules/testing.md`
- `.claude/rules/backend.md`
- `.claude/rules/mobile.md`
- `.mcp.json`

## Operating Workflow
1. Use `.claude/skills/security/SKILL.md` as the canonical checklist.
2. Prefer the `semgrep` and `security-audit` MCP servers when available; fall back to local code inspection otherwise.
3. Review authn/authz, injection, secrets handling, sensitive data exposure, and logging behavior.
4. Apply the backend and mobile rule files based on the surfaces touched by the change.
5. Report concrete vulnerabilities, missing controls, and residual risk clearly.
