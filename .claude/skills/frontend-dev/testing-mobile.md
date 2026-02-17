# Mobile Testing Patterns

Testing guide for React Native components, hooks, and screens in DiveFreely.

## Component Tests

```typescript
// apps/mobile/src/features/spots/components/__tests__/SpotCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SpotCard } from '../SpotCard';

describe('SpotCard', () => {
  const mockSpot = {
    id: 'spot-123',
    title: 'Test Spot',
    description: 'A test description',
    latitude: 60.0,
    longitude: 10.0,
  };

  it('renders spot title and description', () => {
    const { getByText } = render(<SpotCard spot={mockSpot} />);

    expect(getByText('Test Spot')).toBeTruthy();
    expect(getByText('A test description')).toBeTruthy();
  });

  it('calls onPress with spot id when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SpotCard spot={mockSpot} onPress={onPress} testID="spot-card" />
    );

    fireEvent.press(getByTestId('spot-card'));
    expect(onPress).toHaveBeenCalledWith('spot-123');
  });

  it('does not render description when missing', () => {
    const spotWithoutDesc = { ...mockSpot, description: undefined };
    const { queryByText } = render(<SpotCard spot={spotWithoutDesc} />);

    expect(queryByText('A test description')).toBeNull();
  });
});
```

## Hook Tests

```typescript
// apps/mobile/src/features/spots/hooks/__tests__/use-spot.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSpot } from '../use-spot';
import { spotsApi } from '@/src/infrastructure/api';

jest.mock('@/src/infrastructure/api');

describe('useSpot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches spot on mount', async () => {
    const mockSpot = { id: 'spot-123', title: 'Test Spot' };
    (spotsApi.getById as jest.Mock).mockResolvedValue(mockSpot);

    const { result } = renderHook(() => useSpot('spot-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spot).toEqual(mockSpot);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    const error = new Error('Network error');
    (spotsApi.getById as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useSpot('spot-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spot).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('cancels fetch on unmount', async () => {
    let resolveFetch: any;
    (spotsApi.getById as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useSpot('spot-123'));

    expect(result.current.isLoading).toBe(true);

    unmount();
    resolveFetch({ id: 'spot-123', title: 'Test' });

    // State should not update after unmount
    expect(result.current.isLoading).toBe(true);
  });
});
```

## Screen Tests

```typescript
// apps/mobile/src/features/spots/screens/__tests__/SpotDetailScreen.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { SpotDetailScreen } from '../SpotDetailScreen';
import { useSpot } from '../../hooks/use-spot';

jest.mock('../../hooks/use-spot');
jest.mock('../../components/SpotHeader', () => ({
  SpotHeader: () => 'SpotHeader',
}));
jest.mock('../../components/SpotInfo', () => ({
  SpotInfo: () => 'SpotInfo',
}));

describe('SpotDetailScreen', () => {
  it('shows loading view while fetching', () => {
    (useSpot as jest.Mock).mockReturnValue({
      spot: null,
      isLoading: true,
      error: null,
    });

    const { getByTestId } = render(<SpotDetailScreen spotId="spot-123" />);

    expect(getByTestId('loading-view')).toBeTruthy();
  });

  it('shows error view on fetch error', async () => {
    const error = new Error('Failed to load');
    (useSpot as jest.Mock).mockReturnValue({
      spot: null,
      isLoading: false,
      error,
    });

    const { getByText } = render(<SpotDetailScreen spotId="spot-123" />);

    expect(getByText('Failed to load')).toBeTruthy();
  });

  it('renders spot details when loaded', async () => {
    const mockSpot = {
      id: 'spot-123',
      title: 'Test Spot',
      parkingLocations: [],
    };

    (useSpot as jest.Mock).mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<SpotDetailScreen spotId="spot-123" />);

    expect(getByText('SpotHeader')).toBeTruthy();
    expect(getByText('SpotInfo')).toBeTruthy();
  });
});
```

## Mocking Patterns

### Mock Expo Modules

```typescript
// __mocks__/expo-location.ts
export const requestForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted' })
);

export const watchPositionAsync = jest.fn(() =>
  Promise.resolve({
    remove: jest.fn(),
  })
);

export const Accuracy = {
  Balanced: 3,
  High: 4,
};
```

### Mock MapLibre

```typescript
// __mocks__/@maplibre/maplibre-react-native.tsx
const MapLibreGL = {
  MapView: 'MapView',
  Camera: 'Camera',
  ShapeSource: 'ShapeSource',
  CircleLayer: 'CircleLayer',
  SymbolLayer: 'SymbolLayer',
  setAccessToken: jest.fn(),
};

export default MapLibreGL;
```

### Mock Navigation

```typescript
// __mocks__/expo-router.ts
export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

export const useLocalSearchParams = jest.fn(() => ({ id: 'test-id' }));
export const useRouter = jest.fn(() => router);
```

## Jest Configuration

```typescript
// apps/mobile/jest.config.ts
export default {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

*Reference file for frontend-dev skill*
