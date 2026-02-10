import { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import {
  createMapStyle,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_URLS,
  type MapLayer,
} from '@/constants/map';
import { useLocation } from '@/hooks/use-location';
import { MapFloatingButton } from '@/components/map-floating-button';

function MapPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Map is not supported on web</Text>
    </View>
  );
}

function NativeMap() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MapLibreGL = require('@maplibre/maplibre-react-native');
  const { location } = useLocation();
  const cameraRef = useRef<any>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('topo');

  const center = location ?? DEFAULT_CENTER;

  function handleCenterOnMe() {
    if (!location) {
      Alert.alert(
        'Location unavailable',
        'Enable location permissions in your device settings to use this feature.',
      );
      return;
    }
    cameraRef.current?.setCamera({
      centerCoordinate: [location.lng, location.lat],
      zoomLevel: 14,
      animationDuration: 1000,
    });
  }

  function handleToggleLayer() {
    setActiveLayer((prev) => (prev === 'topo' ? 'nautical' : 'topo'));
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        key={activeLayer}
        style={styles.map}
        styleJSON={JSON.stringify(createMapStyle(TILE_URLS[activeLayer]))}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.lng, center.lat],
            zoomLevel: DEFAULT_ZOOM,
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
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>{'\u00A9'} Kartverket</Text>
      </View>
      <MapFloatingButton
        onPress={handleToggleLayer}
        iconName="globe"
        style={styles.layerButton}
      />
      <MapFloatingButton
        onPress={handleCenterOnMe}
        iconName="crosshairs"
        style={styles.centerButton}
      />
    </View>
  );
}

export default function MapScreen() {
  if (Platform.OS === 'web') {
    return <MapPlaceholder />;
  }

  return <NativeMap />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 11,
    color: '#333',
  },
  layerButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
  },
  centerButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
  },
});
