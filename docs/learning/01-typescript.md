# TypeScript

## What is it?

TypeScript is **JavaScript with types**. That's really it.

JavaScript is the language that runs in browsers and on servers. It's flexible but *too* flexible - you can accidentally pass a number where a string is expected, and you won't find out until the app crashes. TypeScript fixes this by letting you declare what *type* of data things are.

Think of it like this: JavaScript is writing a recipe that says "add some stuff to the bowl." TypeScript is writing a recipe that says "add **2 cups of flour** to the bowl." Both work, but the second one catches mistakes before you ruin the cake.

## Why do we use it?

- **Catches bugs early**: The editor shows errors *before* you run the code
- **Better autocomplete**: Your editor knows what methods/properties exist on things
- **Self-documenting**: Reading types tells you what a function expects and returns
- **Industry standard**: Almost every serious JS project uses TypeScript now

## Core Concepts

### 1. Basic Types

```typescript
// Primitive types
let name: string = "Torkild";
let age: number = 28;
let isDiver: boolean = true;

// Arrays
let scores: number[] = [10, 20, 30];

// "I don't know yet" (avoid if possible)
let mystery: any = "could be anything";
```

### 2. Interfaces and Types

An interface describes the *shape* of an object. Think of it as a blueprint.

```typescript
// This says: "A DiveSpot MUST have these fields, with these types"
interface DiveSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  depth?: number; // The ? means "optional" - it can be missing
}

// Now TypeScript enforces the shape:
const spot: DiveSpot = {
  id: "abc-123",
  name: "Blue Hole",
  latitude: 27.45,
  longitude: 33.95,
  // depth is optional, so we can skip it
};

// This would show a red error in your editor:
// spot.naem  <-- typo caught instantly!
```

### 3. Functions with Types

```typescript
// Without TypeScript: what does this return? What does `depth` expect?
function formatDepth(depth) {
  return depth + "m";
}

// With TypeScript: crystal clear
function formatDepth(depth: number): string {
  return depth + "m";
}

// Arrow function version (same thing, shorter syntax)
const formatDepth = (depth: number): string => depth + "m";
```

### 4. Enums

A fixed set of named values.

```typescript
enum DiveType {
  CONSTANT_WEIGHT = "CWT",
  FREE_IMMERSION = "FIM",
  NO_FINS = "CNF",
}

// Usage:
const myDive = DiveType.CONSTANT_WEIGHT; // "CWT"
```

### 5. Generics

"A type that works with *any* type." Sounds abstract - here's a real example:

```typescript
// This function works with ANY type of array
function getFirst<T>(items: T[]): T {
  return items[0];
}

getFirst<string>(["a", "b", "c"]); // returns "a" (string)
getFirst<number>([1, 2, 3]);       // returns 1 (number)
```

You'll see generics everywhere in NestJS and Prisma. Don't panic - just think of `<T>` as "some type we'll fill in later."

## The tsconfig.json File

Every TypeScript project has a `tsconfig.json` at its root. It tells the TypeScript compiler *how* to behave.

```jsonc
{
  "compilerOptions": {
    "target": "ES2021",        // What version of JS to output
    "module": "commonjs",      // How modules are imported/exported
    "strict": true,            // Enable all strict checks (KEEP THIS ON)
    "esModuleInterop": true,   // Makes imports work more naturally
    "outDir": "./dist",        // Where compiled JS files go
    "sourceMap": true          // Maps compiled JS back to TS for debugging
  },
  "include": ["src/**/*"],     // Which files to compile
  "exclude": ["node_modules"]  // Which files to skip
}
```

You rarely touch this file - it's usually set up once.

## Day-to-Day Usage

You almost never run the TypeScript compiler (`tsc`) manually. Instead:
- **NestJS** compiles it for you when you run `pnpm start:dev`
- **Expo** compiles it when you run `npx expo start`
- **Your editor** (VS Code) checks types in real-time as you type

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `Type 'string' is not assignable to type 'number'` | You're passing the wrong type. Check your variable. |
| `Property 'x' does not exist on type 'Y'` | Typo in property name, or you need to update the interface. |
| `Object is possibly 'undefined'` | Add a check: `if (thing) { ... }` or use `thing!` if you're sure it exists. |
| `any` showing up everywhere | You forgot to add types. Add them! |

## Learn More

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) - Official docs, very well written
- [TypeScript Playground](https://www.typescriptlang.org/play) - Try TypeScript in the browser
