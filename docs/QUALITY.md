# Quality Requirements (MVP)

Implementation-focused quality attributes for development.

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

- **Goal:** 70% code coverage for domain and use-case logic
- **Unit tests:** Domain validations, invariants
- **Integration tests:** Endpoints with test database (auth, CRUD, permissions)
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
