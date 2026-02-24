import React from 'react';
import { act, render } from '@testing-library/react-native';

import '@/src/__tests__/mocks/expo-vector-icons.mock';

jest.mock('@/src/features/map/hooks/use-location', () => ({
  useLocation: () => ({ location: null, error: null, isLoading: false }),
}));

jest.mock('@/src/features/map/hooks/use-spots', () => ({
  useSpots: () => ({ spots: [], isLoading: false, error: null }),
}));

jest.mock('@/src/features/map/hooks/use-spot-detail', () => ({
  useSpotDetail: () => ({ spot: null, isLoading: false, error: null }),
}));

jest.mock('@/src/features/map/components/map-view', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    __esModule: true,
    MapView: mockReact.forwardRef((props: any, ref: any) =>
      mockReact.createElement(View, { testID: 'map-view', ref, ...props }),
    ),
  };
});

jest.mock('@/src/features/map/components/spot-detail-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    __esModule: true,
    SpotDetailSheet: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ minimize: jest.fn() }));
      return mockReact.createElement(View, {
        testID: 'spot-detail-sheet',
        ...props,
      });
    }),
  };
});

// eslint-disable-next-line import/first
import MapScreen from '@/src/features/map/screens/map-screen';

describe('MapScreen', () => {
  it('renders MapView component', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders attribution text', () => {
    const { getByText } = render(<MapScreen />);
    expect(getByText(/Kartverket/)).toBeTruthy();
  });

  it('passes correct props to MapView', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');
    expect(mapView.props.tileUrl).toContain('kartverket');
    expect(mapView.props.zoom).toBe(10);
    expect(mapView.props.center).toEqual({ lat: 59.9139, lng: 10.7522 });
  });

  it('passes onSpotPress and onParkingPress to MapView', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');
    expect(mapView.props.onSpotPress).toBeInstanceOf(Function);
    expect(mapView.props.onParkingPress).toBeInstanceOf(Function);
    expect(mapView.props.selectedSpotId).toBeNull();
  });

  it('updates selectedSpotId when a spot marker is pressed', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    act(() => {
      mapView.props.onSpotPress('spot-123');
    });

    expect(getByTestId('map-view').props.selectedSpotId).toBe('spot-123');
  });

  it('renders SpotDetailSheet', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('spot-detail-sheet')).toBeTruthy();
  });
});
