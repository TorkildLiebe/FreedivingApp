import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, typography } from '@/src/shared/theme';

const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Not great',
  2: 'It was okay',
  3: 'Pretty good',
  4: 'Really good',
  5: 'Outstanding',
};

interface RatingSheetProps {
  visible: boolean;
  spotName: string;
  isSubmitting: boolean;
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void> | void;
  onDismiss: () => void;
}

export function RatingSheet({
  visible,
  spotName,
  isSubmitting,
  onRate,
  onDismiss,
}: RatingSheetProps) {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const activeLabel = useMemo(() => {
    if (!selected) {
      return null;
    }
    return RATING_LABELS[selected];
  }, [selected]);

  const handleRate = async (rating: 1 | 2 | 3 | 4 | 5) => {
    setSelected(rating);
    await onRate(rating);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>Dive logged</Text>
          <Text style={styles.title}>How would you rate</Text>
          <Text style={styles.spotName}>{`${spotName}?`}</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((rawStar) => {
              const star = rawStar as 1 | 2 | 3 | 4 | 5;
              const active = selected != null && star <= selected;
              return (
                <TouchableOpacity
                  key={star}
                  testID={`rating-sheet-star-${star}`}
                  accessibilityLabel={`Rate ${star} stars`}
                  onPress={() => {
                    void handleRate(star);
                  }}
                  disabled={isSubmitting}
                  style={styles.starButton}
                >
                  <Text style={[styles.starText, active && styles.starTextActive]}>★</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.labelRow}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primary[600]} />
            ) : activeLabel ? (
              <Text style={styles.ratingLabel}>{activeLabel}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            testID="rating-sheet-dismiss-button"
            onPress={onDismiss}
            disabled={isSubmitting}
          >
            <Text style={styles.dismissText}>Not now</Text>
          </TouchableOpacity>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.neutral[50],
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.neutral[300],
    marginBottom: 20,
  },
  kicker: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    ...typography.h2,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  spotName: {
    ...typography.h2,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 38,
    color: colors.neutral[300],
    lineHeight: 40,
  },
  starTextActive: {
    color: colors.primary[500],
  },
  labelRow: {
    minHeight: 22,
    marginBottom: 16,
  },
  ratingLabel: {
    ...typography.body,
    color: colors.primary[600],
    fontFamily: 'SpaceGrotesk-600',
  },
  dismissText: {
    ...typography.body,
    color: colors.neutral[500],
  },
});
