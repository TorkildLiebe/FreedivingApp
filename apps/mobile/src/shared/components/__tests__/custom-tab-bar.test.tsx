import React from 'react';
import { render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import '@/src/__tests__/mocks/expo-vector-icons.mock';

import { CustomTabBar } from '@/src/shared/components/CustomTabBar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/src/shared/components/FrostedGlass', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    FrostedGlass: ({ children, ...rest }: { children: React.ReactNode }) => (
      <View {...rest}>{children}</View>
    ),
  };
});

function buildProps(tabBarStyle?: { display?: 'none' | 'flex' }): BottomTabBarProps {
  const state = {
    key: 'tab-state',
    index: 0,
    routeNames: ['index', 'profile'],
    routes: [
      { key: 'index-key', name: 'index', params: undefined },
      { key: 'profile-key', name: 'profile', params: undefined },
    ],
    type: 'tab',
    stale: false,
    history: [],
    preloadedRouteKeys: [],
  };

  return {
    state,
    descriptors: {
      'index-key': {
        key: 'index-key',
        options: {
          ...(tabBarStyle ? { tabBarStyle } : {}),
        },
        route: state.routes[0],
        navigation: {},
        render: jest.fn(),
      },
      'profile-key': {
        key: 'profile-key',
        options: {},
        route: state.routes[1],
        navigation: {},
        render: jest.fn(),
      },
    },
    navigation: {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      navigate: jest.fn(),
    },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as BottomTabBarProps;
}

describe('CustomTabBar', () => {
  it('renders tab buttons when tab bar is visible', () => {
    const props = buildProps();
    const { getByTestId } = render(<CustomTabBar {...props} />);

    expect(getByTestId('tab-index-button')).toBeTruthy();
    expect(getByTestId('tab-profile-button')).toBeTruthy();
  });

  it('returns null when active route sets tabBarStyle.display to none', () => {
    const props = buildProps({ display: 'none' });
    const { queryByTestId } = render(<CustomTabBar {...props} />);

    expect(queryByTestId('tab-index-button')).toBeNull();
    expect(queryByTestId('tab-profile-button')).toBeNull();
  });
});
