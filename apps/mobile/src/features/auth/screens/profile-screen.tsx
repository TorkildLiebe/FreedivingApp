import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, typography } from '@/src/shared/theme';

export default function ProfileScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 280 });
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.placeholder}>Profile coming in M4</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: colors.neutral[50],
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    ...typography.body,
    color: colors.neutral[900],
  },
});
