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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, typography } from '@/src/shared/theme';
import type { ParkingLocation, SpotDetail } from '@/src/features/map/types';

interface SpotDetailSheetProps {
  spot: SpotDetail | null;
  isLoading: boolean;
  onDismiss: () => void;
  onParkingPress: (parking: ParkingLocation) => void;
}

export interface SpotDetailSheetHandle {
  minimize: () => void;
}

function isStale(latestReportAt: string | null): boolean {
  if (!latestReportAt) {
    return false;
  }

  const latest = new Date(latestReportAt).getTime();
  if (Number.isNaN(latest)) {
    return false;
  }

  const ageMs = Date.now() - latest;
  return ageMs > 30 * 24 * 60 * 60 * 1000;
}

export const SpotDetailSheet = forwardRef<
  SpotDetailSheetHandle,
  SpotDetailSheetProps
>(function SpotDetailSheet({ spot, isLoading, onDismiss, onParkingPress }, ref) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

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

  useEffect(() => {
    setIsFavorite(Boolean(spot?.isFavorite));
  }, [spot?.id, spot?.isFavorite]);

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

  if (!spot && !isLoading) return null;

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
                <Text style={[styles.creator, { color: colors.neutral[900], opacity: 0.6 }]}>
                  {spot.creatorDisplayName ?? 'Anonymous'}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  testID="spot-detail-favorite-toggle"
                  accessibilityRole="button"
                  onPress={() => setIsFavorite((prev) => !prev)}
                  style={styles.iconButton}
                >
                  <FontAwesome
                    name={isFavorite ? 'heart' : 'heart-o'}
                    size={18}
                    color={isFavorite ? colors.primary[500] : colors.neutral[700]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID="spot-detail-close-button"
                  accessibilityRole="button"
                  onPress={handleClosePress}
                  style={styles.iconButton}
                >
                  <FontAwesome name="close" size={18} color={colors.neutral[700]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: colors.secondary[100] }]}>
                <Text style={styles.statLabel}>Visibility</Text>
                <Text style={[styles.statValue, { color: colors.secondary[700], fontFamily: typography.mono.fontFamily }]}>
                  {spot.averageVisibilityMeters != null
                    ? `${spot.averageVisibilityMeters.toFixed(1)} m`
                    : 'No data'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={[styles.statValue, { color: colors.neutral[900] }]}>
                  {spot.averageRating != null
                    ? `${spot.averageRating.toFixed(1)} ★`
                    : 'No rating'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Reports</Text>
                <Text style={[styles.statValue, { color: colors.neutral[900] }]}>
                  {spot.reportCount}
                </Text>
              </View>
            </View>

            {isStale(spot.latestReportAt) ? (
              <Text testID="spot-detail-stale-indicator" style={styles.staleText}>
                Last report is older than 30 days
              </Text>
            ) : null}
          </>
        ) : null}
      </View>

      {spot ? (
        <BottomSheetScrollView
          style={[styles.scrollContent, { backgroundColor: colors.neutral[50] }]}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Description</Text>
            <Text style={[styles.body, { color: colors.neutral[900] }]}>
              {spot.description || 'No description available.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Access Info</Text>
            <Text style={[styles.body, { color: colors.neutral[900] }]}>
              {spot.accessInfo || 'No access information available.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Photos</Text>
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
              <Text style={[styles.body, styles.placeholderText, { color: colors.neutral[600] }]}>
                No photos yet.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Parking</Text>
            {spot.parkingLocations.length > 0 ? (
              spot.parkingLocations.map((parking) => (
                <TouchableOpacity
                  key={parking.id}
                  style={[styles.parkingItem, { borderColor: colors.neutral[900] }]}
                  onPress={() => onParkingPress(parking)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="map-marker" size={16} color={colors.secondary[500]} />
                  <Text style={[styles.parkingLabel, { color: colors.neutral[900] }]}>
                    {parking.label ??
                      `Parking (${parking.lat.toFixed(4)}, ${parking.lon.toFixed(4)})`}
                  </Text>
                  <FontAwesome
                    name="chevron-right"
                    size={12}
                    color={colors.neutral[900]}
                    style={{ opacity: 0.4 }}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.body, styles.placeholderText, { color: colors.neutral[600] }]}>
                No parking locations available.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Dive Logs</Text>
            {spot.diveLogs.length > 0 ? (
              spot.diveLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={[styles.logAuthor, { color: colors.neutral[900] }]}>
                    {log.authorAlias ?? 'Anonymous'}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.neutral[700] }]}>
                    {`${log.visibilityMeters.toFixed(1)}m visibility • current ${log.currentStrength}`}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.neutral[700] }]}>
                    {new Date(log.divedAt).toLocaleDateString()}
                  </Text>
                  {log.notesPreview ? (
                    <Text style={[styles.logPreview, { color: colors.neutral[800] }]}>
                      {log.notesPreview}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text testID="spot-detail-dive-log-placeholder" style={[styles.body, styles.placeholderText, { color: colors.neutral[600] }]}>
                No dive logs yet. Dive report support lands in M3.
              </Text>
            )}
          </View>

          <TouchableOpacity
            testID="spot-detail-add-dive-button"
            style={[styles.addDiveButton, { backgroundColor: colors.primary[500] }]}
            disabled
          >
            <Text style={styles.addDiveButtonText}>+ Add Dive (coming in M3)</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.meta, { color: colors.neutral[900], opacity: 0.5 }]}>
              Created {new Date(spot.createdAt).toLocaleDateString()}
            </Text>
            {spot.createdAt !== spot.updatedAt ? (
              <Text style={[styles.meta, { color: colors.neutral[900], opacity: 0.5 }]}>
                Updated {new Date(spot.updatedAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        </BottomSheetScrollView>
      ) : null}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  statsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[300],
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.neutral[600],
  },
  statValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  staleText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.neutral[600],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  creator: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.6,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderText: {
    fontStyle: 'italic',
  },
  photosRow: {
    gap: 10,
    paddingRight: 8,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 10,
    backgroundColor: colors.neutral[200],
  },
  parkingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  parkingLabel: {
    flex: 1,
    fontSize: 15,
  },
  logRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[300],
  },
  logAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  logMeta: {
    marginTop: 3,
    fontSize: 12,
  },
  logPreview: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  addDiveButton: {
    marginTop: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    opacity: 0.6,
  },
  addDiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
});
