import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  createMapStyle,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_URLS,
  type MapLayer,
} from '@/src/features/map/constants/map';
import { useLocation } from '@/src/features/map/hooks/use-location';
import { useSpots } from '@/src/features/map/hooks/use-spots';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';
import { MapView, type MapViewHandle } from '@/src/features/map/components/map-view';
import type { BBox } from '@/src/features/map/types';

export default function MapScreen() {
  const { location } = useLocation();
  const mapRef = useRef<MapViewHandle>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('topo');
  const [bbox, setBbox] = useState<BBox | null>(null);
  const { spots } = useSpots(bbox);

  const center = location ?? DEFAULT_CENTER;

  function handleCenterOnMe() {
    if (!location) {
      Alert.alert(
        'Location unavailable',
        'Enable location permissions in your device settings to use this feature.',
      );
      return;
    }
    mapRef.current?.flyTo(location, 14);
  }

  function handleToggleLayer() {
    setActiveLayer((prev) => (prev === 'topo' ? 'nautical' : 'topo'));
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        styleJSON={JSON.stringify(createMapStyle(TILE_URLS[activeLayer]))}
        center={center}
        zoom={DEFAULT_ZOOM}
        location={location}
        spots={spots}
        onRegionDidChange={setBbox}
      />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
