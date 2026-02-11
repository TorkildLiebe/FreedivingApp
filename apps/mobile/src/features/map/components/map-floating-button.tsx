import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors from '@/src/shared/theme/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface MapFloatingButtonProps {
  onPress: () => void;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  style?: ViewStyle;
}

export function MapFloatingButton({ onPress, iconName, style }: MapFloatingButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: Colors[colorScheme].background },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome name={iconName} size={20} color={Colors[colorScheme].text} />
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
