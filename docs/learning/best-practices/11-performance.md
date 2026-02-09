# Performance Best Practices

## 1. Backend Performance

### Database query optimization

```typescript
// 1. Select only needed fields
// BAD - fetches everything
const spots = await prisma.diveSpot.findMany();

// GOOD - fetches only what the API returns
const spots = await prisma.diveSpot.findMany({
  select: { id: true, name: true, latitude: true, longitude: true },
  where: { isDeleted: false },
});

// 2. Always paginate
// BAD - returns all records
async findAll() {
  return this.prisma.diveSpot.findMany({ where: { isDeleted: false } });
}

// GOOD - paginated
async findAll(page: number, limit: number) {
  return this.prisma.diveSpot.findMany({
    where: { isDeleted: false },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { createdAt: 'desc' },
  });
}

// 3. Avoid N+1 queries
// BAD - 1 + N queries
const spots = await prisma.diveSpot.findMany();
for (const spot of spots) {
  spot.photos = await prisma.photo.findMany({ where: { spotId: spot.id } });
}

// GOOD - 1 query with include
const spots = await prisma.diveSpot.findMany({
  include: { photos: true },
});

// GOOD - 2 queries with batching
const spots = await prisma.diveSpot.findMany();
const photos = await prisma.photo.findMany({
  where: { spotId: { in: spots.map(s => s.id) } },
});
```

### Indexing (most impactful optimization)

```prisma
model DiveSpot {
  // Index foreign keys
  @@index([createdById])

  // Index fields used in WHERE clauses
  @@index([isDeleted])

  // Compound index for common query patterns
  @@index([isDeleted, createdAt])

  // Unique index for business constraints
  @@unique([latitude, longitude])
}
```

Signs you need an index:
- Query takes >100ms on a table with 1000+ rows
- You filter, sort, or join on a column frequently
- `EXPLAIN ANALYZE` shows "Seq Scan" on a large table

### Connection pooling

Prisma manages a connection pool by default. For production:

```
# In DATABASE_URL
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30
```

### Response compression

```typescript
// Fastify compression (reduces bandwidth)
import compress from '@fastify/compress';

const app = await NestFactory.create(AppModule, new FastifyAdapter());
await app.register(compress, { encodings: ['gzip', 'deflate'] });
```

### Parallel independent operations

```typescript
// BAD - sequential (total time = sum of all operations)
const spots = await this.spotRepo.findAll();
const user = await this.userRepo.findById(userId);
const stats = await this.statsService.getDashboard();

// GOOD - parallel (total time = slowest operation)
const [spots, user, stats] = await Promise.all([
  this.spotRepo.findAll(),
  this.userRepo.findById(userId),
  this.statsService.getDashboard(),
]);
```

## 2. Mobile Performance

### FlatList optimization (critical for lists)

```typescript
// Optimized FlatList
<FlatList
  data={spots}
  keyExtractor={(item) => item.id}
  renderItem={renderSpotCard}
  // Performance props:
  initialNumToRender={10}        // Render 10 items initially
  maxToRenderPerBatch={10}       // Render 10 items per batch
  windowSize={5}                 // Keep 5 screens of content in memory
  removeClippedSubviews={true}   // Unmount offscreen items (Android)
  getItemLayout={(_, index) => ({ // If items are fixed height
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// Memoize renderItem to prevent re-renders
const renderSpotCard = useCallback(
  ({ item }: { item: DiveSpot }) => <SpotCard spot={item} onPress={handlePress} />,
  [handlePress],
);
```

### Prevent unnecessary re-renders

```typescript
// 1. React.memo for pure display components
const SpotCard = React.memo(function SpotCard({ spot }: Props) {
  return <View><Text>{spot.name}</Text></View>;
});

// 2. useCallback for handlers passed to children
const handlePress = useCallback((id: string) => {
  router.push(`/spots/${id}`);
}, []);

// 3. useMemo for derived data
const sortedSpots = useMemo(
  () => spots.sort((a, b) => a.distance - b.distance),
  [spots],
);

// 4. Avoid creating objects/arrays in render
// BAD - new style object every render
<View style={{ padding: 16, margin: 8 }}>

// GOOD - style created once
<View style={styles.container}>
```

### Image optimization

```typescript
// 1. Use appropriate image sizes (don't load 4K for a thumbnail)
const thumbnailUrl = `${imageUrl}?width=200&height=200`;

// 2. Lazy load images (only load when visible)
// expo-image handles this well
import { Image } from 'expo-image';

<Image
  source={{ uri: photo.url }}
  style={styles.photo}
  placeholder={{ blurhash: photo.blurhash }}  // Show placeholder while loading
  contentFit="cover"
  transition={200}                            // Smooth fade-in
/>

// 3. Cache images
// expo-image caches by default, configure if needed
```

### Bundle size

```bash
# Check what's in your bundle
npx expo export --dump-sourcemap
npx source-map-explorer dist/bundle.js

# Common wins:
# - Import only what you need from large libraries
# - Use tree-shakeable imports
```

```typescript
// BAD - imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// GOOD - import just what you need
import debounce from 'lodash/debounce';
debounce(fn, 300);

// EVEN BETTER - use a smaller alternative or native
function debounce(fn: Function, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

## 3. Network Performance

### Minimize API calls

```typescript
// 1. Batch related data in one endpoint
// BAD - 3 separate API calls
const spot = await api.getSpot(id);
const photos = await api.getSpotPhotos(id);
const reports = await api.getSpotReports(id);

// GOOD - one endpoint returns everything needed
const spotWithDetails = await api.getSpotDetails(id);
// Returns { ...spot, photos: [...], reports: [...] }

// 2. Use TanStack Query for caching
const { data } = useQuery({
  queryKey: ['spot', id],
  queryFn: () => api.getSpotDetails(id),
  staleTime: 5 * 60 * 1000,  // Don't refetch for 5 minutes
});

// 3. Prefetch data the user is likely to need
const queryClient = useQueryClient();
function onSpotVisible(spotId: string) {
  queryClient.prefetchQuery({
    queryKey: ['spot', spotId],
    queryFn: () => api.getSpotDetails(spotId),
  });
}
```

### Optimistic updates

```typescript
// Show the result immediately, sync with server in background
const { mutate } = useMutation({
  mutationFn: api.updateSpot,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['spot', id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['spot', id]);

    // Optimistically update
    queryClient.setQueryData(['spot', id], (old) => ({ ...old, ...newData }));

    return { previous };
  },
  onError: (err, newData, context) => {
    // Revert on error
    queryClient.setQueryData(['spot', id], context.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['spot', id] });
  },
});
```

## 4. Caching Strategy

### When to cache (backend)

| Data | Cache? | TTL | Why |
|------|--------|-----|-----|
| Dive spot list | Yes | 5 min | Changes infrequently, read-heavy |
| Single spot details | Yes | 1 min | Balance freshness vs load |
| User profile (own) | No | - | Must be fresh |
| Health check | No | - | Must be real-time |
| Search results | Short | 30 sec | Depends on query |

### TanStack Query cache (mobile)

```typescript
// Global defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // Consider data fresh for 1 minute
      gcTime: 10 * 60 * 1000,    // Keep in cache for 10 minutes
      retry: 2,                   // Retry failed requests twice
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
    },
  },
});

// Per-query overrides
useQuery({
  queryKey: ['spots', 'nearby', coords],
  queryFn: () => api.getNearbySpots(coords),
  staleTime: 30 * 1000,  // Location-based data should be fresher
});
```

## 5. Measuring Performance

### Backend

```typescript
// Simple timing in development
const start = Date.now();
const result = await heavyOperation();
this.logger.debug(`heavyOperation took ${Date.now() - start}ms`);

// Prisma query logging
// In PrismaService configuration
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});
prisma.$on('query', (e) => {
  if (e.duration > 100) { // Log slow queries (>100ms)
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

### Mobile

```typescript
// React DevTools Profiler - measures component render times
// Enable in development, use React DevTools extension

// Performance monitoring with console
console.time('SpotList render');
// ... component renders ...
console.timeEnd('SpotList render');
```

## 6. Performance Checklist

### Before shipping a feature

- [ ] List endpoints are paginated
- [ ] Database queries use `select` (not fetching everything)
- [ ] No N+1 queries
- [ ] Foreign keys are indexed
- [ ] FlatList used for lists (not ScrollView)
- [ ] Large components are memoized
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Images are appropriately sized
- [ ] TanStack Query used for server state (with staleTime)

## Learn More

- [Prisma Query Optimization](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [TanStack Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)
