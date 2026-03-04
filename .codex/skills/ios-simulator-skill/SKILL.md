---
name: ios-simulator-skill
description: Use for iOS simulator app testing, build automation, semantic navigation, and screenshot-based runtime verification in FreedivingApp.
---

# iOS Simulator Skill

Use when mobile verification requires simulator control, runtime interaction, or screenshot evidence.

## Load These Sources
- `.claude/skills/ios-simulator-skill/SKILL.md`
- `.claude/skills/ios-simulator-skill/scripts/`
- `.claude/rules/mobile.md`
- `.claude/rules/testing.md`
- `.mcp.json`

## Operating Workflow
1. Prefer the `ios-simulator` MCP server for runtime UI interaction, screenshots, and device control.
2. Use `.claude/skills/ios-simulator-skill/SKILL.md` as the canonical fallback workflow when the MCP server is unavailable or insufficient.
3. Run the helpers in `.claude/skills/ios-simulator-skill/scripts/` in place; do not copy them into `.codex`.
4. Use semantic, accessibility-driven navigation instead of coordinate-based interaction.
5. Capture screenshots for UI verification and report simulator state plus any environment limitations.
