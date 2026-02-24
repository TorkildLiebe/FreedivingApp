import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { PendingSpotPhoto } from '@/src/features/map/hooks/use-create-spot';
import { colors, typography } from '@/src/shared/theme';

type CreateSpotStep = 'placing' | 'form';

interface CreateSpotOverlayProps {
  visible: boolean;
  step: CreateSpotStep;
  pinCoordinate: { lat: number; lng: number } | null;
  title: string;
  description: string;
  accessInfo: string;
  photos: PendingSpotPhoto[];
  isSubmitting: boolean;
  isPickingPhotos: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirmPin: () => void;
  onBackToPin: () => void;
  onSubmit: () => void;
  onPickPhotos: () => void;
  onRemovePhoto: (index: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAccessInfoChange: (value: string) => void;
}

export function CreateSpotOverlay({
  visible,
  step,
  pinCoordinate,
  title,
  description,
  accessInfo,
  photos,
  isSubmitting,
  isPickingPhotos,
  error,
  onCancel,
  onConfirmPin,
  onBackToPin,
  onSubmit,
  onPickPhotos,
  onRemovePhoto,
  onTitleChange,
  onDescriptionChange,
  onAccessInfoChange,
}: CreateSpotOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View testID="create-spot-overlay" pointerEvents="box-none" style={styles.container}>
      {step === 'placing' ? (
        <>
          <View style={styles.pinContainer} pointerEvents="none">
            <View style={styles.pinPulse} />
            <FontAwesome name="map-marker" size={44} color={colors.primary[600]} />
          </View>

          <View testID="create-spot-placement-step" style={styles.panel}>
            <Text style={styles.panelTitle}>Set Spot Position</Text>
            <Text style={styles.panelText}>
              Pan and zoom the map so the pin is placed at the exact dive spot.
            </Text>
            {pinCoordinate ? (
              <Text style={styles.coordinateText}>
                {pinCoordinate.lat.toFixed(5)}, {pinCoordinate.lng.toFixed(5)}
              </Text>
            ) : null}
            <TouchableOpacity
              testID="create-spot-confirm-pin-button"
              style={styles.primaryButton}
              onPress={onConfirmPin}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="create-spot-cancel-button"
              style={styles.secondaryButton}
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View testID="create-spot-form-step" style={[styles.panel, styles.formPanel]}>
          <Text style={styles.panelTitle}>Create Dive Spot</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                testID="create-spot-title-input"
                value={title}
                onChangeText={onTitleChange}
                placeholder="Spot name"
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
                placeholder="Describe depth, hazards, and conditions"
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
                placeholder="Entry point, path, parking"
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <ActivityIndicator size="small" color={colors.neutral[50]} />
                  ) : (
                    <Text style={styles.addPhotoButtonText}>+ Add</Text>
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
              </ScrollView>
            </View>

            {error ? (
              <Text testID="create-spot-error-text" style={styles.errorText}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

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
              <Text style={styles.primaryButtonText}>Create Spot</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            testID="create-spot-back-button"
            style={styles.secondaryButton}
            onPress={onBackToPin}
            disabled={isSubmitting}
          >
            <Text style={styles.secondaryButtonText}>Back to pin placement</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: colors.primary[400],
    opacity: 0.45,
  },
  panel: {
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.neutral[200],
  },
  formPanel: {
    maxHeight: '70%',
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
    backgroundColor: colors.neutral[100],
    color: colors.neutral[900],
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
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
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addPhotoButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  addPhotoButtonText: {
    color: colors.neutral[50],
    fontSize: 14,
    fontWeight: '700',
  },
  photoPreviewContainer: {
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[200],
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  primaryButtonText: {
    color: colors.neutral[50],
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.neutral[700],
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 4,
  },
});
