---
name: frontend-dev
description: Guides React Native mobile development with Expo Router, MapLibre GL, custom hooks, and feature-based architecture for iOS and Android platforms
---

# Frontend Developer Skill

Guide for developing mobile features in the DiveFreely Expo app following feature-based architecture.

## When to Use This Skill

Use this skill when:
- Creating new screens or components
- Implementing custom hooks for data fetching or state
- Working with MapLibre GL maps
- Handling navigation with Expo Router
- Managing auth context and user state
- Writing mobile tests

## Design OS Integration Workflow

Use this workflow for mobile/UI implementation. `docs/design-os-plan` is the only canonical UI source.

1. Intake files in this order:
   - `docs/design-os-plan/product-overview.md`
   - matching incremental milestone instruction in `docs/design-os-plan/instructions/incremental/`
   - matching section assets in `docs/design-os-plan/sections/<section>/`:
     - `README.md`
     - `tests.md`
     - `components/`
     - `types.ts`
     - screenshot references
   - shell assets from `docs/design-os-plan/shell/` when shell chrome is touched
   - design tokens from `docs/design-os-plan/design-system/` when styling is touched
2. Reuse/adapt finished Design OS section components before introducing custom UI structure.
3. Preserve design tokens, labels, placeholders, and state flow semantics from Design OS files.
4. If divergence is required, document the deviation and the reason in delivery output.

## Feature-Based Architecture

Each feature is self-contained:

```
apps/mobile/src/features/<feature>/
├── screens/
│   ├── <Feature>Screen.tsx           # Main screen component
│   └── <Feature>DetailScreen.tsx     # Detail/sub-screens
├── components/
│   ├── <Feature>List.tsx             # Feature-specific components
│   ├── <Feature>Card.tsx
│   └── <Feature>Form.tsx
├── hooks/
│   ├── use-<feature>.ts              # Data fetching hooks
│   ├── use-<feature>-mutations.ts    # Mutation hooks
│   └── use-<feature>-state.ts        # Local state hooks
├── utils/
│   ├── <feature>-helpers.ts          # Pure functions
│   └── <feature>-validators.ts       # Validation logic
├── types/
│   └── <feature>.types.ts            # Feature-specific types
└── index.ts                          # Public exports
```

### Dependency Rules

**Strict hierarchy - no cross-feature imports:**

```
app/                    # Route files (thin wrappers)
  ↓
src/features/           # Feature modules
  ↓
src/shared/             # Shared types, constants, utilities
  ↓
src/infrastructure/     # API clients, storage, config
```

**Example violations:**
- ❌ `features/map/` imports from `features/auth/`
- ❌ `features/spots/` imports from `features/reports/`
- ✅ Both import from `src/shared/types`
- ✅ Both use `src/infrastructure/api`

## Screen Patterns

### Screen Orchestrator Pattern

Screens orchestrate child components and hooks, minimal logic:

```typescript
// apps/mobile/src/features/map/screens/MapScreen.tsx
import { View, StyleSheet } from 'react-native';
import { MapView } from '../components/MapView';
import { SpotMarkers } from '../components/SpotMarkers';
import { useVisibleSpots } from '../hooks/use-visible-spots';
import { useLocation } from '../hooks/use-location';

export function MapScreen() {
  const { location, error: locationError } = useLocation();
  const { spots, isLoading, error } = useVisibleSpots();

  if (locationError) {
    return <ErrorView message="Location permission required" />;
  }

  return (
    <View style={styles.container}>
      <MapView
        center={location}
        onRegionChange={handleRegionChange}
      >
        <SpotMarkers spots={spots} />
      </MapView>
      {isLoading && <LoadingIndicator />}
      {error && <ErrorBanner message={error.message} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Route File (Thin Wrapper)

```typescript
// apps/mobile/app/(tabs)/map.tsx
import { MapScreen } from '@/src/features/map/screens/MapScreen';

export default function MapRoute() {
  return <MapScreen />;
}
```

## Custom Hook Patterns

### Data Fetching Hook

```typescript
// apps/mobile/src/features/spots/hooks/use-spot.ts
import { useState, useEffect } from 'react';
import { spotsApi } from '@/src/infrastructure/api';
import type { DiveSpot } from '@freediving/shared';

export function useSpot(spotId: string) {
  const [spot, setSpot] = useState<DiveSpot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSpot() {
      try {
        setIsLoading(true);
        const data = await spotsApi.getById(spotId);
        if (!cancelled) {
          setSpot(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSpot();

    return () => {
      cancelled = true;
    };
  }, [spotId]);

  return { spot, isLoading, error };
}
```

### Mutation Hook

```typescript
// apps/mobile/src/features/spots/hooks/use-create-spot.ts
import { useState } from 'react';
import { spotsApi } from '@/src/infrastructure/api';
import type { CreateSpotDto, DiveSpot } from '@freediving/shared';

export function useCreateSpot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function create(dto: CreateSpotDto): Promise<DiveSpot | null> {
    try {
      setIsLoading(true);
      setError(null);
      const spot = await spotsApi.create(dto);
      return spot;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { create, isLoading, error };
}
```

### Hook with Cleanup

```typescript
export function useMapAnimation() {
  const mapRef = useRef<MapLibreGL.MapView>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        mapRef.current?.pause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { mapRef };
}
```

## MapLibre GL Patterns

### Map View Component

```typescript
// apps/mobile/src/features/map/components/MapView.native.tsx
import MapLibreGL from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';

MapLibreGL.setAccessToken(null);

interface MapViewProps {
  center?: [number, number];
  onRegionChange?: (region: Region) => void;
  children?: React.ReactNode;
}

export interface MapViewHandle {
  flyTo: (coords: [number, number]) => void;
  fitBounds: (bounds: BBox) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ center, onRegionChange, children }, ref) => {
    const mapRef = useRef<MapLibreGL.MapView>(null);

    useImperativeHandle(ref, () => ({
      flyTo: (coords) => {
        mapRef.current?.setCamera({
          centerCoordinate: coords,
          animationDuration: 1000,
        });
      },
      fitBounds: (bounds) => {
        mapRef.current?.fitBounds(
          [bounds.minLon, bounds.minLat],
          [bounds.maxLon, bounds.maxLat],
          [50, 50, 50, 50],
          1000,
        );
      },
    }));

    return (
      <MapLibreGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        styleURL="https://cache.kartverket.no/v1/styles/topo/style.json"
        onRegionDidChange={(feature) => {
          onRegionChange?.(feature.geometry.coordinates);
        }}
      >
        <MapLibreGL.Camera
          centerCoordinate={center}
          zoomLevel={12}
        />
        {children}
      </MapLibreGL.MapView>
    );
  },
);
```

### GeoJSON Source & Markers

```typescript
// apps/mobile/src/features/map/components/SpotMarkers.native.tsx
import MapLibreGL from '@maplibre/maplibre-react-native';
import { FeatureCollection } from 'geojson';
import { DiveSpot } from '@freediving/shared';

interface SpotMarkersProps {
  spots: DiveSpot[];
  onSpotPress?: (spotId: string) => void;
}

export function SpotMarkers({ spots, onSpotPress }: SpotMarkersProps) {
  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature',
      id: spot.id,
      geometry: {
        type: 'Point',
        coordinates: [spot.longitude, spot.latitude],
      },
      properties: {
        id: spot.id,
        title: spot.title,
      },
    })),
  };

  return (
    <MapLibreGL.ShapeSource
      id="spots-source"
      shape={geojson}
      onPress={(feature) => {
        const spotId = feature.features[0]?.properties?.id;
        if (spotId) {
          onSpotPress?.(spotId);
        }
      }}
    >
      <MapLibreGL.CircleLayer
        id="spots-layer"
        style={{
          circleRadius: 8,
          circleColor: '#3b82f6',
          circleStrokeWidth: 2,
          circleStrokeColor: '#ffffff',
        }}
      />
    </MapLibreGL.ShapeSource>
  );
}
```

## Navigation Patterns

### Expo Router Navigation

```typescript
// Navigate programmatically
import { router } from 'expo-router';

function onSpotPress(spotId: string) {
  router.push(`/spots/${spotId}`);
}

// Navigate with params
router.push({
  pathname: '/spots/[id]',
  params: { id: spotId },
});

// Go back
router.back();

// Replace (no back)
router.replace('/login');
```

### Route Parameters

```typescript
// apps/mobile/app/spots/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { SpotDetailScreen } from '@/src/features/spots/screens/SpotDetailScreen';

export default function SpotDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpotDetailScreen spotId={id} />;
}
```

## Platform-Specific Code

### File Suffixes

```
MapView.native.tsx      # iOS + Android
MapView.ios.tsx         # iOS only
MapView.android.tsx     # Android only
```

### Runtime Platform Check

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
});

// Platform-specific values
const hitSlop = Platform.select({
  ios: 10,
  android: 15,
});
```

## Auth Context Pattern

```typescript
// apps/mobile/src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/src/infrastructure/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Testing Mobile Code

See the `test-mobile` skill for detailed test patterns.

Quick example:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { SpotCard } from '../SpotCard';

describe('SpotCard', () => {
  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const spot = { id: '1', title: 'Test Spot' };

    const { getByText } = render(
      <SpotCard spot={spot} onPress={onPress} />
    );

    fireEvent.press(getByText('Test Spot'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

## Critical Rules

1. **No cross-feature imports** - Features are independent modules
2. **iOS + Android only** - No web platform code (`.web.tsx` not supported)
3. **Thin route files** - Logic belongs in `src/features/`
4. **Cleanup in useEffect** - Cancel requests, remove listeners
5. **Use .native.tsx** - For platform-specific code (not `.ios.tsx` unless truly iOS-only)
6. **Memoization** - Use `useMemo` / `useCallback` for expensive computations
7. **Test coverage ≥80%** - Write tests for all business logic

## Common Pitfalls

❌ **Cross-feature imports**
```typescript
// BAD
import { useAuth } from '@/src/features/auth';
```

✅ **Use shared context**
```typescript
// GOOD
import { useAuth } from '@/src/shared/contexts/AuthContext';
```

❌ **Logic in route files**
```typescript
// BAD - app/(tabs)/map.tsx
export default function MapRoute() {
  const [spots, setSpots] = useState([]);
  // ... lots of logic
}
```

✅ **Delegate to screen**
```typescript
// GOOD - app/(tabs)/map.tsx
import { MapScreen } from '@/src/features/map';
export default MapScreen;
```

## Reference Files

For detailed patterns and examples:

- `mobile-patterns.md` - Screen orchestrator, custom hooks, MapLibre examples
- `testing-mobile.md` - Component/hook/screen test patterns
- `expo-setup.md` - Router, navigation, platform handling

## Related Skills

- `/test-mobile` - Writing mobile tests
- `/audit-rules` - Validating domain rules in UI
- `/security` - Security best practices for mobile

---

*Skill for DiveFreely mobile development (Issue #53)*
