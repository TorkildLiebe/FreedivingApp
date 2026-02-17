# Mobile Development Patterns

Detailed patterns for React Native with Expo in DiveFreely.

## Screen Orchestrator Pattern

Screens coordinate child components, manage data flow, minimal logic.

```typescript
// apps/mobile/src/features/spots/screens/SpotDetailScreen.tsx
import { ScrollView, View } from 'react-native';
import { SpotHeader } from '../components/SpotHeader';
import { SpotInfo } from '../components/SpotInfo';
import { ParkingList } from '../components/ParkingList';
import { useSpot } from '../hooks/use-spot';
import { LoadingView, ErrorView } from '@/src/shared/components';

interface Props {
  spotId: string;
}

export function SpotDetailScreen({ spotId }: Props) {
  const { spot, isLoading, error } = useSpot(spotId);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;
  if (!spot) return <ErrorView error="Spot not found" />;

  return (
    <ScrollView>
      <SpotHeader spot={spot} />
      <SpotInfo spot={spot} />
      <ParkingList parking={spot.parkingLocations} />
    </ScrollView>
  );
}
```

## Custom Hooks

### Query Hook with Cancellation

```typescript
// apps/mobile/src/features/spots/hooks/use-visible-spots.ts
import { useState, useEffect } from 'react';
import { spotsApi } from '@/src/infrastructure/api';
import type { DiveSpot, BoundingBox } from '@freediving/shared';

export function useVisibleSpots(bounds?: BoundingBox) {
  const [spots, setSpots] = useState<DiveSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!bounds) return;

    let cancelled = false;
    const abortController = new AbortController();

    async function fetchSpots() {
      try {
        setIsLoading(true);
        const data = await spotsApi.getByBounds(bounds, {
          signal: abortController.signal,
        });
        if (!cancelled) {
          setSpots(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSpots();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [bounds?.minLat, bounds?.minLon, bounds?.maxLat, bounds?.maxLon]);

  return { spots, isLoading, error };
}
```

### Mutation Hook with Optimistic Update

```typescript
export function useDeleteSpot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function deleteSpot(spotId: string): Promise<boolean> {
    try {
      setIsLoading(true);
      setError(null);
      await spotsApi.delete(spotId);
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { deleteSpot, isLoading, error };
}
```

## MapLibre GL Patterns

### Custom Map Hook

```typescript
// apps/mobile/src/features/map/hooks/use-map-controller.ts
import { useRef, useCallback } from 'react';
import type { MapViewHandle } from '../components/MapView';

export function useMapController() {
  const mapRef = useRef<MapViewHandle>(null);

  const flyTo = useCallback((coords: [number, number], zoom?: number) => {
    mapRef.current?.flyTo(coords, zoom);
  }, []);

  const fitBounds = useCallback((bounds: BoundingBox) => {
    mapRef.current?.fitBounds(bounds);
  }, []);

  const getCenter = useCallback(() => {
    return mapRef.current?.getCenter();
  }, []);

  return { mapRef, flyTo, fitBounds, getCenter };
}
```

### Clustered Markers

```typescript
// apps/mobile/src/features/map/components/ClusteredSpots.native.tsx
import MapLibreGL from '@maplibre/maplibre-react-native';

export function ClusteredSpots({ spots, onSpotPress }) {
  const geojson = {
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature',
      id: spot.id,
      geometry: { type: 'Point', coordinates: [spot.longitude, spot.latitude] },
      properties: { id: spot.id, title: spot.title },
    })),
  };

  return (
    <>
      <MapLibreGL.ShapeSource
        id="spots-source"
        shape={geojson}
        cluster
        clusterRadius={50}
        clusterMaxZoom={14}
        onPress={(feature) => {
          const spotId = feature.features[0]?.properties?.id;
          if (spotId) onSpotPress(spotId);
        }}
      >
        {/* Clusters */}
        <MapLibreGL.CircleLayer
          id="clusters"
          filter={['has', 'point_count']}
          style={{
            circleColor: '#51bbd6',
            circleRadius: ['step', ['get', 'point_count'], 20, 5, 25, 10, 30],
            circleOpacity: 0.8,
          }}
        />

        {/* Cluster count text */}
        <MapLibreGL.SymbolLayer
          id="cluster-count"
          filter={['has', 'point_count']}
          style={{
            textField: '{point_count_abbreviated}',
            textSize: 12,
            textColor: '#ffffff',
          }}
        />

        {/* Individual spots */}
        <MapLibreGL.CircleLayer
          id="spots"
          filter={['!', ['has', 'point_count']]}
          style={{
            circleRadius: 8,
            circleColor: '#3b82f6',
            circleStrokeWidth: 2,
            circleStrokeColor: '#ffffff',
          }}
        />
      </MapLibreGL.ShapeSource>
    </>
  );
}
```

## Form Patterns

### Controlled Form with Validation

```typescript
// apps/mobile/src/features/spots/components/SpotForm.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { validateSpotTitle, validateCoordinates } from '../utils/validators';

interface SpotFormData {
  title: string;
  description: string;
  latitude: string;
  longitude: string;
}

interface Props {
  initialData?: Partial<SpotFormData>;
  onSubmit: (data: SpotFormData) => Promise<void>;
}

export function SpotForm({ initialData, onSubmit }: Props) {
  const [formData, setFormData] = useState<SpotFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
  });
  const [errors, setErrors] = useState<Partial<SpotFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const newErrors: Partial<SpotFormData> = {};

    const titleError = validateSpotTitle(formData.title);
    if (titleError) newErrors.title = titleError;

    const coordsError = validateCoordinates(
      parseFloat(formData.latitude),
      parseFloat(formData.longitude),
    );
    if (coordsError) {
      newErrors.latitude = coordsError;
      newErrors.longitude = coordsError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      setErrors({ title: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View>
      <TextInput
        value={formData.title}
        onChangeText={(title) => setFormData((prev) => ({ ...prev, title }))}
        placeholder="Spot title"
        maxLength={80}
      />
      {errors.title && <Text style={{ color: 'red' }}>{errors.title}</Text>}

      <TextInput
        value={formData.description}
        onChangeText={(description) =>
          setFormData((prev) => ({ ...prev, description }))
        }
        placeholder="Description"
        multiline
        maxLength={2000}
      />

      <Button
        title={isSubmitting ? 'Saving...' : 'Save Spot'}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
    </View>
  );
}
```

## List Patterns

### Optimized FlatList

```typescript
// apps/mobile/src/features/spots/components/SpotList.tsx
import { FlatList, View, Text } from 'react-native';
import { memo } from 'react';
import type { DiveSpot } from '@freediving/shared';

interface Props {
  spots: DiveSpot[];
  onSpotPress: (id: string) => void;
  onEndReached?: () => void;
}

const SpotListItem = memo(({ spot, onPress }: { spot: DiveSpot; onPress: () => void }) => (
  <Pressable onPress={onPress}>
    <View>
      <Text>{spot.title}</Text>
      <Text>{spot.description}</Text>
    </View>
  </Pressable>
));

export function SpotList({ spots, onSpotPress, onEndReached }: Props) {
  return (
    <FlatList
      data={spots}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SpotListItem spot={item} onPress={() => onSpotPress(item.id)} />
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
```

## Location Hook

```typescript
// apps/mobile/src/features/map/hooks/use-location.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setIsLoading(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
          },
          (loc) => {
            setLocation([loc.coords.longitude, loc.coords.latitude]);
            setIsLoading(false);
          },
        );
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { location, error, isLoading };
}
```

---

*Reference file for frontend-dev skill*
