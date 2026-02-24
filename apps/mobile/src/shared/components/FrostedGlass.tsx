import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

// Frosted glass visual recipe constants (light mode only for M1)
// These are intentionally internal — they are composite style recipes, not re-exportable tokens (D-006)
const FROSTED_BACKGROUND = 'rgba(255, 255, 255, 0.8)';
const FROSTED_BORDER_COLOR = 'rgba(231, 229, 228, 0.6)'; // stone-200 @ 60%

type FrostedGlassProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function FrostedGlass({ children, style, intensity = 70 }: FrostedGlassProps) {
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          backgroundColor: FROSTED_BACKGROUND,
          borderColor: FROSTED_BORDER_COLOR,
          borderWidth: 1,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}
