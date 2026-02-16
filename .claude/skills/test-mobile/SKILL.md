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

## Reference Files

For detailed patterns and examples:
- `../frontend-dev/testing-mobile.md` - Complete test patterns

## Related Skills

- `/frontend-dev` - Mobile development patterns
- `/test-backend` - Backend testing patterns

---

*Skill for mobile testing (Issue #53)*
