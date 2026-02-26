# Quality & Operations (MVP)

Implementation-focused quality attributes, operations, and compliance.

---

## Security

- **Authentication & Authorization:** JWT (bcrypt passwords), RBAC (admin/moderator/user), role + ownership checks on endpoints
- **Input Validation:** class-validator DTOs, domain checks (no emoji in certain fields), prevent injection attacks
- **Communication Security:** HTTPS in production, Authorization headers for JWT
- **Security Testing:** Test auth guards, SQL injection attempts, ownership bypasses in test suite

---

## Error Handling

- **Domain errors:** Clean JSON responses with appropriate HTTP codes (400/403/404/409)
- **Unexpected errors:** Generic 500 response, sanitized error logged (no sensitive data)
- **User-friendly messages:** API returns error codes; client translates to localized messages

---

## Data Integrity

- **Transactions:** Atomic operations for multi-step processes (e.g., report + photo)
- **Validation:** Enforce DOMAIN.md invariants server-side before persistence

---

## Testing

- **Goal:** 80% code coverage for domain and use-case logic
- **Unit tests:** Domain validations, invariants
- **Integration tests:** Endpoints with test database (auth, CRUD, permissions)
- **E2E tests:** Maestro flows on iOS Simulator for critical user paths (app launch, navigation, spot interactions)
- **CI pipeline:** Lint, test, coverage on each commit/PR

---

## Maintainability

- **Code organization:** Feature-based modules (see ARCHITECTURE.md §3)
- **Standards:** TypeScript best practices, ESLint enforced
- **Documentation:** Update docs with code changes (PR checklist)
- **Dev experience:** One-command setup (`pnpm run dev`), hot reload, seed data

---

## Usability

- **Multilingual:** Norwegian (default) + English; user sets preferredLanguage
- **Mobile performance:** Small payloads, thumbnailed images
- **Feedback:** Quick API responses, optimistic UI updates
- **Favorites:** Lightweight, private bookmark mechanism

---

## Performance

- Fast startup (<2s client load)
- Backend API avg <300ms
- Optimize DB queries + caching

---

## Reliability

- >99% uptime target (MVP: 99% acceptable)
- Graceful error handling + retries
- Auto-reconnect for network ops
- Offline: NOT supported in MVP (online-only)

---

## Scalability

- Horizontal scaling via Supabase/Edge Functions
- Stateless services preferred
- Async background jobs for heavy ops

---

## Observability & Logging

- Console logging for events/errors (structured logging future)
- **Never log:** passwords, JWTs, personal data, pre-signed URLs
- Log slow queries; use Postgres EXPLAIN if needed
- Error + performance metrics; basic alerting for failures

---

## Rate Limiting

- Default: 60 requests/minute per IP (adjustable)
- Prevent brute-force, spam, credential stuffing

---

## Compliance (GDPR)

- Minimal data: email for login, alias/avatar only
- Deletion: manual admin deletion (anonymizes contributions)
- Export: not in MVP; structured data enables future export
- Kartverket map tiles attributed in app

---

## Accessibility

- Mobile-only (React Native)
- WCAG AA compliance baseline
- Clear loading + error states

*Last updated: February 2026*
