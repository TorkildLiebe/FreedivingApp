import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '@/src/shared/theme';
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

export const SpotDetailSheet = forwardRef<
  SpotDetailSheetHandle,
  SpotDetailSheetProps
>(function SpotDetailSheet({ spot, isLoading, onDismiss, onParkingPress }, ref) {
  const bottomSheetRef = useRef<BottomSheet>(null);
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

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

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
      {/* Fixed header: title + creator */}
      <View style={[styles.header, { backgroundColor: colors.neutral[50] }]}>
        {isLoading && !spot ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : spot ? (
          <>
            <Text testID="spot-detail-title" style={[styles.title, { color: colors.neutral[900] }]}>
              {spot.title}
            </Text>
            <Text
              style={[styles.creator, { color: colors.neutral[900], opacity: 0.6 }]}
            >
              {spot.creatorDisplayName ?? 'Anonymous'}
            </Text>
          </>
        ) : null}
      </View>

      {/* Scrollable content */}
      {spot ? (
        <BottomSheetScrollView
          style={[styles.scrollContent, { backgroundColor: colors.neutral[50] }]}
        >
          {spot.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
                Description
              </Text>
              <Text style={[styles.body, { color: colors.neutral[900] }]}>
                {spot.description}
              </Text>
            </View>
          ) : null}

          {spot.accessInfo ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
                Access Info
              </Text>
              <Text style={[styles.body, { color: colors.neutral[900] }]}>
                {spot.accessInfo}
              </Text>
            </View>
          ) : null}

          {spot.parkingLocations.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
                Parking
              </Text>
              {spot.parkingLocations.map((parking) => (
                <TouchableOpacity
                  key={parking.id}
                  style={[
                    styles.parkingItem,
                    { borderColor: colors.neutral[900] },
                  ]}
                  onPress={() => onParkingPress(parking)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="map-marker" size={16} color="#2196F3" />
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
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text
              style={[styles.meta, { color: colors.neutral[900], opacity: 0.5 }]}
            >
              Created {new Date(spot.createdAt).toLocaleDateString()}
            </Text>
            {spot.createdAt !== spot.updatedAt ? (
              <Text
                style={[styles.meta, { color: colors.neutral[900], opacity: 0.5 }]}
              >
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
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
});
