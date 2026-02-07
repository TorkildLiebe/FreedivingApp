# NONFUNCTIONAL REQUIREMENTS

## Performance
- Fast startup (<2s client load)
- Backend API avg <300ms
- Optimize DB queries + caching

## Reliability
- >99% uptime target
- Graceful error handling + retries
- Auto-reconnect for network ops

## Scalability
- Horizontal scaling via Supabase/Edge Functions
- Stateless services preferred
- Async background jobs for heavy ops

## Security
- JWT auth + row-level security
- Use HTTPS everywhere
- Sanitize user input
- Secure storage for secrets

## Maintainability
- Modular, typed codebase
- Clear folder structure per domain
- Automated tests (unit + integration)
- Linting + formatting enforced

## Observability
- Centralized logging
- Error + performance metrics
- Basic alerting for failures

## UX / Accessibility
- Mobile-only (React Native)
- WCAG AA compliance baseline
- Clear loading + error states
