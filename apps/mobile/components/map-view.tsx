import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { MapViewHandle, MapViewProps } from './map-view-types';

export type { MapViewHandle };

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView({ styleJSON, center, zoom, location }, ref) {
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

    return (
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={styleJSON}
        logoEnabled={false}
        attributionEnabled={false}
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
