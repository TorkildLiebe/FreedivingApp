import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/hooks/use-location', () => ({
  useLocation: () => ({ location: null, error: null, isLoading: false }),
}));

jest.mock('@/components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/map-view', () => {
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

// eslint-disable-next-line import/first
import MapScreen from '@/app/(tabs)/index';

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
    expect(mapView.props.styleJSON).toContain('kartverket');
    expect(mapView.props.zoom).toBe(10);
    expect(mapView.props.center).toEqual({ lat: 59.9139, lng: 10.7522 });
  });
});
