import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';

import '@/src/__tests__/mocks/expo-vector-icons.mock';

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
