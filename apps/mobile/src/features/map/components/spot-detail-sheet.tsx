import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, typography } from '@/src/shared/theme';
import type { DiveLogPreview, ParkingLocation, SpotDetail } from '@/src/features/map/types';

interface SpotDetailSheetProps {
  spot: SpotDetail | null;
  isLoading: boolean;
  onDismiss: () => void;
  onParkingPress: (parking: ParkingLocation) => void;
  onToggleFavorite?: (spot: SpotDetail) => void;
  isTogglingFavorite?: boolean;
  onAddPhoto?: (spot: SpotDetail) => void;
  isUploadingPhoto?: boolean;
  photoUploadError?: string | null;
  onAddDive?: (spot: SpotDetail) => void;
  currentUserId?: string | null;
  onEditDive?: (spot: SpotDetail, diveLog: DiveLogPreview) => void;
  onUpdateRating?: (spot: SpotDetail, rating: 1 | 2 | 3 | 4 | 5) => void;
}

export interface SpotDetailSheetHandle {
  minimize: () => void;
}

function getVisibilityText(spot: SpotDetail): {
  text: string;
  stale: boolean;
} {
  if (spot.latestReportAt == null || spot.averageVisibilityMeters == null) {
    return { text: 'No data yet', stale: false };
  }

  const parsed = new Date(spot.latestReportAt);
  const time = parsed.getTime();
  if (Number.isNaN(time)) {
    return { text: 'No data yet', stale: false };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.round((Date.now() - time) / dayMs));
  const relativeLabel =
    days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;

  return {
    text: `${Math.round(spot.averageVisibilityMeters)}m · ${relativeLabel}`,
    stale: days > 30,
  };
}

function FractionalStar({ fill }: { fill: number }) {
  return (
    <View style={styles.starWrap}>
      <FontAwesome name="star" size={14} color={colors.neutral[300]} />
      <View style={[styles.starOverlay, { width: `${Math.max(0, Math.min(fill, 1)) * 100}%` }]}>
        <FontAwesome name="star" size={14} color="#f59e0b" />
      </View>
    </View>
  );
}

function formatRelativeDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  const time = parsed.getTime();
  if (Number.isNaN(time)) {
    return '';
  }

  const days = Math.max(0, Math.round((Date.now() - time) / (24 * 60 * 60 * 1000)));
  if (days === 0) {
    return 'today';
  }
  if (days === 1) {
    return 'yesterday';
  }
  return `${days} days ago`;
}

function formatDiveLogDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString();
}

function aliasInitials(alias: string | null): string {
  if (!alias) {
    return 'A';
  }

  const parts = alias
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return 'A';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function currentStrengthLabel(value: number): string {
  switch (value) {
    case 1:
      return 'Calm';
    case 2:
      return 'Light';
    case 3:
      return 'Moderate';
    case 4:
      return 'Strong';
    default:
      return 'Very Strong';
  }
}

function canEditDiveLog(log: DiveLogPreview, currentUserId?: string | null): boolean {
  if (!currentUserId || log.authorId !== currentUserId) {
    return false;
  }

  const createdAt = new Date(log.createdAt);
  const createdAtMs = createdAt.getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  const editWindowMs = 48 * 60 * 60 * 1000;
  return Date.now() - createdAtMs <= editWindowMs;
}

export const SpotDetailSheet = forwardRef<
  SpotDetailSheetHandle,
  SpotDetailSheetProps
>(function SpotDetailSheet(
  {
    spot,
    isLoading,
    onDismiss,
    onParkingPress,
    onToggleFavorite,
    isTogglingFavorite = false,
    onAddPhoto,
    isUploadingPhoto = false,
    photoUploadError = null,
    onAddDive,
    currentUserId = null,
    onEditDive,
    onUpdateRating,
  },
  ref,
) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '55%', '90%'], []);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useImperativeHandle(ref, () => ({
    minimize() {
      bottomSheetRef.current?.snapToIndex(0);
    },
  }));

  useEffect(() => {
    if (spot || isLoading) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [spot, isLoading]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
    onDismiss();
  }, [onDismiss]);

  if (!spot && !isLoading) {
    return null;
  }

  const visibility = spot ? getVisibilityText(spot) : { text: 'No data yet', stale: false };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.neutral[50] }}
      handleIndicatorStyle={{ backgroundColor: colors.neutral[900], opacity: 0.3 }}
    >
      <View style={[styles.header, { backgroundColor: colors.neutral[50] }]}> 
        {isLoading && !spot ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : spot ? (
          <>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTextContainer}>
                <Text testID="spot-detail-title" style={[styles.title, { color: colors.neutral[900] }]}>
                  {spot.title}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  testID="spot-detail-favorite-toggle"
                  accessibilityRole="button"
                  accessibilityLabel={spot.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  onPress={() => {
                    if (spot) {
                      onToggleFavorite?.(spot);
                    }
                  }}
                  disabled={!spot || !onToggleFavorite || isTogglingFavorite}
                  style={styles.iconButton}
                >
                  <FontAwesome
                    name={spot.isFavorite ? 'heart' : 'heart-o'}
                    size={18}
                    color={spot.isFavorite ? colors.primary[600] : colors.neutral[700]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID="spot-detail-close-button"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={handleClosePress}
                  style={styles.iconButton}
                >
                  <FontAwesome name="close" size={18} color={colors.neutral[700]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.visibilityRow}>
              <FontAwesome name="eye" size={14} color={colors.neutral[500]} />
              <Text
                style={[
                  styles.visibilityText,
                  {
                    color:
                      visibility.text === 'No data yet'
                        ? colors.neutral[500]
                        : visibility.stale
                          ? '#d97706'
                          : colors.primary[600],
                  },
                ]}
              >
                {visibility.text}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <TouchableOpacity
                testID="spot-detail-open-rating"
                accessibilityLabel="Rate this spot"
                onPress={() => setIsRatingOpen(true)}
                style={styles.ratingTrigger}
              >
                {Array.from({ length: 5 }).map((_, index) => {
                  const fill = Math.min(Math.max((spot.averageRating ?? 0) - index, 0), 1);
                  return <FractionalStar key={index} fill={fill} />;
                })}
                {spot.reportCount > 0 ? (
                  <Text style={styles.ratingCount}>{spot.reportCount}</Text>
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                testID="spot-detail-add-dive-button"
                style={styles.addDiveButton}
                onPress={() => onAddDive?.(spot)}
              >
                <Text style={styles.addDiveButtonText}>+ Add Dive</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

      {spot ? (
        <BottomSheetScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.body}>{spot.description || 'No description available.'}</Text>
          </View>

          <View style={[styles.section, styles.accessSection]}>
            <View style={styles.accessHeader}>
              <FontAwesome name="map-marker" size={14} color={colors.neutral[600]} />
              <Text style={styles.accessTitle}>Access</Text>
            </View>
            <Text style={styles.body}>{spot.accessInfo || 'No access information available.'}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.photosHeaderRow}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <TouchableOpacity
                testID="spot-detail-add-photo-button"
                accessibilityRole="button"
                onPress={() => onAddPhoto?.(spot)}
                disabled={!onAddPhoto || isUploadingPhoto || spot.photoUrls.length >= 5}
                style={[
                  styles.addPhotoButton,
                  (!onAddPhoto || isUploadingPhoto || spot.photoUrls.length >= 5) &&
                    styles.addPhotoButtonDisabled,
                ]}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.neutral[50]} />
                ) : (
                  <Text style={styles.addPhotoButtonText}>
                    {spot.photoUrls.length >= 5 ? 'Max 5' : '+ Add Photo'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {photoUploadError ? (
              <Text testID="spot-detail-photo-upload-error" style={styles.photoUploadError}>
                {photoUploadError}
              </Text>
            ) : null}

            {spot.photoUrls.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                {spot.photoUrls.slice(0, 5).map((photoUrl, index) => (
                  <Image
                    key={`${spot.id}-photo-${index}`}
                    testID="spot-detail-photo"
                    source={{ uri: photoUrl }}
                    style={styles.photo}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.placeholderText}>No photos yet.</Text>
            )}

            {spot.photoUrls.length >= 5 ? (
              <Text testID="spot-detail-photo-limit-text" style={styles.photoLimitText}>
                Maximum 5 photos per spot.
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parking</Text>
            {spot.parkingLocations.length > 0 ? (
              spot.parkingLocations.map((parking) => (
                <TouchableOpacity
                  key={parking.id}
                  style={styles.parkingItem}
                  onPress={() => onParkingPress(parking)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="map-marker" size={16} color={colors.secondary[500]} />
                  <Text style={styles.parkingLabel}>
                    {parking.label ?? `Parking (${parking.lat.toFixed(4)}, ${parking.lon.toFixed(4)})`}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color={colors.neutral[500]} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.placeholderText}>No parking locations available.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dive Logs ({spot.diveLogs.length})</Text>
            {spot.diveLogs.length > 0 ? (
              spot.diveLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logTopRow}>
                    <View style={styles.logAuthorWrap}>
                      <View style={styles.logAvatar}>
                        <Text style={styles.logAvatarText}>
                          {aliasInitials(log.authorAlias)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.logAuthor}>
                          {log.authorAlias ?? 'Anonymous'}
                        </Text>
                        <Text style={styles.logMeta}>
                          {formatDiveLogDate(log.divedAt)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.logRelativeMeta}>{formatRelativeDate(log.divedAt)}</Text>
                  </View>
                  <View style={styles.logStatsRow}>
                    <Text style={styles.logVisibility}>{`${Math.round(log.visibilityMeters)}m`}</Text>
                    <View style={styles.currentDots}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <View
                          // keep deterministic visual dot count
                          key={index}
                          style={[
                            styles.currentDot,
                            index < log.currentStrength && styles.currentDotFilled,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.logCurrentText}>
                      {currentStrengthLabel(log.currentStrength)}
                    </Text>
                  </View>
                  {log.notesPreview ? (
                    <Text style={styles.logNotes}>{log.notesPreview}</Text>
                  ) : null}
                  {canEditDiveLog(log, currentUserId) ? (
                    <TouchableOpacity
                      testID={`spot-detail-edit-dive-${log.id}`}
                      style={styles.editDiveButton}
                      onPress={() => onEditDive?.(spot, log)}
                    >
                      <Text style={styles.editDiveButtonText}>Edit</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            ) : (
              <Text testID="spot-detail-dive-log-placeholder" style={styles.placeholderText}>
                No dives logged yet.
              </Text>
            )}
          </View>
        </BottomSheetScrollView>
      ) : null}

      {spot && onUpdateRating ? (
        <Modal transparent visible={isRatingOpen} animationType="fade" onRequestClose={() => setIsRatingOpen(false)}>
          <Pressable style={styles.ratingBackdrop} onPress={() => setIsRatingOpen(false)}>
            <Pressable testID="spot-detail-rating-modal" style={styles.ratingCard} onPress={() => {}}>
              <Text style={styles.ratingTitle}>Rate this spot</Text>
              <Text style={styles.ratingSubtitle}>{spot.title}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const currentRating = hoverRating || 0;
                  const filled = index < currentRating;
                  return (
                    <TouchableOpacity
                      key={index}
                      testID={`spot-detail-rate-${index + 1}`}
                      accessibilityLabel={`Rate ${index + 1} stars`}
                      onPressIn={() => setHoverRating(index + 1)}
                      onPressOut={() => setHoverRating(0)}
                      onPress={() => {
                        onUpdateRating(spot, (index + 1) as 1 | 2 | 3 | 4 | 5);
                        setIsRatingOpen(false);
                        setHoverRating(0);
                      }}
                    >
                      <FontAwesome
                        name="star"
                        size={34}
                        color={filled ? '#f59e0b' : colors.neutral[300]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setIsRatingOpen(false)}>
                <Text style={styles.cancelRatingText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  loadingContainer: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.h2.fontFamily,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },
  visibilityRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityText: {
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
  },
  ratingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingCount: {
    marginLeft: 4,
    color: colors.neutral[500],
    fontSize: 12,
  },
  addDiveButton: {
    backgroundColor: colors.secondary[600],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addDiveButtonText: {
    color: colors.neutral[50],
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  scrollContent: {
    backgroundColor: colors.neutral[50],
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accessSection: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    marginHorizontal: 16,
  },
  accessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  accessTitle: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: typography.h3.fontFamily,
    color: colors.neutral[900],
    marginBottom: 8,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[800],
  },
  photosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary[500],
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoButtonText: {
    color: colors.neutral[50],
    fontSize: 12,
    fontWeight: '600',
  },
  photoUploadError: {
    color: '#dc2626',
    marginBottom: 8,
    fontSize: 13,
  },
  photosRow: {
    gap: 10,
    paddingRight: 4,
  },
  photo: {
    width: 150,
    height: 100,
    borderRadius: 10,
    backgroundColor: colors.neutral[200],
  },
  photoLimitText: {
    color: colors.neutral[600],
    fontSize: 12,
    marginTop: 8,
  },
  placeholderText: {
    color: colors.neutral[600],
    fontSize: 14,
  },
  parkingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  parkingLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.neutral[800],
  },
  logRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingVertical: 10,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logAvatarText: {
    fontSize: 12,
    color: colors.neutral[700],
    fontFamily: typography.bodyBold.fontFamily,
  },
  logAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  logMeta: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  logRelativeMeta: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  logStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  logVisibility: {
    fontSize: 12,
    color: colors.secondary[700],
    backgroundColor: colors.secondary[100],
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  currentDots: {
    flexDirection: 'row',
    gap: 4,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[300],
  },
  currentDotFilled: {
    backgroundColor: colors.secondary[500],
  },
  logCurrentText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  logNotes: {
    fontSize: 13,
    color: colors.neutral[700],
    marginTop: 5,
  },
  editDiveButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editDiveButtonText: {
    fontSize: 12,
    color: colors.neutral[700],
    fontFamily: typography.bodyBold.fontFamily,
  },
  ratingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  ratingCard: {
    borderRadius: 18,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  ratingTitle: {
    fontSize: 20,
    color: colors.neutral[900],
    fontFamily: typography.h3.fontFamily,
    fontWeight: '700',
  },
  ratingSubtitle: {
    fontSize: 14,
    color: colors.neutral[600],
    marginTop: 4,
    marginBottom: 14,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cancelRatingText: {
    color: colors.neutral[600],
    fontSize: 14,
    fontWeight: '500',
  },
  starWrap: {
    width: 14,
    height: 14,
    overflow: 'hidden',
  },
  starOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
