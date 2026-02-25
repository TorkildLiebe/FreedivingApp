import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '@/src/shared/theme';
import type { PendingDiveLogPhoto } from '@/src/features/map/hooks/use-dive-log-photo-upload';

const CURRENT_OPTIONS: {
  value: 1 | 2 | 3 | 4 | 5;
  short: string;
}[] = [
  { value: 1, short: 'Calm' },
  { value: 2, short: 'Light' },
  { value: 3, short: 'Mod.' },
  { value: 4, short: 'Strong' },
  { value: 5, short: 'V. Strong' },
];

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const normalized = parsed.toISOString().slice(0, 10);
  return normalized === value;
}

interface AddDiveFormSubmitValues {
  visibilityMeters: number;
  currentStrength: 1 | 2 | 3 | 4 | 5;
  divedAt: string;
  notes: string | null;
  photos: PendingDiveLogPhoto[];
}

interface AddDiveFormSheetProps {
  visible: boolean;
  spotName: string;
  isSubmitting: boolean;
  error: string | null;
  onDismiss: () => void;
  onSubmit: (values: AddDiveFormSubmitValues) => Promise<void> | void;
}

export function AddDiveFormSheet({
  visible,
  spotName,
  isSubmitting,
  error,
  onDismiss,
  onSubmit,
}: AddDiveFormSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [visibilityMeters, setVisibilityMeters] = useState(8);
  const [currentStrength, setCurrentStrength] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [diveDate, setDiveDate] = useState(todayDateInputValue);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<PendingDiveLogPhoto[]>([]);
  const [isPickingPhotos, setIsPickingPhotos] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStep(1);
    setVisibilityMeters(8);
    setCurrentStrength(1);
    setDiveDate(todayDateInputValue());
    setNotes('');
    setPhotos([]);
    setIsPickingPhotos(false);
    setLocalError(null);
  }, [visible]);

  const activeError = localError ?? error;

  const visibilityPercent = useMemo(
    () => Math.min(100, Math.max(0, (visibilityMeters / 30) * 100)),
    [visibilityMeters],
  );

  const handleAddPhotos = async () => {
    if (isSubmitting || isPickingPhotos || photos.length >= 5) {
      return;
    }

    setLocalError(null);
    setIsPickingPhotos(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocalError('Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5 - photos.length,
      });

      if (result.canceled || !Array.isArray(result.assets) || result.assets.length === 0) {
        return;
      }

      const validAssets = result.assets.filter(
        (asset) => typeof asset.uri === 'string' && asset.uri.trim().length > 0,
      );
      if (validAssets.length === 0) {
        setLocalError('Failed to read selected photos. Please try again.');
        return;
      }

      setPhotos((previous) => {
        const slots = Math.max(0, 5 - previous.length);
        const next = validAssets.slice(0, slots).map((asset) => ({
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }));
        return [...previous, ...next].slice(0, 5);
      });
    } catch (pickError) {
      console.warn('Failed to pick dive-log photos:', pickError);
      setLocalError('Failed to select photos. Please try again.');
    } finally {
      setIsPickingPhotos(false);
    }
  };

  const handleNextStep = () => {
    setLocalError(null);

    if (!isValidDateInput(diveDate)) {
      setLocalError('Date must use YYYY-MM-DD format.');
      return;
    }

    if (diveDate > todayDateInputValue()) {
      setLocalError('Dive date cannot be in the future.');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!isValidDateInput(diveDate)) {
      setLocalError('Date must use YYYY-MM-DD format.');
      return;
    }

    if (diveDate > todayDateInputValue()) {
      setLocalError('Dive date cannot be in the future.');
      return;
    }

    await onSubmit({
      visibilityMeters,
      currentStrength,
      divedAt: diveDate,
      notes: notes.trim().length > 0 ? notes.trim() : null,
      photos,
    });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.stepLabel}>{`Step ${step} of 2`}</Text>
              <Text style={styles.title}>{step === 1 ? 'Log a Dive' : 'Notes & Photos'}</Text>
              <Text style={styles.subtitle}>{spotName}</Text>
            </View>
            <TouchableOpacity
              testID="add-dive-close-button"
              accessibilityRole="button"
              onPress={onDismiss}
            >
              <Text style={styles.closeButton}>x</Text>
            </TouchableOpacity>
          </View>

          {activeError ? (
            <Text testID="add-dive-error-text" style={styles.errorText}>
              {activeError}
            </Text>
          ) : null}

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {step === 1 ? (
              <>
                <View style={styles.section}>
                  <View style={styles.visibilityHeader}>
                    <Text style={styles.label}>Visibility</Text>
                    <Text style={styles.visibilityValue}>{`${visibilityMeters} m`}</Text>
                  </View>

                  <View style={styles.sliderTrackWrap}>
                    <View style={styles.sliderTrack}>
                      <View
                        style={[styles.sliderFill, { width: `${visibilityPercent}%` }]}
                      />
                    </View>
                    <TextInput
                      testID="add-dive-visibility-input"
                      style={styles.hiddenSliderInput}
                      keyboardType="number-pad"
                      value={String(visibilityMeters)}
                      onChangeText={(value) => {
                        const parsed = Number(value.replace(/[^0-9]/g, ''));
                        if (Number.isNaN(parsed)) {
                          setVisibilityMeters(0);
                          return;
                        }
                        setVisibilityMeters(Math.max(0, Math.min(30, parsed)));
                      }}
                    />
                  </View>

                  <View style={styles.sliderButtonsRow}>
                    <TouchableOpacity
                      testID="add-dive-visibility-decrease"
                      style={styles.sliderButton}
                      onPress={() =>
                        setVisibilityMeters((previous) => Math.max(0, previous - 1))
                      }
                    >
                      <Text style={styles.sliderButtonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="add-dive-visibility-increase"
                      style={styles.sliderButton}
                      onPress={() =>
                        setVisibilityMeters((previous) => Math.min(30, previous + 1))
                      }
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>Range: 0 to 30 meters</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Current</Text>
                  <View style={styles.currentGrid}>
                    {CURRENT_OPTIONS.map((option) => {
                      const selected = currentStrength === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          testID={`add-dive-current-${option.value}`}
                          style={[
                            styles.currentOption,
                            selected && styles.currentOptionSelected,
                          ]}
                          onPress={() => setCurrentStrength(option.value)}
                        >
                          <View style={styles.currentBars}>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.currentBar,
                                  index < option.value && styles.currentBarActive,
                                ]}
                              />
                            ))}
                          </View>
                          <Text
                            style={[
                              styles.currentOptionLabel,
                              selected && styles.currentOptionLabelSelected,
                            ]}
                          >
                            {option.short}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Date of dive</Text>
                  <Text style={styles.helperText}>optional - defaults to today</Text>
                  <TextInput
                    testID="add-dive-date-input"
                    style={styles.dateInput}
                    value={diveDate}
                    onChangeText={setDiveDate}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <TouchableOpacity
                  testID="add-dive-next-button"
                  style={styles.primaryButton}
                  onPress={handleNextStep}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.neutral[50]} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.helperText}>optional</Text>
                  <TextInput
                    testID="add-dive-notes-input"
                    style={styles.notesInput}
                    multiline
                    maxLength={500}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Conditions, sightings, tips for other divers"
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <Text style={styles.notesCounter}>{`${notes.length} / 500`}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Photos</Text>
                  <Text style={styles.helperText}>Up to 5 photos from your dive</Text>
                  <View style={styles.photosRow}>
                    {photos.map((photo, index) => (
                      <View key={`${photo.uri}-${index}`} style={styles.photoChip}>
                        <Text style={styles.photoChipText}>{`Photo ${index + 1}`}</Text>
                        <TouchableOpacity
                          testID={`add-dive-remove-photo-${index}`}
                          onPress={() => {
                            setPhotos((previous) =>
                              previous.filter((_, photoIndex) => photoIndex !== index),
                            );
                          }}
                        >
                          <Text style={styles.photoRemoveText}>x</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      testID="add-dive-add-photo-button"
                      style={styles.addPhotoButton}
                      onPress={handleAddPhotos}
                      disabled={isSubmitting || isPickingPhotos || photos.length >= 5}
                    >
                      {isPickingPhotos ? (
                        <ActivityIndicator size="small" color={colors.primary[600]} />
                      ) : (
                        <Text style={styles.addPhotoButtonText}>+ Photo</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    testID="add-dive-back-button"
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="add-dive-submit-button"
                    style={styles.primaryButton}
                    onPress={() => {
                      void handleSubmit();
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.neutral[50]} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Submit Dive</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    marginTop: 10,
    width: 42,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.neutral[300],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  stepLabel: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  title: {
    ...typography.h2,
    color: colors.neutral[900],
    marginTop: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.primary[600],
    marginTop: 2,
  },
  closeButton: {
    ...typography.h2,
    color: colors.neutral[500],
    lineHeight: 24,
  },
  errorText: {
    ...typography.bodySmall,
    color: '#dc2626',
    marginTop: 8,
  },
  body: {
    marginTop: 10,
  },
  bodyContent: {
    paddingBottom: 18,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  label: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-600',
    color: colors.neutral[900],
  },
  visibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityValue: {
    ...typography.h2,
    fontFamily: 'IBMPlexMono-500',
    color: colors.neutral[900],
  },
  sliderTrackWrap: {
    marginTop: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 999,
    overflow: 'hidden',
  },
  sliderTrack: {
    height: 12,
    width: '100%',
    backgroundColor: colors.neutral[200],
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  hiddenSliderInput: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  sliderButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  sliderButton: {
    width: 44,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    ...typography.body,
    color: colors.neutral[900],
    fontFamily: 'SpaceGrotesk-700',
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  currentGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  currentOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 8,
  },
  currentOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  currentBars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
    height: 18,
  },
  currentBar: {
    width: 3,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.neutral[300],
  },
  currentBarActive: {
    backgroundColor: colors.primary[500],
  },
  currentOptionLabel: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  currentOptionLabelSelected: {
    color: colors.primary[700],
    fontFamily: 'SpaceGrotesk-600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.neutral[900],
    ...typography.body,
  },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.neutral[900],
    textAlignVertical: 'top',
    ...typography.body,
  },
  notesCounter: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'right',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  photoChipText: {
    ...typography.bodySmall,
    color: colors.neutral[700],
  },
  photoRemoveText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  addPhotoButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPhotoButtonText: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    fontFamily: 'SpaceGrotesk-500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    flex: 1,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.neutral[50],
    fontFamily: 'SpaceGrotesk-600',
  },
  secondaryButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.neutral[700],
    fontFamily: 'SpaceGrotesk-500',
  },
});
