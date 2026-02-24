import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { FrostedGlass } from '@/src/shared/components/FrostedGlass';
import { colors } from '@/src/shared/theme';

const TAB_ICONS: Record<string, React.ComponentProps<typeof FontAwesome>["name"]> = {
  index: "map",
  profile: "user",
};

const TAB_LABELS: Record<string, string> = {
  index: "Map",
  profile: "Profile",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <FrostedGlass style={[styles.container, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? "circle";
        const label = TAB_LABELS[route.name] ?? route.name;
        const iconColor = isFocused ? colors.primary[500] : colors.neutral[500];

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.tab}
            testID={"tab-" + route.name + "-button"}
          >
            <FontAwesome name={iconName} size={24} color={iconColor} />
            <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </FrostedGlass>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
});
