import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/src/__tests__/mocks/expo-vector-icons.mock';
import { MapFloatingButton } from '@/src/features/map/components/map-floating-button';

describe('MapFloatingButton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <MapFloatingButton onPress={jest.fn()} iconName="crosshairs" />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MapFloatingButton
        onPress={onPress}
        iconName="crosshairs"
        testID="map-floating-button"
      />,
    );
    fireEvent.press(getByTestId('map-floating-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
