import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spotsToGeoJSON } from '@/src/features/map/utils/spots-to-geojson';
import { parkingToGeoJSON } from '@/src/features/map/utils/parking-to-geojson';
import type { MapViewHandle, MapViewProps } from './map-view-types';

// Try to load MapLibre — will fail in Expo Go (no native module)
let MapLibreGL: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MapLibreGL = require('@maplibre/maplibre-react-native');
  // Initialize MapLibre (required even without a token)
  if (MapLibreGL?.setAccessToken) {
    MapLibreGL.setAccessToken(null);
  }
} catch {
  // Native module not available (running in Expo Go)
}

const isJest = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

const createTestMapComponent = (name: string) =>
  forwardRef<any, any>(function TestMapComponent(props, ref) {
    return (
      <View ref={ref} testID={name} {...props}>
        {props.children}
      </View>
    );
  });

const mapLibreTestShim = {
  MapView: createTestMapComponent('MapView'),
  Camera: createTestMapComponent('Camera'),
  PointAnnotation: createTestMapComponent('PointAnnotation'),
  ShapeSource: createTestMapComponent('ShapeSource'),
  CircleLayer: createTestMapComponent('CircleLayer'),
  SymbolLayer: createTestMapComponent('SymbolLayer'),
  RasterSource: createTestMapComponent('RasterSource'),
  RasterLayer: createTestMapComponent('RasterLayer'),
};

// Use MapLibreGL directly for runtime, test shim only for Jest
const resolvedMapLibre = isJest ? mapLibreTestShim : MapLibreGL;

export type { MapViewHandle };

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView(
    {
      tileUrl,
      center,
      zoom,
      location,
      selectedSpotId,
      spots,
      parkingLocations,
      onRegionDidChange,
      onSpotPress,
      onParkingPress,
    },
    ref,
  ) {
    const cameraRef = useRef<any>(null);
    const shapeSourceRef = useRef<any>(null);

    const geojson = useMemo(() => spotsToGeoJSON(spots ?? []), [spots]);
    const parkingGeojson = useMemo(
      () => parkingToGeoJSON(parkingLocations ?? []),
      [parkingLocations],
    );

    useImperativeHandle(ref, () => ({
      flyTo(coords, flyZoom = 14) {
        cameraRef.current?.setCamera({
          centerCoordinate: [coords.lng, coords.lat],
          zoomLevel: flyZoom,
          animationDuration: 1000,
        });
      },
    }));

    const handleRegionDidChange = useCallback(
      (feature: any) => {
        if (!onRegionDidChange) return;
        const bounds = feature?.properties?.visibleBounds;
        if (!bounds || bounds.length < 2) return;
        // visibleBounds: [[ne_lng, ne_lat], [sw_lng, sw_lat]]
        const [ne, sw] = bounds;
        onRegionDidChange({
          latMin: sw[1],
          latMax: ne[1],
          lonMin: sw[0],
          lonMax: ne[0],
        });
      },
      [onRegionDidChange],
    );

    const handleShapePress = useCallback(
      async (event: any) => {
        const feature = event.features?.[0];
        if (!feature) return;

        if (feature.properties?.cluster) {
          const expansionZoom =
            await shapeSourceRef.current?.getClusterExpansionZoom(feature);
          const [lng, lat] = feature.geometry.coordinates;
          cameraRef.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: expansionZoom ?? 14,
            animationDuration: 500,
          });
        } else if (feature.properties?.id && onSpotPress) {
          onSpotPress(feature.properties.id);
        }
      },
      [onSpotPress],
    );

    if (!resolvedMapLibre?.MapView) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Map unavailable</Text>
          <Text style={styles.fallbackText}>
            MapLibre native module is not available in Expo Go.{'\n'}
            Create a development build to use the map.
          </Text>
        </View>
      );
    }

    return (
      <resolvedMapLibre.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleRegionDidChange}
      >
        <resolvedMapLibre.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.lng, center.lat],
            zoomLevel: zoom,
          }}
        />
        <resolvedMapLibre.RasterSource
          id="kartverket-source"
          tileUrlTemplates={[tileUrl]}
          tileSize={256}
          minZoomLevel={0}
          maxZoomLevel={20}
        >
          <resolvedMapLibre.RasterLayer
            id="kartverket-layer"
            style={{ rasterOpacity: 1 }}
          />
        </resolvedMapLibre.RasterSource>
        {location && (
          <resolvedMapLibre.PointAnnotation
            id="user-location"
            coordinate={[location.lng, location.lat]}
          >
            <View style={styles.userDot} />
          </resolvedMapLibre.PointAnnotation>
        )}
        <resolvedMapLibre.ShapeSource
          ref={shapeSourceRef}
          id="spots-source"
          shape={geojson}
          cluster
          clusterRadius={50}
          clusterMaxZoomLevel={14}
          onPress={handleShapePress}
        >
          <resolvedMapLibre.CircleLayer
            id="spot-clusters"
            filter={['has', 'point_count']}
            style={{
              circleColor: '#E8632B',
              circleRadius: [
                'step',
                ['get', 'point_count'],
                18,
                10,
                22,
                50,
                28,
              ],
              circleOpacity: 0.85,
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
            }}
          />
          <resolvedMapLibre.SymbolLayer
            id="spot-cluster-count"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 12,
              textColor: '#fff',
              textPitchAlignment: 'map',
            }}
          />
          <resolvedMapLibre.CircleLayer
            id="spot-unclustered"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: [
                'case',
                ['==', ['get', 'id'], selectedSpotId ?? ''],
                '#0C4A6E',
                '#E8632B',
              ],
              circleRadius: [
                'case',
                ['==', ['get', 'id'], selectedSpotId ?? ''],
                11,
                7,
              ],
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
            }}
          />
        </resolvedMapLibre.ShapeSource>
        {parkingLocations && parkingLocations.length > 0 && (
          <resolvedMapLibre.ShapeSource
            id="parking-source"
            shape={parkingGeojson}
            onPress={(event: any) => {
              const feature = event.features?.[0];
              if (feature?.properties?.id && onParkingPress) {
                const parking = parkingLocations.find(
                  (p) => p.id === feature.properties.id,
                );
                if (parking) onParkingPress(parking);
              }
            }}
          >
            <resolvedMapLibre.CircleLayer
              id="parking-markers"
              style={{
                circleColor: '#2196F3',
                circleRadius: 8,
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
              }}
            />
          </resolvedMapLibre.ShapeSource>
        )}
      </resolvedMapLibre.MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
