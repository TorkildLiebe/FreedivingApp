# Best Practices Guide

Practical guidance for making informed decisions in the FreedivingApp codebase.

> These docs complement the introductory guides in `docs/learning/`. Those explain *what* each technology is. These explain *how to use them well*.

## Contents

| # | File | Topic | Key Decisions |
|---|------|-------|---------------|
| 01 | [typescript.md](./01-typescript.md) | TypeScript | Strict types, utility types, avoiding `any`, error handling |
| 02 | [nestjs.md](./02-nestjs.md) | NestJS Patterns | Module design, DI, guards, interceptors, pipes |
| 03 | [prisma-database.md](./03-prisma-database.md) | Prisma & Database | Query optimization, migrations, indexing, transactions |
| 04 | [api-design.md](./04-api-design.md) | REST API Design | Endpoints, DTOs, pagination, error responses, versioning |
| 05 | [testing.md](./05-testing.md) | Testing Strategy | Unit vs integration vs e2e, mocking, coverage targets |
| 06 | [security.md](./06-security.md) | Security | Auth, validation, CORS, secrets, OWASP top 10 |
| 07 | [react-native-expo.md](./07-react-native-expo.md) | React Native & Expo | Performance, navigation, state, platform code |
| 08 | [git-workflow.md](./08-git-workflow.md) | Git & Collaboration | Branching, commits, PRs, code review |
| 09 | [monorepo.md](./09-monorepo.md) | Monorepo Management | pnpm workspaces, shared code, dependency strategy |
| 10 | [architecture.md](./10-architecture.md) | Architecture & SOLID | Vertical slices, clean architecture, when to abstract |
| 11 | [performance.md](./11-performance.md) | Performance | Backend caching, query tuning, mobile rendering |
| 12 | [error-handling.md](./12-error-handling.md) | Error Handling | Domain errors, HTTP mapping, user-facing messages |

## How to Use These Docs

- **Starting a new feature?** Read [architecture.md](./10-architecture.md) and [api-design.md](./04-api-design.md)
- **Writing tests?** Read [testing.md](./05-testing.md)
- **Worried about security?** Read [security.md](./06-security.md)
- **Performance issues?** Read [performance.md](./11-performance.md)
- **Making a PR?** Read [git-workflow.md](./08-git-workflow.md)
