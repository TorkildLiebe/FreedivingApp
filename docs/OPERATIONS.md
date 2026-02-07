# Operations & Compliance (MVP)

Runtime operations, logging, monitoring, and compliance notes.

---

## Logging

- **Current:** Console logging for events/errors
- **Never log:** Passwords, JWTs, personal data, pre-signed URLs
- **Future:** Structured logging library (info/warn/error levels), monitoring service integration

---

## Monitoring

- **Performance:** Log slow query execution times, use Postgres EXPLAIN if needed
- **Crashes:** Log stack traces (sanitize user input)
- **Future:** Instrumentation for performance monitoring in production

---

## Availability

- **MVP:** 99% uptime acceptable (local/pilot deployment)
- **Production:** Auto-restart on crash (PM2/container orchestrator)
- **Offline:** NOT supported in MVP (online-only)

---

## Rate Limiting

- **Default:** 60 requests/minute per IP (adjustable)
- **Purpose:** Prevent brute-force, spam, credential stuffing

---

## Backup & Recovery

- **Development:** Periodic manual backups before major changes
- **Production:** Managed Postgres backups
- **Recovery:** Migrations + seed data for DB reconstruction

---

## Compliance

### GDPR / Data Protection
- **Minimal data:** Email for login, alias/avatar only
- **Deletion:** Manual admin deletion (anonymizes contributions)
- **Export:** Not in MVP; structured data enables future export

### Open Data Attribution
- **Kartverket:** Map tiles attributed in app
- **External APIs:** Government/open data sources only
