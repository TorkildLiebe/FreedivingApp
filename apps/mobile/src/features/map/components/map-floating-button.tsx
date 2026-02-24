import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { colors } from '@/src/shared/theme';

interface MapFloatingButtonProps {
  onPress: () => void;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  style?: ViewStyle;
  testID?: string;
}

export function MapFloatingButton({ onPress, iconName, style, testID }: MapFloatingButtonProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.button,
        { backgroundColor: colors.neutral[50] },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome name={iconName} size={20} color={colors.neutral[900]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
