import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@/hooks/use-location', () => ({
  useLocation: () => ({ location: null, error: null, isLoading: false }),
}));

jest.mock('@/components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    MapView: ({ children, ...props }: any) => mockReact.createElement(View, { testID: 'map-view', ...props }, children),
    Camera: mockReact.forwardRef((props: any, ref: any) =>
      mockReact.createElement(View, { testID: 'map-camera', ref, ...props }),
    ),
    PointAnnotation: ({ children, ...props }: any) =>
      mockReact.createElement(View, { testID: 'point-annotation', ...props }, children),
  };
});

// eslint-disable-next-line import/first
import MapScreen from '@/app/(tabs)/index';

const originalPlatformOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalPlatformOS;
});

describe('MapScreen', () => {
  it('renders placeholder on web', () => {
    Platform.OS = 'web';
    const { getByText } = render(<MapScreen />);
    expect(getByText('Map is not supported on web')).toBeTruthy();
  });

  it('renders map on native', () => {
    Platform.OS = 'ios';
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders attribution text on native', () => {
    Platform.OS = 'ios';
    const { getByText } = render(<MapScreen />);
    expect(getByText(/Kartverket/)).toBeTruthy();
  });
});
