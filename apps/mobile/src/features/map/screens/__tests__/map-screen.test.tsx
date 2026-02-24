import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { SpotDetail } from '@/src/features/map/types';
import '@/src/__tests__/mocks/expo-vector-icons.mock';

const mockUseLocation = jest.fn();
const mockUseSpots = jest.fn();
const mockUseSpotDetail = jest.fn();
const mockUseSpotPhotoUpload = jest.fn();
const mockUseCreateSpot = jest.fn();
const mockUseFavoriteSpots = jest.fn();
const mockUseRouter = jest.fn();
const mockPush = jest.fn();
const mockToggleFavoriteSpot = jest.fn();

jest.mock('@/src/features/map/hooks/use-location', () => ({
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
}));

jest.mock('@/src/features/map/hooks/use-spots', () => ({
  useSpots: (...args: unknown[]) => mockUseSpots(...args),
}));

jest.mock('@/src/features/map/hooks/use-spot-detail', () => ({
  useSpotDetail: (...args: unknown[]) => mockUseSpotDetail(...args),
}));

jest.mock('@/src/features/map/hooks/use-spot-photo-upload', () => ({
  useSpotPhotoUpload: (...args: unknown[]) => mockUseSpotPhotoUpload(...args),
}));

jest.mock('@/src/features/map/hooks/use-create-spot', () => ({
  useCreateSpot: (...args: unknown[]) => mockUseCreateSpot(...args),
}));

jest.mock('@/src/features/map/hooks/use-favorite-spots', () => ({
  useFavoriteSpots: (...args: unknown[]) => mockUseFavoriteSpots(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
}));

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () =>
    mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
  MediaTypeOptions: {
    Images: 'Images',
  },
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

jest.mock('@/src/features/map/components/create-spot-overlay', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    __esModule: true,
    CreateSpotOverlay: (props: any) =>
      props.visible
        ? mockReact.createElement(View, {
            testID: 'create-spot-overlay',
            ...props,
          })
        : null,
  };
});

// eslint-disable-next-line import/first
import MapScreen from '@/src/features/map/screens/map-screen';

const mockSpot: SpotDetail = {
  id: 'spot-123',
  title: 'Test Spot',
  description: 'Description',
  centerLat: 59.9,
  centerLon: 10.7,
  createdById: 'user-1',
  creatorDisplayName: 'Tester',
  accessInfo: null,
  parkingLocations: [],
  photoUrls: [],
  isFavorite: false,
  averageVisibilityMeters: null,
  averageRating: null,
  reportCount: 0,
  latestReportAt: null,
  diveLogs: [],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseLocation.mockReturnValue({
    location: null,
    error: null,
    isLoading: false,
  });

  mockUseSpots.mockReturnValue({
    spots: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  });

  mockUseSpotDetail.mockReturnValue({
    spot: null,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  });

  mockUseSpotPhotoUpload.mockReturnValue({
    uploadPhoto: jest.fn(),
    isUploading: false,
    error: null,
    clearError: jest.fn(),
  });

  mockUseCreateSpot.mockReturnValue({
    createSpot: jest.fn(),
    isSubmitting: false,
    error: null,
    clearError: jest.fn(),
  });

  mockToggleFavoriteSpot.mockResolvedValue({ error: null });
  mockUseFavoriteSpots.mockReturnValue({
    isAuthenticated: true,
    favoriteSpotIds: [],
    toggleFavoriteSpot: mockToggleFavoriteSpot,
  });

  mockUseRouter.mockReturnValue({ push: mockPush });
});

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

  it('passes photo upload and favorite toggle props to SpotDetailSheet', () => {
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    expect(sheet.props.onAddPhoto).toBeInstanceOf(Function);
    expect(sheet.props.isUploadingPhoto).toBe(false);
    expect(sheet.props.photoUploadError).toBeNull();
    expect(sheet.props.onToggleFavorite).toBeInstanceOf(Function);
    expect(sheet.props.spot.isFavorite).toBe(false);
  });

  it('reflects favorite state from auth context in SpotDetailSheet', () => {
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockUseFavoriteSpots.mockReturnValue({
      isAuthenticated: true,
      favoriteSpotIds: ['spot-123'],
      toggleFavoriteSpot: mockToggleFavoriteSpot,
    });

    const { getByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    expect(sheet.props.spot.isFavorite).toBe(true);
  });

  it('toggles favorite through auth context', async () => {
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockUseFavoriteSpots.mockReturnValue({
      isAuthenticated: true,
      favoriteSpotIds: ['spot-123'],
      toggleFavoriteSpot: mockToggleFavoriteSpot,
    });

    const { getByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    await act(async () => {
      await sheet.props.onToggleFavorite(mockSpot);
    });

    expect(mockToggleFavoriteSpot).toHaveBeenCalledWith('spot-123', false);
  });

  it('prompts login when toggling favorite while unauthenticated', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockUseFavoriteSpots.mockReturnValue({
      isAuthenticated: false,
      favoriteSpotIds: [],
      toggleFavoriteSpot: mockToggleFavoriteSpot,
    });

    const { getByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    await act(async () => {
      await sheet.props.onToggleFavorite(mockSpot);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Sign in required',
      'Please sign in to save favorite spots.',
      expect.any(Array),
    );
    expect(mockToggleFavoriteSpot).not.toHaveBeenCalled();

    const [, , buttons] = alertSpy.mock.calls[0] ?? [];
    const signInAction = buttons?.[1]?.onPress as (() => void) | undefined;
    signInAction?.();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');

    alertSpy.mockRestore();
  });

  it('renders create spot button', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-start-create-spot-button')).toBeTruthy();
  });

  it('shows create overlay after tapping create spot button', () => {
    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('map-start-create-spot-button'));

    expect(getByTestId('create-spot-overlay')).toBeTruthy();
    expect(getByTestId('create-spot-overlay').props.step).toBe('placing');
  });
});
