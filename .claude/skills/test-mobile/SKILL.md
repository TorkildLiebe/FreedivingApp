---
name: test-mobile
description: Generates comprehensive Jest tests for React Native components, screens, hooks, and custom logic in the DiveFreely mobile app
---

# Mobile Test Writer Skill

Generates tests for React Native components, hooks, and screens in the DiveFreely Expo app.

## When to Use This Skill

Use this skill to:
- Write tests for new components or screens
- Add test coverage for hooks
- Generate mocks for Expo modules and MapLibre
- Achieve ≥80% test coverage

## Design Fidelity Test Requirements

For mobile/UI changes, use `docs/design-os-plan` as the design source.

1. Pull behavior test cases from `docs/design-os-plan/sections/<section>/tests.md`.
2. Add assertions for UX copy and state transitions that are explicitly specified in Design OS docs.
3. Keep tests aligned with Design OS callbacks, labels, and empty/loading/error state expectations.
4. Run screenshot-based visual verification for changed UI states and compare against section screenshot references.
5. Document any approved visual mismatches and why they are acceptable.

## Orchestration Runtime Evidence Requirements

For vertical-slice orchestration runs:

1. Run mobile auth preflight before runtime verification:
   - `pnpm orchestrator:mobile-auth-check`
2. For deterministic M2 map/spots evidence capture when applicable, run:
   - `pnpm orchestrator:capture-ios-m2-core -- --run-id <run-id> --issue-number <n> [--device "<name>"]`
3. Ensure report output includes these UI evidence labels:
   - `Design OS assets used:`
   - `Component mapping:`
   - `Design parity evidence:`
   - `Approved deviations:`
4. Enforce strict UI PASS semantics:
   - `MOBILE_UI_TOUCHED: true` requires `IOS_VERIFIED: true`
   - `MOBILE_UI_TOUCHED: false` requires `IOS_VERIFIED: false`
   - `VERIFICATION: FAIL` cannot be paired with `RESULT: PASS`

## Test Types

### Component Tests

Test rendering, props, and user interactions:

```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('SpotCard', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestID } = render(<SpotCard onPress={onPress} />);

    fireEvent.press(getByTestID('spot-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Hook Tests

Test custom hooks with `renderHook`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';

describe('useSpot', () => {
  it('fetches spot on mount', async () => {
    const { result } = renderHook(() => useSpot('spot-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spot).toBeDefined();
  });
});
```

### Screen Tests

Test screen orchestration by mocking child components and hooks:

```typescript
jest.mock('../../hooks/use-spot');
jest.mock('../../components/SpotHeader', () => ({
  SpotHeader: () => 'SpotHeader',
}));

describe('SpotDetailScreen', () => {
  it('renders spot details when loaded', () => {
    (useSpot as jest.Mock).mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<SpotDetailScreen spotId="123" />);
    expect(getByText('SpotHeader')).toBeTruthy();
  });
});
```

## Common Mocks

### Mock Expo Location

```typescript
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  watchPositionAsync: jest.fn(() =>
    Promise.resolve({ remove: jest.fn() })
  ),
  Accuracy: { Balanced: 3 },
}));
```

### Mock MapLibre

```typescript
jest.mock('@maplibre/maplibre-react-native', () => ({
  MapView: 'MapView',
  Camera: 'Camera',
  ShapeSource: 'ShapeSource',
  CircleLayer: 'CircleLayer',
  setAccessToken: jest.fn(),
}));
```

### Mock Navigation

```typescript
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: 'test-id' })),
}));
```

### Mock API Client

```typescript
jest.mock('@/src/infrastructure/api', () => ({
  spotsApi: {
    getById: jest.fn(),
    getByBounds: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
```

## Test Structure

```
src/features/<feature>/
├── components/
│   ├── Component.tsx
│   └── __tests__/
│       └── Component.test.tsx
├── hooks/
│   ├── use-hook.ts
│   └── __tests__/
│       └── use-hook.test.ts
├── screens/
│   ├── Screen.tsx
│   └── __tests__/
│       └── Screen.test.tsx
└── __tests__/
    └── fixtures/
        └── mock-data.ts
```

## Coverage Target

Aim for ≥80% coverage:

```bash
pnpm test:mobile --coverage

# View HTML report
open apps/mobile/coverage/lcov-report/index.html
```

Focus on:
- Custom hooks (≥90%)
- Business logic in screens
- User interaction flows
- Error handling

## Quick Tips

1. **Mock child components** to isolate screen logic
2. **Use test fixtures** for consistent mock data
3. **Test user flows** not implementation details
4. **Mock native modules** (Location, Camera, etc.)
5. **Cleanup in afterEach** - clear all mocks

## E2E Testing (Maestro)

Maestro YAML flows run on a real iOS Simulator to test user interactions end-to-end. They complement Jest unit tests — use both layers together.

### When to Generate E2E Flows

- **New screen or major feature** → add a happy-path E2E flow
- **New multi-step interaction** (e.g., create spot, submit dive log) → add a full-sequence flow
- **Bug fix involving navigation or component integration** → add a regression flow
- **Tab or navigation structure changes** → update smoke flows in `smoke/`

Do NOT write E2E flows for:
- Pure logic changes in hooks/utilities (covered by Jest)
- Styling-only changes with no interaction changes
- Backend-only changes

### Flow Location

```
apps/mobile/.maestro/flows/
├── smoke/          # Critical path (always pass, no backend dependency)
├── map/            # Map feature flows
├── auth/           # Authentication flows
└── helpers/        # Reusable sub-flows (login, dismiss permissions)
```

### Flow Writing Conventions

**Critical patterns** (syntax errors otherwise):

- Start every flow with `stopApp` + `launchApp` for clean state between batch runs
- Use `id` selector for testIDs (maps to React Native `testID`)
- Use `extendedWaitUntil` for async waits — NOT `assertVisible` with timeout (`assertVisible` has no timeout parameter)
- Use `eraseText` to clear input — NOT `clearText` (invalid command)
- Use `assertVisible` only for elements expected to already be present (no timeout)
- Keep flows under 50 steps; use `runFlow` for sub-flows
- Tag backend-dependent flows with `requires-backend`

### Example Flow Template

```yaml
appId: com.anonymous.mobile
name: Feature Happy Path
tags:
  - feature-name
---
- stopApp

- launchApp:
    clearState: false

# Dismiss any OS permission dialogs
- runFlow:
    when:
      visible: "Allow While Using App"
    commands:
      - tapOn: "Allow While Using App"

# Wait for app to load
- extendedWaitUntil:
    visible:
      id: "map-search-input"
    timeout: 15000

# Test interaction
- tapOn:
    id: "target-element-id"

# Verify result
- assertVisible:
    id: "expected-element-id"
```

### Running E2E Tests

```bash
# Smoke tests only (~21s)
pnpm test:e2e:mobile:smoke

# Full suite (~62s)
pnpm test:e2e:mobile

# Feature-specific
pnpm test:e2e:mobile:map
pnpm test:e2e:mobile:auth
```

### Relationship to Unit Tests

| Concern | Jest + RNTL | Maestro E2E |
|---------|------------|-------------|
| Component logic | Primary | - |
| Hook behavior | Primary | - |
| State management | Primary | - |
| Navigation flows | - | Primary |
| Real device rendering | - | Primary |
| Cross-component integration | Secondary | Primary |
| Error handling edge cases | Primary | - |
| Permission dialogs | - | Primary |

Both layers are mandatory for new features. E2E catches integration and navigation bugs that unit tests miss. Unit tests catch logic edge cases that E2E is too slow to cover.

## Reference Files

For detailed patterns and examples:
- `../frontend-dev/testing-mobile.md` - Complete test patterns

## Related Skills

- `/frontend-dev` - Mobile development patterns
- `/test-backend` - Backend testing patterns

---

*Skill for mobile testing (Issue #53)*
