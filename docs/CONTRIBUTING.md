# CONTRIBUTING

## Workflow
- **Branches:**
  - `main`: stable
  - `feat/<scope>`, `fix/<scope>`, `chore/<scope>`
- **Commits:**  
  - Conventional: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`  
  - Example: `feat#(issueNumber): add JWT refresh tokens`

## Pull Requests
- Link related issue/use case  
- Ensure lint + tests pass  
- Keep diffs small and focused  
- Checklist: ✅ build ✅ review ✅ docs

## Code
- Follow domain + architecture structure  
- Strong typing, modular design  
- Avoid side effects  
- Tests required for logic changes

## Docs
- Update `/docs` on changes  
- Keep models and diagrams synced

## AI Agents
- May scaffold, refactor, test  
- Must follow repo conventions  
- Human review required pre-merge

## Environment
- Match Node, pnpm, Supabase versions  
- Run `pnpm dev` for full stack  
- Lint + test before push