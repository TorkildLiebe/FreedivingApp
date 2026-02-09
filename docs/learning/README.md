# Learning Guide - Tech Stack

Your personal reference for the FreedivingApp tech stack.

## Contents

| File | Technology | What it does |
|------|-----------|--------------|
| [01-typescript.md](./01-typescript.md) | TypeScript | The language we write code in |
| [02-pnpm.md](./02-pnpm.md) | pnpm | Installs and manages packages |
| [03-nodejs.md](./03-nodejs.md) | Node.js | Runs JavaScript/TypeScript on the server |
| [04-nestjs.md](./04-nestjs.md) | NestJS + Fastify | Backend framework (how we build the API) |
| [05-supabase-postgres.md](./05-supabase-postgres.md) | Supabase + Postgres + PostGIS | Database with geospatial powers |
| [06-prisma.md](./06-prisma.md) | Prisma | Talks to the database from our code |
| [07-react-native-expo.md](./07-react-native-expo.md) | React Native + Expo | Builds the mobile app |
| [08-how-they-connect.md](./08-how-they-connect.md) | The Big Picture | How all the pieces fit together |

## Best Practices

The guides above explain *what* each technology is. The best practices explain *how to use them well*.

See [best-practices/README.md](./best-practices/README.md) for the full index, covering:

| Topic | What you'll learn |
|-------|-------------------|
| TypeScript | Strict types, utility types, null handling, avoiding `any` |
| NestJS | Module design, DI, guards, pipes, exception filters |
| Prisma & Database | Query optimization, indexing, soft deletes, transactions |
| API Design | REST conventions, DTOs, pagination, status codes |
| Testing | Unit vs e2e, mocking, coverage strategy, test data |
| Security | Auth, OWASP top 10, secrets, input validation |
| React Native & Expo | Performance, state management, navigation, styling |
| Git Workflow | Branching, commits, PRs, code review |
| Monorepo | pnpm workspaces, shared code, dependency management |
| Architecture | Vertical slices, SOLID, when to abstract |
| Performance | Query tuning, FlatList, caching, network optimization |
| Error Handling | Domain errors, HTTP mapping, logging, anti-patterns |
