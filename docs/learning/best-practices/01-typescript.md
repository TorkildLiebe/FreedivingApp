# TypeScript Best Practices

## 1. Embrace Strict Mode

Our `tsconfig.json` has `"strict": true`. This enables all strict checks. Never disable them.

```jsonc
// These are all enabled by strict: true
"noImplicitAny": true,        // Must declare types, no silent 'any'
"strictNullChecks": true,     // null/undefined must be handled explicitly
"strictFunctionTypes": true,  // Function parameter types checked properly
"strictBindCallApply": true,  // bind/call/apply get correct types
```

**Why it matters:** Strict mode catches ~30% more bugs at compile time. The small upfront cost of typing things properly pays for itself many times over.

## 2. Avoid `any` - Use Proper Types Instead

`any` disables type checking for that value. It defeats the purpose of TypeScript.

```typescript
// BAD - any spreads like a virus
function processData(data: any) {
  return data.name.toUpperCase(); // No error even if data has no 'name'
}

// GOOD - use the actual type
function processData(data: DiveSpot) {
  return data.name.toUpperCase(); // TypeScript knows 'name' exists and is a string
}

// GOOD - if you truly don't know the type, use 'unknown' and narrow
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name.toUpperCase();
  }
  throw new Error('Invalid data');
}
```

### When `any` is acceptable
- Third-party libraries with missing types (rare)
- Temporary during refactoring (add a `// TODO: type this` comment)
- Test mocks where full typing is impractical

Our ESLint config has `@typescript-eslint/no-explicit-any: off` for now, but strive to avoid it.

## 3. Use Utility Types

TypeScript has built-in types that save you from rewriting interfaces.

```typescript
// Partial<T> - makes all properties optional
// Great for update DTOs
type UpdateSpot = Partial<CreateDiveSpotDto>;
// { name?: string; latitude?: number; longitude?: number; ... }

// Pick<T, Keys> - select specific properties
type SpotSummary = Pick<DiveSpot, 'id' | 'name' | 'latitude' | 'longitude'>;

// Omit<T, Keys> - everything except specified properties
type SpotWithoutTimestamps = Omit<DiveSpot, 'createdAt' | 'updatedAt'>;

// Required<T> - makes all properties required (opposite of Partial)
type StrictSpot = Required<DiveSpot>;

// Record<K, V> - dictionary/map type
type SpotIndex = Record<string, DiveSpot>;

// ReturnType<T> - extracts return type of a function
type ServiceResult = ReturnType<typeof diveSpotService.findAll>;

// Readonly<T> - prevents mutation
type ImmutableSpot = Readonly<DiveSpot>;
```

### When to use what

| Situation | Use |
|-----------|-----|
| Update DTO (some fields changeable) | `Partial<CreateDto>` or `Pick<CreateDto, 'name' | 'desc'>` |
| API response (subset of entity) | `Pick<Entity, ...>` or a dedicated response DTO |
| Config objects | `Readonly<Config>` |
| Lookup tables/maps | `Record<string, T>` |

## 4. Discriminated Unions for State

When something can be in different states, use discriminated unions instead of optional fields.

```typescript
// BAD - unclear which fields exist in which state
interface ApiResponse {
  loading?: boolean;
  data?: DiveSpot[];
  error?: string;
}
// Can loading and error both be true? Who knows.

// GOOD - discriminated union, each state is explicit
type ApiResponse =
  | { status: 'loading' }
  | { status: 'success'; data: DiveSpot[] }
  | { status: 'error'; error: string };

// TypeScript narrows the type based on 'status'
function handleResponse(res: ApiResponse) {
  switch (res.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return res.data; // TypeScript knows data exists here
    case 'error':
      return res.error; // TypeScript knows error exists here
  }
}
```

## 5. Null Handling

With `strictNullChecks` enabled, you must handle null/undefined explicitly.

```typescript
// BAD - assumes spot always exists
async function getSpotName(id: string): Promise<string> {
  const spot = await repo.findById(id); // could be null!
  return spot.name; // crash if null
}

// GOOD - handle the null case
async function getSpotName(id: string): Promise<string> {
  const spot = await repo.findById(id);
  if (!spot) {
    throw new NotFoundException(`Spot ${id} not found`);
  }
  return spot.name; // TypeScript knows spot is not null here
}

// Optional chaining - for when null is an acceptable outcome
const displayName = user?.displayName ?? 'Anonymous';

// Nullish coalescing (??) vs OR (||)
const port = config.port ?? 3000;  // GOOD: only falls back if null/undefined
const port = config.port || 3000;  // BAD: also falls back if port is 0 (falsy)
```

## 6. Enums vs Union Types

```typescript
// Enum approach - generates runtime code
enum Role {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// Union type approach - zero runtime cost, just types
type Role = 'user' | 'moderator' | 'admin';

// Const object approach - best of both worlds
const Role = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;
type Role = (typeof Role)[keyof typeof Role]; // 'user' | 'moderator' | 'admin'
```

### Recommendation

- Use **string enums** when the value is used at runtime (DTOs, database fields) and you want reverse lookup
- Use **union types** for simple cases with few values
- Use **const objects** when you need both runtime values and type narrowing

## 7. Type Assertions - Use Sparingly

```typescript
// Type assertion - tells TypeScript "trust me, I know the type"
const element = document.getElementById('app') as HTMLDivElement;

// Non-null assertion - tells TypeScript "this is not null"
const spot = spots.find(s => s.id === id)!; // dangerous if not found

// BETTER - use type guards instead
const spot = spots.find(s => s.id === id);
if (!spot) throw new Error('Not found');
// Now TypeScript knows spot is defined
```

**Rule of thumb:** If you need `as` or `!`, ask yourself if you can restructure to avoid it. Usually you can.

## 8. Interfaces vs Types

```typescript
// Interface - extendable, good for object shapes
interface DiveSpot {
  id: string;
  name: string;
}

// Type - more flexible, good for unions, intersections, utility types
type ApiResult = DiveSpot | Error;
type SpotId = string;
type SpotMap = Record<string, DiveSpot>;
```

### Recommendation for this project
- **Interfaces** for entity shapes, DTOs, service contracts
- **Types** for unions, intersections, mapped types, aliases

## 9. Async/Await Patterns

```typescript
// BAD - fire and forget (errors silently swallowed)
function syncData() {
  fetchSpots(); // Promise returned but not awaited
}

// GOOD - always await or return promises
async function syncData() {
  await fetchSpots();
}

// BAD - sequential when parallel is possible
const spots = await getSpots();
const users = await getUsers();

// GOOD - parallel when operations are independent
const [spots, users] = await Promise.all([getSpots(), getUsers()]);

// GOOD - handle errors with specific types
try {
  await service.createSpot(dto);
} catch (error) {
  if (error instanceof NotFoundException) {
    // handle not found
  }
  throw error; // re-throw unexpected errors
}
```

Our ESLint config warns on `@typescript-eslint/no-floating-promises` to catch forgotten awaits.

## 10. Generics - Practical Patterns

```typescript
// Generic repository pattern (used in our codebase)
class BaseRepository<T> {
  async findById(id: string): Promise<T | null> { /* ... */ }
  async findAll(): Promise<T[]> { /* ... */ }
}

// Generic API response wrapper
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Usage:
type SpotPage = PaginatedResponse<DiveSpot>;
// { data: DiveSpot[]; total: number; page: number; pageSize: number; }

// Generic with constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## Quick Reference: Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `any` | Use the actual type, `unknown`, or a generic |
| Not handling null | Add null checks or use optional chaining |
| `as` casts everywhere | Use type guards and narrowing |
| Duplicate interfaces | Use utility types (Partial, Pick, Omit) |
| `string` for IDs | Consider branded types: `type SpotId = string & { __brand: 'SpotId' }` |
| Forgetting `await` | ESLint catches this with `no-floating-promises` |
| `object` type | Use a specific interface or `Record<string, unknown>` |

## Learn More

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Total TypeScript (Matt Pocock)](https://www.totaltypescript.com/) - Advanced patterns
