import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_URLS,
  type MapLayer,
} from '@/src/features/map/constants/map';
import { useLocation } from '@/src/features/map/hooks/use-location';
import { useSpots } from '@/src/features/map/hooks/use-spots';
import { useSpotDetail } from '@/src/features/map/hooks/use-spot-detail';
import { useSpotPhotoUpload } from '@/src/features/map/hooks/use-spot-photo-upload';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';
import { MapView, type MapViewHandle } from '@/src/features/map/components/map-view';
import {
  SpotDetailSheet,
  type SpotDetailSheetHandle,
} from '@/src/features/map/components/spot-detail-sheet';
import type { BBox, ParkingLocation, SpotDetail } from '@/src/features/map/types';
import { FrostedGlass } from '@/src/shared/components/FrostedGlass';
import { colors } from '@/src/shared/theme';

export default function MapScreen() {
  const { location } = useLocation();
  const mapRef = useRef<MapViewHandle>(null);
  const sheetRef = useRef<SpotDetailSheetHandle>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('topo');
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { spots } = useSpots(bbox);
  const { spot, isLoading: isSpotLoading, refresh } = useSpotDetail(selectedSpotId);
  const {
    uploadPhoto,
    isUploading: isUploadingPhoto,
    error: photoUploadError,
    clearError: clearPhotoUploadError,
  } = useSpotPhotoUpload({
    onUploaded: refresh,
  });

  const center = location ?? DEFAULT_CENTER;

  const filteredSpots = searchQuery.trim()
    ? spots.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : spots;

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

  const handleSpotPress = useCallback((spotId: string) => {
    clearPhotoUploadError();
    setSelectedSpotId(spotId);
  }, [clearPhotoUploadError]);

  const handleParkingPress = useCallback((parking: ParkingLocation) => {
    mapRef.current?.flyTo({ lat: parking.lat, lng: parking.lon }, 16);
    sheetRef.current?.minimize();
  }, []);

  const handleSheetDismiss = useCallback(() => {
    clearPhotoUploadError();
    setSelectedSpotId(null);
  }, [clearPhotoUploadError]);

  const handleAddPhoto = useCallback(
    (targetSpot: SpotDetail) => {
      void uploadPhoto(targetSpot);
    },
    [uploadPhoto],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer} pointerEvents="box-none">
        <FrostedGlass style={styles.searchBar}>
          <TextInput
            testID="map-search-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search spots…"
            placeholderTextColor={colors.neutral[400]}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </FrostedGlass>
      </View>
      <MapView
        ref={mapRef}
        tileUrl={TILE_URLS[activeLayer]}
        center={center}
        zoom={DEFAULT_ZOOM}
        location={location}
        selectedSpotId={selectedSpotId}
        spots={filteredSpots}
        parkingLocations={spot?.parkingLocations}
        onRegionDidChange={setBbox}
        onSpotPress={handleSpotPress}
        onParkingPress={handleParkingPress}
      />
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>{'\u00A9'} Kartverket</Text>
      </View>
      <MapFloatingButton
        testID="map-toggle-layer-button"
        onPress={handleToggleLayer}
        iconName="globe"
        style={styles.layerButton}
      />
      <MapFloatingButton
        testID="map-center-on-me-button"
        onPress={handleCenterOnMe}
        iconName="crosshairs"
        style={styles.centerButton}
      />
      <SpotDetailSheet
        ref={sheetRef}
        spot={spot}
        isLoading={isSpotLoading}
        onDismiss={handleSheetDismiss}
        onParkingPress={handleParkingPress}
        onAddPhoto={handleAddPhoto}
        isUploadingPhoto={isUploadingPhoto}
        photoUploadError={photoUploadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  searchBar: {
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.neutral[900],
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
