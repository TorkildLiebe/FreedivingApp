# React Native & Expo Best Practices

## 1. Project Structure

### File-based routing with Expo Router

```
app/
  _layout.tsx              # Root layout (auth provider, navigation container)
  (tabs)/
    _layout.tsx            # Tab navigator layout
    index.tsx              # Home tab
    explore.tsx            # Explore tab
    profile.tsx            # Profile tab
  (auth)/
    _layout.tsx            # Auth stack layout
    login.tsx              # Login screen
    signup.tsx             # Signup screen
  dive-spots/
    [id].tsx               # Dynamic route: /dive-spots/abc123
    create.tsx             # /dive-spots/create
  +not-found.tsx           # 404 page
```

### Feature-based folder structure (outside routing)

```
src/
  components/
    ui/                    # Generic reusable components
      Button.tsx
      Card.tsx
      TextInput.tsx
    dive-spot/             # Feature-specific components
      SpotCard.tsx
      SpotMap.tsx
  hooks/
    useAuth.ts
    useDiveSpots.ts
  services/
    api.ts                 # Backend API client
    supabase.ts            # Supabase client
  contexts/
    auth-context.tsx       # Auth state provider
  utils/
    formatters.ts
    validators.ts
  types/
    index.ts               # Shared types
```

## 2. Component Patterns

### Functional components only (no class components)

```typescript
// GOOD - functional component
export function SpotCard({ spot }: { spot: DiveSpot }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{spot.name}</Text>
      <Text style={styles.subtitle}>{spot.description}</Text>
    </View>
  );
}

// BAD - class component (outdated pattern)
class SpotCard extends React.Component { ... }
```

### Props typing

```typescript
// Define props interface
interface SpotCardProps {
  spot: DiveSpot;
  onPress: (id: string) => void;
  showDistance?: boolean; // optional prop with default
}

export function SpotCard({ spot, onPress, showDistance = false }: SpotCardProps) {
  return (
    <Pressable onPress={() => onPress(spot.id)}>
      <Text>{spot.name}</Text>
      {showDistance && <Text>{spot.distance}m away</Text>}
    </Pressable>
  );
}
```

### Keep components small
If a component exceeds ~100 lines, split it into smaller components.

```typescript
// BAD - giant component doing everything
function DiveSpotScreen() {
  // 200 lines of hooks, handlers, conditional rendering...
}

// GOOD - composed from smaller components
function DiveSpotScreen() {
  const { spot, loading, error } = useDiveSpot(id);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!spot) return <NotFound />;

  return (
    <ScrollView>
      <SpotHeader spot={spot} />
      <SpotPhotos photos={spot.photos} />
      <SpotDetails spot={spot} />
      <SpotReports reports={spot.reports} />
    </ScrollView>
  );
}
```

## 3. State Management

### Local state (useState) - component-level UI state

```typescript
// Toggle, form inputs, UI flags
const [isExpanded, setIsExpanded] = useState(false);
const [searchText, setSearchText] = useState('');
```

### Server state (TanStack Query / React Query) - data from API

```typescript
// Fetching data with caching, refetching, loading states
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch dive spots
function useDiveSpots() {
  return useQuery({
    queryKey: ['dive-spots'],
    queryFn: () => api.getDiveSpots(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

// Fetch single spot
function useDiveSpot(id: string) {
  return useQuery({
    queryKey: ['dive-spots', id],
    queryFn: () => api.getDiveSpot(id),
    enabled: !!id, // Don't fetch if id is empty
  });
}

// Create spot mutation
function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDiveSpotDto) => api.createDiveSpot(dto),
    onSuccess: () => {
      // Invalidate and refetch the spots list
      queryClient.invalidateQueries({ queryKey: ['dive-spots'] });
    },
  });
}

// Usage in component
function CreateSpotScreen() {
  const { mutate: createSpot, isPending } = useCreateSpot();

  const handleSubmit = () => {
    createSpot(formData, {
      onSuccess: () => router.back(),
      onError: (error) => Alert.alert('Error', error.message),
    });
  };
}
```

### Global client state (Zustand) - app-wide UI state

```typescript
// For state that multiple components need but isn't from the server
import { create } from 'zustand';

interface AppState {
  selectedSpotId: string | null;
  mapCenter: { lat: number; lng: number };
  setSelectedSpot: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSpotId: null,
  mapCenter: { lat: 60.39, lng: 5.32 },
  setSelectedSpot: (id) => set({ selectedSpotId: id }),
  setMapCenter: (center) => set({ mapCenter: center }),
}));

// Usage
function MapScreen() {
  const { mapCenter, setMapCenter } = useAppStore();
}
```

### When to use what

| State Type | Tool | Example |
|------------|------|---------|
| Form input | `useState` | Text input value, checkbox |
| UI toggle | `useState` | Modal open/close, accordion |
| Server data | TanStack Query | Dive spots, user profile |
| Auth state | Context | Current user, token |
| Cross-screen UI state | Zustand | Selected map pin, filters |

## 4. Performance

### FlatList for long lists (never ScrollView)

```typescript
// BAD - renders ALL items at once
<ScrollView>
  {spots.map(spot => <SpotCard key={spot.id} spot={spot} />)}
</ScrollView>

// GOOD - virtualizes, only renders visible items
<FlatList
  data={spots}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <SpotCard spot={item} />}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Memoize expensive components

```typescript
// Prevent re-renders when parent re-renders but props haven't changed
const SpotCard = React.memo(function SpotCard({ spot }: SpotCardProps) {
  return (
    <View>
      <Text>{spot.name}</Text>
    </View>
  );
});

// Memoize callbacks passed to child components
function SpotList() {
  const handlePress = useCallback((id: string) => {
    router.push(`/dive-spots/${id}`);
  }, []);

  return <FlatList renderItem={({ item }) => <SpotCard spot={item} onPress={handlePress} />} />;
}
```

### When to memoize
- `React.memo`: Components in FlatList, components with heavy render, components that receive callbacks
- `useCallback`: Callbacks passed to memoized children, callbacks used in dependency arrays
- `useMemo`: Expensive computations, derived data from props

### When NOT to memoize
- Simple components that render fast anyway
- Components that always re-render with new props
- Premature optimization (profile first, optimize second)

### Avoid anonymous functions in render

```typescript
// BAD - creates new function every render, breaks memoization
<Pressable onPress={() => handlePress(spot.id)}>

// GOOD - stable reference
const handlePress = useCallback(() => {
  router.push(`/dive-spots/${spot.id}`);
}, [spot.id]);

<Pressable onPress={handlePress}>
```

## 5. Styling

### Use StyleSheet.create (not inline styles)

```typescript
// GOOD - styles are created once, memoized
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

// BAD - creates new style object every render
<View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
```

### Design tokens / theme constants

```typescript
// constants/theme.ts
export const Colors = {
  primary: '#0066CC',
  secondary: '#4A90D9',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#666666',
  error: '#DC3545',
  success: '#28A745',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FontSize = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
} as const;

// Usage
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: FontSize.xl,
    color: Colors.text,
  },
});
```

## 6. Navigation (Expo Router)

### Type-safe navigation

```typescript
// With Expo Router's typed routes (enabled in app.json)
import { router } from 'expo-router';

// Navigate to a screen
router.push('/dive-spots/abc123');

// Navigate with params
router.push({
  pathname: '/dive-spots/[id]',
  params: { id: 'abc123' },
});

// Go back
router.back();

// Replace current screen (no back button)
router.replace('/login');
```

### Screen params

```typescript
// In dive-spots/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function DiveSpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: spot, isLoading } = useDiveSpot(id);
  // ...
}
```

### Navigation guards (auth redirect)

```typescript
// In _layout.tsx
import { Redirect } from 'expo-router';

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;
  if (!user) return <Redirect href="/login" />;

  return <Stack />;
}
```

## 7. API Communication

### Centralized API client

```typescript
// services/api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.message);
  }

  return response.json();
}

// Typed API methods
export const api = {
  getDiveSpots: () => fetchApi<DiveSpot[]>('/dive-spots'),
  getDiveSpot: (id: string) => fetchApi<DiveSpot>(`/dive-spots/${id}`),
  createDiveSpot: (dto: CreateDiveSpotDto) =>
    fetchApi<DiveSpot>('/dive-spots', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
```

## 8. Error Handling in React Native

### Error boundaries for crashes

```typescript
// components/ErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.container}>
      <Text>Something went wrong</Text>
      <Text style={styles.error}>{error.message}</Text>
      <Button title="Try Again" onPress={resetErrorBoundary} />
    </View>
  );
}

// Wrap screens or the entire app
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Loading/error states pattern

```typescript
function DiveSpotScreen() {
  const { data, isLoading, error, refetch } = useDiveSpot(id);

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return (
      <View>
        <Text>Failed to load spot</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  // data is guaranteed to exist here
  return <SpotDetails spot={data} />;
}
```

## 9. Platform-Specific Code

### When behavior differs between iOS and Android

```typescript
import { Platform } from 'react-native';

// Inline platform check
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
});

// Platform-specific files (Expo/RN auto-resolves)
// MapView.ios.tsx    - iOS implementation
// MapView.android.tsx - Android implementation
// Import as: import MapView from './MapView'; // auto-resolves
```

## 10. Common Mistakes

| Mistake | Fix |
|---------|-----|
| ScrollView for long lists | Use FlatList |
| Inline styles | Use StyleSheet.create |
| console.log in production | Use a proper logging library or remove |
| Storing tokens in AsyncStorage unencrypted | Use expo-secure-store for sensitive data |
| Not handling loading/error states | Always show loading spinner and error UI |
| Hardcoded colors/spacing | Use theme constants |
| Not testing on both platforms | Test on iOS and Android regularly |
| Giant components (200+ lines) | Split into smaller, focused components |
| Fetching in useEffect | Use TanStack Query for server state |

## Learn More

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Documentation](https://docs.expo.dev/)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
