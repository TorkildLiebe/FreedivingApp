import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
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
import {
  useCreateSpot,
  type PendingParkingLocation,
  type PendingSpotPhoto,
} from '@/src/features/map/hooks/use-create-spot';
import { useFavoriteSpots } from '@/src/features/map/hooks/use-favorite-spots';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';
import { MapView, type MapViewHandle } from '@/src/features/map/components/map-view';
import {
  SpotDetailSheet,
  type SpotDetailSheetHandle,
} from '@/src/features/map/components/spot-detail-sheet';
import { CreateSpotOverlay } from '@/src/features/map/components/create-spot-overlay';
import type { BBox, ParkingLocation, SpotDetail } from '@/src/features/map/types';
import { FrostedGlass } from '@/src/shared/components/FrostedGlass';
import { colors } from '@/src/shared/theme';

function isConflictError(
  error: unknown,
): error is { status: number; message: string } {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { status?: unknown; message?: unknown };
  return candidate.status === 409 && typeof candidate.message === 'string';
}

export default function MapScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isAuthenticated, favoriteSpotIds, toggleFavoriteSpot } =
    useFavoriteSpots();
  const { location } = useLocation();
  const mapRef = useRef<MapViewHandle>(null);
  const sheetRef = useRef<SpotDetailSheetHandle>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('topo');
  const [bbox, setBbox] = useState<BBox | null>(null);
  const devSelectedSpotId =
    process.env.NODE_ENV === 'development'
      ? process.env.EXPO_PUBLIC_DEV_SELECTED_SPOT_ID
      : undefined;
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(
    devSelectedSpotId?.trim() ? devSelectedSpotId : null,
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const devCreateStep =
    process.env.NODE_ENV === 'development'
      ? process.env.EXPO_PUBLIC_DEV_CREATE_STEP
      : undefined;
  const devCreateLat = Number(process.env.EXPO_PUBLIC_DEV_CREATE_LAT);
  const devCreateLon = Number(process.env.EXPO_PUBLIC_DEV_CREATE_LON);
  const initialCreateStep: 'idle' | 'placing' | 'form' | 'parking' =
    devCreateStep === 'placing' ||
    devCreateStep === 'form' ||
    devCreateStep === 'parking'
      ? devCreateStep
      : 'idle';

  const [createStep, setCreateStep] = useState<
    'idle' | 'placing' | 'form' | 'parking'
  >(initialCreateStep);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createAccessInfo, setCreateAccessInfo] = useState('');
  const [createPhotos, setCreatePhotos] = useState<PendingSpotPhoto[]>([]);
  const [createParkingLocations, setCreateParkingLocations] = useState<
    PendingParkingLocation[]
  >([]);
  const [createParkingLabel, setCreateParkingLabel] = useState('');
  const [createPinnedCoordinate, setCreatePinnedCoordinate] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [createFormSheetIndex, setCreateFormSheetIndex] = useState(2);
  const [createLocalError, setCreateLocalError] = useState<string | null>(null);
  const [isPickingCreatePhotos, setIsPickingCreatePhotos] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { spots, refresh: refreshSpots } = useSpots(bbox);
  const { spot, isLoading: isSpotLoading, refresh } = useSpotDetail(selectedSpotId);
  const {
    uploadPhoto,
    isUploading: isUploadingPhoto,
    error: photoUploadError,
    clearError: clearPhotoUploadError,
  } = useSpotPhotoUpload({
    onUploaded: refresh,
  });
  const {
    createSpot,
    isSubmitting: isCreatingSpot,
    error: createError,
    clearError: clearCreateError,
  } = useCreateSpot();

  const center = location ?? DEFAULT_CENTER;
  const initialLiveMapCenter = useMemo(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      Number.isFinite(devCreateLat) &&
      Number.isFinite(devCreateLon)
    ) {
      return { lat: devCreateLat, lng: devCreateLon };
    }

    return center;
  }, [center, devCreateLat, devCreateLon]);
  const [liveMapCenter, setLiveMapCenter] = useState(initialLiveMapCenter);

  const activeCreateError = createLocalError ?? createError;
  const hasPinnedSpot = createPinnedCoordinate !== null;
  const shouldShowDraftMarkers =
    hasPinnedSpot &&
    (createStep === 'parking' ||
      (createStep === 'form' && createFormSheetIndex === 0));
  const spotWithFavorite = useMemo(() => {
    if (!spot) {
      return null;
    }

    const isFavorite = favoriteSpotIds.includes(spot.id);
    if (spot.isFavorite === isFavorite) {
      return spot;
    }

    return {
      ...spot,
      isFavorite,
    };
  }, [favoriteSpotIds, spot]);

  const filteredSpots = searchQuery.trim()
    ? spots.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : spots;

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: createStep === 'idle' ? undefined : { display: 'none' },
    });

    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [createStep, navigation]);

  useEffect(() => {
    if (createStep === 'idle') {
      setLiveMapCenter(initialLiveMapCenter);
    }
  }, [createStep, initialLiveMapCenter]);

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

  const handleSpotPress = useCallback(
    (spotId: string) => {
      if (createStep !== 'idle') {
        return;
      }
      clearPhotoUploadError();
      setSelectedSpotId(spotId);
    },
    [clearPhotoUploadError, createStep],
  );

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

  const handleToggleFavorite = useCallback(
    async (targetSpot: SpotDetail) => {
      if (!isAuthenticated) {
        Alert.alert('Sign in required', 'Please sign in to save favorite spots.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]);
        return;
      }

      if (isTogglingFavorite) {
        return;
      }

      setIsTogglingFavorite(true);
      const shouldFavorite = !favoriteSpotIds.includes(targetSpot.id);
      const { error } = await toggleFavoriteSpot(targetSpot.id, shouldFavorite);

      if (error) {
        Alert.alert('Error', 'Failed to update favorite. Please try again.');
      }

      setIsTogglingFavorite(false);
    },
    [
      favoriteSpotIds,
      isAuthenticated,
      isTogglingFavorite,
      router,
      toggleFavoriteSpot,
    ],
  );

  const resetCreateForm = useCallback(() => {
    setCreateStep('idle');
    setCreateTitle('');
    setCreateDescription('');
    setCreateAccessInfo('');
    setCreatePhotos([]);
    setCreateParkingLocations([]);
    setCreateParkingLabel('');
    setCreatePinnedCoordinate(null);
    setCreateFormSheetIndex(2);
    setCreateLocalError(null);
    clearCreateError();
  }, [clearCreateError]);

  const handleStartCreate = useCallback(() => {
    clearPhotoUploadError();
    setSelectedSpotId(null);
    setCreateLocalError(null);
    clearCreateError();
    setCreatePinnedCoordinate(null);
    setCreateFormSheetIndex(2);
    setCreateStep('placing');
  }, [clearCreateError, clearPhotoUploadError]);

  const handlePickCreatePhotos = useCallback(async () => {
    if (createPhotos.length >= 5 || isCreatingSpot) {
      return;
    }

    setIsPickingCreatePhotos(true);
    setCreateLocalError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setCreateLocalError('Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5 - createPhotos.length,
      });

      if (
        result.canceled ||
        !Array.isArray(result.assets) ||
        result.assets.length === 0
      ) {
        return;
      }

      const validAssets = result.assets.filter(
        (asset) => typeof asset.uri === 'string' && asset.uri.trim().length > 0,
      );
      if (validAssets.length === 0) {
        setCreateLocalError(
          'Failed to read the selected photos. Please choose different photos.',
        );
        return;
      }

      setCreatePhotos((previous) => {
        const remainingSlots = 5 - previous.length;
        const nextPhotos = validAssets.slice(0, remainingSlots).map((asset) => ({
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }));
        return [...previous, ...nextPhotos].slice(0, 5);
      });
    } catch (photoError) {
      console.warn('Failed to pick create-spot photos:', photoError);
      setCreateLocalError('Failed to select photos. Please try again.');
    } finally {
      setIsPickingCreatePhotos(false);
    }
  }, [createPhotos.length, isCreatingSpot]);

  const handleSubmitCreate = useCallback(async () => {
    if (!createTitle.trim()) {
      setCreateLocalError('Spot name is required.');
      return;
    }

    setCreateLocalError(null);
    clearCreateError();

    try {
      const pinnedCoordinate = createPinnedCoordinate ?? liveMapCenter;
      const createdSpot = await createSpot({
        title: createTitle,
        description: createDescription,
        accessInfo: createAccessInfo,
        centerLat: pinnedCoordinate.lat,
        centerLon: pinnedCoordinate.lng,
        photos: createPhotos,
        parkingLocations: createParkingLocations,
      });

      resetCreateForm();
      refreshSpots();
      setSelectedSpotId(createdSpot.id);
      mapRef.current?.flyTo(
        {
          lat: createdSpot.centerLat,
          lng: createdSpot.centerLon,
        },
        14,
      );
    } catch (createSpotError) {
      if (isConflictError(createSpotError)) {
        const conflictMessage = createSpotError.message.replace(/[.\s]+$/, '');
        setCreateStep('placing');
        setCreateLocalError(
          `${conflictMessage}. Move the pin and try again.`,
        );
      }
    }
  }, [
    clearCreateError,
    createPinnedCoordinate,
    createAccessInfo,
    createDescription,
    createParkingLocations,
    createPhotos,
    createSpot,
    createTitle,
    liveMapCenter,
    refreshSpots,
    resetCreateForm,
  ]);

  const handleAddDive = useCallback((targetSpot: SpotDetail) => {
    Alert.alert('Add Dive', `Dive logging for ${targetSpot.title} will open in M3.`);
  }, []);

  const handleUpdateRating = useCallback(
    (_targetSpot: SpotDetail, rating: 1 | 2 | 3 | 4 | 5) => {
      Alert.alert('Rating saved', `You rated this spot ${rating} stars.`);
    },
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer} pointerEvents="box-none">
        <FrostedGlass style={styles.searchBar}>
          <TextInput
            testID="map-search-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search dive spots..."
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
        draftSpotCoordinate={shouldShowDraftMarkers ? createPinnedCoordinate : null}
        draftParkingLocations={shouldShowDraftMarkers ? createParkingLocations : []}
        onRegionDidChange={setBbox}
        onMapCenterDidChange={setLiveMapCenter}
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
      {selectedSpotId === null && createStep === 'idle' ? (
        <MapFloatingButton
          testID="map-start-create-spot-button"
          onPress={handleStartCreate}
          iconName="plus"
          style={styles.createButton}
        />
      ) : null}
      <MapFloatingButton
        testID="map-center-on-me-button"
        onPress={handleCenterOnMe}
        iconName="crosshairs"
        style={styles.centerButton}
      />
      <SpotDetailSheet
        ref={sheetRef}
        spot={createStep === 'idle' ? spotWithFavorite : null}
        isLoading={createStep === 'idle' ? isSpotLoading : false}
        onDismiss={handleSheetDismiss}
        onParkingPress={handleParkingPress}
        onToggleFavorite={handleToggleFavorite}
        isTogglingFavorite={isTogglingFavorite}
        onAddPhoto={handleAddPhoto}
        isUploadingPhoto={isUploadingPhoto}
        photoUploadError={photoUploadError}
        onAddDive={handleAddDive}
        onUpdateRating={handleUpdateRating}
      />
      <CreateSpotOverlay
        visible={createStep !== 'idle'}
        step={
          createStep === 'placing'
            ? 'placing'
            : createStep === 'parking'
              ? 'parking'
              : 'form'
        }
        pinCoordinate={liveMapCenter}
        title={createTitle}
        description={createDescription}
        accessInfo={createAccessInfo}
        photos={createPhotos}
        parkingLocations={createParkingLocations}
        parkingLabel={createParkingLabel}
        isSubmitting={isCreatingSpot}
        isPickingPhotos={isPickingCreatePhotos}
        error={activeCreateError}
        onCancel={resetCreateForm}
        onConfirmPin={() => {
          setCreateLocalError(null);
          setCreatePinnedCoordinate(liveMapCenter);
          setCreateFormSheetIndex(2);
          setCreateStep('form');
        }}
        onFormSheetIndexChange={setCreateFormSheetIndex}
        onStartParkingPlacement={() => {
          setCreateLocalError(null);
          setCreateParkingLabel('');
          setCreateFormSheetIndex(2);
          setCreateStep('parking');
        }}
        onCancelParkingPlacement={() => {
          setCreateFormSheetIndex(2);
          setCreateStep('form');
        }}
        onParkingLabelChange={setCreateParkingLabel}
        onConfirmParkingPlacement={() => {
          setCreateParkingLocations((previous) => {
            if (previous.length >= 5) {
              return previous;
            }
            return [
              ...previous,
              {
                lat: liveMapCenter.lat,
                lon: liveMapCenter.lng,
                label: createParkingLabel,
              },
            ];
          });
          setCreateParkingLabel('');
          setCreateFormSheetIndex(2);
          setCreateStep('form');
        }}
        onRemoveParkingLocation={(index) => {
          setCreateParkingLocations((previous) =>
            previous.filter((_, itemIndex) => itemIndex !== index),
          );
        }}
        onSubmit={() => {
          void handleSubmitCreate();
        }}
        onPickPhotos={() => {
          void handlePickCreatePhotos();
        }}
        onRemovePhoto={(index) => {
          setCreatePhotos((photos) => photos.filter((_, i) => i !== index));
        }}
        onTitleChange={setCreateTitle}
        onDescriptionChange={setCreateDescription}
        onAccessInfoChange={setCreateAccessInfo}
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
    bottom: 136,
    right: 16,
  },
  createButton: {
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
