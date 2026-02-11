import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';

jest.mock('@expo/vector-icons/FontAwesome', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('FontAwesome', props),
  };
});

jest.mock('@/components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('MapFloatingButton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <MapFloatingButton onPress={jest.fn()} iconName="crosshairs" />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { root } = render(
      <MapFloatingButton onPress={onPress} iconName="crosshairs" />,
    );
    fireEvent.press(root);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
