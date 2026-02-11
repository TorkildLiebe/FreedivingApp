import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
        {spots?.map((spot) => (
          <MapLibreGL.PointAnnotation
            key={spot.id}
            id={`spot-${spot.id}`}
            coordinate={[spot.centerLon, spot.centerLat]}
            title={spot.title}
          >
            <View style={styles.spotDot} />
            <MapLibreGL.Callout title={spot.title}>
              <View style={styles.callout}>
                <Text style={styles.calloutText}>{spot.title}</Text>
              </View>
            </MapLibreGL.Callout>
          </MapLibreGL.PointAnnotation>
        ))}
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
  spotDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E8632B',
    borderWidth: 2,
    borderColor: '#fff',
  },
  callout: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calloutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
