import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { spotsToGeoJSON } from '@/src/features/map/utils/spots-to-geojson';
import type { MapViewHandle, MapViewProps } from './map-view-types';

export type { MapViewHandle };

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView(
    { styleJSON, center, zoom, location, spots, onRegionDidChange },
    ref,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MapLibreGL = require('@maplibre/maplibre-react-native');
    const cameraRef = useRef<any>(null);
    const shapeSourceRef = useRef<any>(null);

    const geojson = useMemo(() => spotsToGeoJSON(spots ?? []), [spots]);

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

    const handleShapePress = useCallback(async (event: any) => {
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
      }
    }, []);

    return (
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={styleJSON}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleRegionDidChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.lng, center.lat],
            zoomLevel: zoom,
          }}
        />
        {location && (
          <MapLibreGL.PointAnnotation
            id="user-location"
            coordinate={[location.lng, location.lat]}
          >
            <View style={styles.userDot} />
          </MapLibreGL.PointAnnotation>
        )}
        <MapLibreGL.ShapeSource
          ref={shapeSourceRef}
          id="spots-source"
          shape={geojson}
          cluster
          clusterRadius={50}
          clusterMaxZoomLevel={14}
          onPress={handleShapePress}
        >
          <MapLibreGL.CircleLayer
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
          <MapLibreGL.CircleLayer
            id="spot-unclustered"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: '#E8632B',
              circleRadius: 7,
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
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
});
