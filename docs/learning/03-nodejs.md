# Node.js

## What is it?

JavaScript was originally built to run *only* inside web browsers (Chrome, Firefox, etc.). **Node.js** took JavaScript out of the browser and made it possible to run it as a standalone program on any computer.

This means you can use the same language (JavaScript/TypeScript) for:
- The **frontend** (what users see - the mobile app)
- The **backend** (the server that handles data, logic, and the database)

Node.js is a **runtime** - it's the engine that reads and executes your JavaScript/TypeScript code on a server.

## Why Node.js?

- **One language everywhere**: TypeScript for backend AND frontend
- **Huge ecosystem**: Millions of packages on npm
- **Fast for I/O**: Great at handling many simultaneous requests (perfect for APIs)
- **Industry standard**: Used by Netflix, PayPal, LinkedIn, Uber

## Core Concepts

### 1. The Event Loop (How Node Handles Work)

This is the single most important concept in Node.js.

Node.js is **single-threaded** - it has one worker. But it handles thousands of requests at once. How?

**Analogy: The Restaurant Waiter**

Imagine a restaurant with ONE waiter (Node.js):
1. Waiter takes order from Table 1 -> sends to kitchen
2. **Instead of standing at the kitchen waiting**, the waiter goes to Table 2
3. Takes order from Table 2 -> sends to kitchen
4. Kitchen bell rings for Table 1 -> waiter delivers food
5. Takes order from Table 3 -> sends to kitchen
6. Kitchen bell rings for Table 2 -> waiter delivers food

The waiter never *waits*. While the kitchen (database, file system, network) is working, the waiter serves other tables.

This is why Node uses `async/await`:

```typescript
// BAD: This would block the waiter (synchronous)
const data = readFileSync("big-file.txt"); // Waiter stands and waits
console.log(data);

// GOOD: This lets the waiter serve others while waiting (asynchronous)
const data = await readFile("big-file.txt"); // Waiter goes to next table
console.log(data); // Comes back when the file is ready
```

### 2. async/await

Any operation that takes time (database queries, file reads, API calls) is **asynchronous**. You handle this with `async/await`:

```typescript
// Mark the function as "async" - it will do async work
async function getDiveSpot(id: string): Promise<DiveSpot> {
  // "await" pauses THIS function (not the whole server!) until the result is ready
  const spot = await prisma.diveSpot.findUnique({ where: { id } });
  return spot;
}
```

Key rules:
- `await` can only be used inside `async` functions
- `async` functions always return a `Promise`
- Forgetting `await` is a **very common bug** - the code continues without waiting for the result

### 3. Modules (import/export)

Node.js organizes code into **modules** - each file is a module.

```typescript
// dive-spot.service.ts - EXPORTS functionality
export class DiveSpotService {
  async findAll() { /* ... */ }
}

// dive-spot.controller.ts - IMPORTS functionality
import { DiveSpotService } from "./dive-spot.service";
```

### 4. Environment Variables

Sensitive config (database passwords, API keys) is stored in **environment variables**, not in code. These are loaded from a `.env` file:

```bash
# .env file (NEVER commit this to git!)
DATABASE_URL="postgresql://user:pass@localhost:5432/freediving"
JWT_SECRET="super-secret-key-123"
```

```typescript
// Access in code:
const dbUrl = process.env.DATABASE_URL;
```

## What You Actually Run

In our project, you rarely interact with Node.js directly. Instead:

```bash
# Start the backend in development mode (NestJS uses Node.js under the hood)
pnpm start:dev

# The compiled output (what Node actually runs) goes to dist/
pnpm build    # Compiles TypeScript -> JavaScript in dist/
node dist/main.js   # This is what happens in production (you won't run this locally)
```

## Node.js Version

We use a specific Node.js version. Check it with:
```bash
node --version   # Should show v20.x.x or v22.x.x
```

If you need to switch versions, use a version manager like `nvm`:
```bash
nvm install 20
nvm use 20
```

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `UnhandledPromiseRejection` | You forgot `await` or didn't catch an error in an async function |
| `Cannot find module 'x'` | Run `pnpm install` - the dependency isn't installed |
| `EADDRINUSE: address already in use` | Another process is using that port. Kill it: `lsof -i :3000` then `kill <PID>` |
| `.env` not loading | Make sure you have `dotenv` configured or NestJS ConfigModule set up |
