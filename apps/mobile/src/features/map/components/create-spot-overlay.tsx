import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type {
  PendingParkingLocation,
  PendingSpotPhoto,
} from '@/src/features/map/hooks/use-create-spot';
import { colors, typography } from '@/src/shared/theme';

type CreateSpotStep = 'placing' | 'form' | 'parking';

interface CreateSpotOverlayProps {
  visible: boolean;
  step: CreateSpotStep;
  pinCoordinate: { lat: number; lng: number } | null;
  title: string;
  description: string;
  accessInfo: string;
  photos: PendingSpotPhoto[];
  parkingLocations: PendingParkingLocation[];
  parkingLabel: string;
  isSubmitting: boolean;
  isPickingPhotos: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirmPin: () => void;
  onSubmit: () => void;
  onPickPhotos: () => void;
  onRemovePhoto: (index: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAccessInfoChange: (value: string) => void;
  onFormSheetIndexChange?: (index: number) => void;
  onStartParkingPlacement: () => void;
  onCancelParkingPlacement: () => void;
  onParkingLabelChange: (value: string) => void;
  onConfirmParkingPlacement: () => void;
  onRemoveParkingLocation: (index: number) => void;
}

export function CreateSpotOverlay({
  visible,
  step,
  pinCoordinate,
  title,
  description,
  accessInfo,
  photos,
  parkingLocations,
  parkingLabel,
  isSubmitting,
  isPickingPhotos,
  error,
  onCancel,
  onConfirmPin,
  onSubmit,
  onPickPhotos,
  onRemovePhoto,
  onTitleChange,
  onDescriptionChange,
  onAccessInfoChange,
  onFormSheetIndexChange,
  onStartParkingPlacement,
  onCancelParkingPlacement,
  onParkingLabelChange,
  onConfirmParkingPlacement,
  onRemoveParkingLocation,
}: CreateSpotOverlayProps) {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['25%', '55%', '90%'], []);
  const [formSheetIndex, setFormSheetIndex] = useState(2);

  useEffect(() => {
    if (step === 'form') {
      setFormSheetIndex(2);
      onFormSheetIndexChange?.(2);
    }
  }, [onFormSheetIndexChange, step]);

  const handleFormSheetChange = useCallback(
    (index: number) => {
      setFormSheetIndex(index);
      onFormSheetIndexChange?.(index);
    },
    [onFormSheetIndexChange],
  );

  if (!visible) {
    return null;
  }

  const showParkingStep = step === 'parking';
  const showPlacementStep = step === 'placing';
  const showFormStep = step === 'form';

  return (
    <View testID="create-spot-overlay" pointerEvents="box-none" style={styles.container}>
      {(showPlacementStep || showParkingStep) && (
        <View style={styles.pinContainer} pointerEvents="none">
          <View
            style={[
              styles.pinPulse,
              showParkingStep ? styles.parkingPulse : styles.spotPulse,
            ]}
          />
          <FontAwesome
            name="map-marker"
            size={44}
            color={showParkingStep ? colors.secondary[600] : colors.primary[600]}
          />
        </View>
      )}

      {showPlacementStep ? (
        <View testID="create-spot-placement-step" style={[styles.panel, { paddingBottom: 28 + insets.bottom }]}>
          <Text style={styles.panelTitle}>Create Dive Spot</Text>
          <Text style={styles.panelText}>Pan & zoom to position your spot</Text>
          {pinCoordinate ? (
            <Text style={styles.coordinateText}>
              {pinCoordinate.lat.toFixed(5)}, {pinCoordinate.lng.toFixed(5)}
            </Text>
          ) : null}
          {error ? (
            <Text testID="create-spot-error-text" style={styles.errorText}>
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            testID="create-spot-confirm-pin-button"
            style={styles.primaryButton}
            onPress={onConfirmPin}
          >
            <Text style={styles.primaryButtonText}>Create Dive Spot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="create-spot-cancel-button"
            style={styles.secondaryButton}
            onPress={onCancel}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showFormStep ? (
        <BottomSheet
          index={formSheetIndex}
          snapPoints={snapPoints}
          onChange={handleFormSheetChange}
          enablePanDownToClose={false}
          backgroundStyle={styles.formSheetBackground}
          handleIndicatorStyle={styles.formSheetHandle}
        >
          <View testID="create-spot-form-step" style={styles.formSheetBody}>
            <Text style={styles.panelTitle}>Create Dive Spot</Text>
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Spot Name</Text>
                <TextInput
                  testID="create-spot-title-input"
                  value={title}
                  onChangeText={onTitleChange}
                  placeholder="e.g. Nakholmen South"
                  placeholderTextColor={colors.neutral[500]}
                  style={styles.input}
                  maxLength={80}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  testID="create-spot-description-input"
                  value={description}
                  onChangeText={onDescriptionChange}
                  placeholder="Describe the site, depths, marine life..."
                  placeholderTextColor={colors.neutral[500]}
                  style={[styles.input, styles.textArea]}
                  multiline
                  maxLength={2000}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Access Info</Text>
                <TextInput
                  testID="create-spot-access-input"
                  value={accessInfo}
                  onChangeText={onAccessInfoChange}
                  placeholder="How to get there, entry point..."
                  placeholderTextColor={colors.neutral[500]}
                  style={[styles.input, styles.textArea]}
                  multiline
                  maxLength={1000}
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.photoHeaderRow}>
                  <Text style={styles.fieldLabel}>Photos</Text>
                  <Text testID="create-spot-photo-count" style={styles.photoCountText}>
                    {photos.length}/5
                  </Text>
                </View>
                <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    testID="create-spot-add-photos-button"
                    style={[
                      styles.addPhotoButton,
                      (photos.length >= 5 || isPickingPhotos || isSubmitting) &&
                        styles.addPhotoButtonDisabled,
                    ]}
                    onPress={onPickPhotos}
                    disabled={photos.length >= 5 || isPickingPhotos || isSubmitting}
                  >
                    {isPickingPhotos ? (
                      <ActivityIndicator size="small" color={colors.neutral[700]} />
                    ) : (
                      <>
                        <FontAwesome name="camera" size={18} color={colors.neutral[500]} />
                        <Text style={styles.addPhotoButtonText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {photos.map((photo, index) => (
                    <View key={`${photo.uri}-${index}`} style={styles.photoPreviewContainer}>
                      <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                      <TouchableOpacity
                        testID={`create-spot-remove-photo-${index}`}
                        style={styles.removePhotoButton}
                        onPress={() => onRemovePhoto(index)}
                        disabled={isSubmitting}
                      >
                        <FontAwesome name="close" size={12} color={colors.neutral[50]} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </BottomSheetScrollView>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Parking Locations</Text>
                {parkingLocations.map((parking, index) => (
                  <View key={`parking-${index}`} style={styles.parkingRow}>
                    <Text style={styles.parkingLabelText} numberOfLines={1}>
                      {parking.label?.trim().length
                        ? parking.label
                        : `Parking (${parking.lat.toFixed(4)}, ${parking.lon.toFixed(4)})`}
                    </Text>
                    <TouchableOpacity
                      testID={`create-spot-remove-parking-${index}`}
                      onPress={() => onRemoveParkingLocation(index)}
                      disabled={isSubmitting}
                    >
                      <FontAwesome name="close" size={14} color={colors.neutral[600]} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  testID="create-spot-add-parking-button"
                  style={styles.parkingAddButton}
                  onPress={onStartParkingPlacement}
                  disabled={isSubmitting}
                >
                  <Text style={styles.parkingAddButtonText}>+ Add Parking Location</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <Text testID="create-spot-error-text" style={styles.errorText}>
                  {error}
                </Text>
              ) : null}
            </BottomSheetScrollView>

            <TouchableOpacity
              testID="create-spot-submit-button"
              style={[
                styles.primaryButton,
                (title.trim().length === 0 || isSubmitting) && styles.primaryButtonDisabled,
              ]}
              disabled={title.trim().length === 0 || isSubmitting}
              onPress={onSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.neutral[50]} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Dive Spot</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              testID="create-spot-cancel-form-button"
              style={styles.secondaryButton}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      ) : null}

      {showParkingStep ? (
        <View testID="create-spot-parking-step" style={[styles.panel, { paddingBottom: 28 + insets.bottom }]}>
          <Text style={styles.panelTitle}>Parking Location</Text>
          <Text style={styles.panelText}>Pan & zoom to position parking</Text>
          {pinCoordinate ? (
            <Text style={styles.coordinateText}>
              {pinCoordinate.lat.toFixed(5)}, {pinCoordinate.lng.toFixed(5)}
            </Text>
          ) : null}
          <TextInput
            testID="create-spot-parking-label-input"
            value={parkingLabel}
            onChangeText={onParkingLabelChange}
            placeholder="e.g. Free parking, 5 min walk"
            placeholderTextColor={colors.neutral[500]}
            style={[styles.input, styles.parkingInput]}
            maxLength={120}
          />
          <TouchableOpacity
            testID="create-spot-confirm-parking-button"
            style={styles.secondaryPrimaryButton}
            onPress={onConfirmParkingPlacement}
          >
            <Text style={styles.primaryButtonText}>Add Parking Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="create-spot-cancel-parking-button"
            style={styles.secondaryButton}
            onPress={onCancelParkingPlacement}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  pinContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.45,
  },
  spotPulse: {
    backgroundColor: colors.primary[400],
  },
  parkingPulse: {
    backgroundColor: colors.secondary[400],
  },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.neutral[200],
  },
  formSheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  formSheetHandle: {
    backgroundColor: colors.neutral[900],
    opacity: 0.3,
  },
  formSheetBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  panelTitle: {
    fontSize: 24,
    color: colors.neutral[900],
    fontFamily: typography.h3.fontFamily,
    fontWeight: '700',
    marginBottom: 8,
  },
  panelText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[700],
    marginBottom: 8,
  },
  coordinateText: {
    marginBottom: 14,
    fontSize: 13,
    color: colors.neutral[600],
    fontFamily: typography.mono.fontFamily,
  },
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.neutral[600],
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    backgroundColor: colors.neutral[50],
    color: colors.neutral[900],
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  parkingInput: {
    marginBottom: 12,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoCountText: {
    color: colors.neutral[600],
    fontSize: 12,
    fontFamily: typography.mono.fontFamily,
  },
  addPhotoButton: {
    width: 84,
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    gap: 6,
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoButtonText: {
    color: colors.neutral[600],
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: 84,
    height: 84,
    marginRight: 10,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  parkingLabelText: {
    flex: 1,
    marginRight: 10,
    color: colors.neutral[900],
    fontSize: 14,
  },
  parkingAddButton: {
    borderWidth: 1,
    borderColor: colors.secondary[400],
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parkingAddButtonText: {
    color: colors.secondary[700],
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.body.fontFamily,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryPrimaryButton: {
    borderRadius: 12,
    backgroundColor: colors.secondary[600],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.neutral[50],
    fontSize: 16,
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.neutral[700],
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    fontWeight: '500',
  },
});
