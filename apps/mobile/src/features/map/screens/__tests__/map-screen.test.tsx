import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import type { SpotDetail } from '@/src/features/map/types';
import '@/src/__tests__/mocks/expo-vector-icons.mock';

const mockUseLocation = jest.fn();
const mockUseSpots = jest.fn();
const mockUseSpotDetail = jest.fn();
const mockUseSpotPhotoUpload = jest.fn();
const mockUseDiveLogSubmit = jest.fn();
const mockUseCreateSpot = jest.fn();
const mockUseFavoriteSpots = jest.fn();
const mockUseRouter = jest.fn();
const mockUseNavigation = jest.fn();
const mockApiFetch = jest.fn();
const mockPush = jest.fn();
const mockSetOptions = jest.fn();
const mockToggleFavoriteSpot = jest.fn();
const mockRefreshSpots = jest.fn();
const mockUpsertSpotSummary = jest.fn();

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

jest.mock('@/src/features/map/hooks/use-dive-log-submit', () => ({
  useDiveLogSubmit: (...args: unknown[]) => mockUseDiveLogSubmit(...args),
}));

jest.mock('@/src/features/map/hooks/use-create-spot', () => ({
  useCreateSpot: (...args: unknown[]) => mockUseCreateSpot(...args),
}));

jest.mock('@/src/features/map/hooks/use-favorite-spots', () => ({
  useFavoriteSpots: (...args: unknown[]) => mockUseFavoriteSpots(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
  useNavigation: (...args: unknown[]) => mockUseNavigation(...args),
}));

jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
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
    MapView: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ flyTo: jest.fn() }));
      return mockReact.createElement(View, { testID: 'map-view', ...props });
    }),
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

jest.mock('@/src/features/map/components/rating-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    __esModule: true,
    RatingSheet: (props: any) =>
      props.visible
        ? mockReact.createElement(View, { testID: 'rating-sheet', ...props })
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
  ratingCount: 0,
  latestReportAt: null,
  diveLogs: [],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApiFetch.mockResolvedValue({} as never);
  mockRefreshSpots.mockReset();
  mockUpsertSpotSummary.mockReset();

  mockUseLocation.mockReturnValue({
    location: null,
    error: null,
    isLoading: false,
  });

  mockUseSpots.mockReturnValue({
    spots: [],
    isLoading: false,
    error: null,
    refresh: mockRefreshSpots,
    upsertSpotSummary: mockUpsertSpotSummary,
    removeSpotSummary: jest.fn(),
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
  mockUseDiveLogSubmit.mockReturnValue({
    submitDiveLog: jest.fn(),
    updateDiveLog: jest.fn(),
    isSubmitting: false,
    isUploadingPhotos: false,
    error: null,
    clearError: jest.fn(),
  });

  mockToggleFavoriteSpot.mockResolvedValue({ error: null });
  mockUseFavoriteSpots.mockReturnValue({
    isAuthenticated: true,
    favoriteSpotIds: [],
    currentUserId: 'user-1',
    toggleFavoriteSpot: mockToggleFavoriteSpot,
  });

  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseNavigation.mockReturnValue({ setOptions: mockSetOptions });
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

  it('shows a loading state while summaries are loading and no spots are cached', () => {
    mockUseSpots.mockReturnValue({
      spots: [],
      isLoading: true,
      error: null,
      refresh: mockRefreshSpots,
      upsertSpotSummary: mockUpsertSpotSummary,
      removeSpotSummary: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);

    expect(getByTestId('map-spots-loading-state')).toBeTruthy();
  });

  it('shows a retry state when summary loading fails', () => {
    mockUseSpots.mockReturnValue({
      spots: [],
      isLoading: false,
      error: 'Failed to load spots',
      refresh: mockRefreshSpots,
      upsertSpotSummary: mockUpsertSpotSummary,
      removeSpotSummary: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('map-retry-spots-button'));
    expect(mockRefreshSpots).toHaveBeenCalledWith();
  });

  it('uses Design OS search placeholder copy', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-search-input').props.placeholder).toBe(
      'Search dive spots...',
    );
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

  it('clears selection and restores create button when spot detail fails to load', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockUseSpotDetail.mockImplementation((spotId: string | null) => ({
      spot: null,
      isLoading: false,
      error: spotId ? 'Failed to load spot details' : null,
      refresh: jest.fn(),
    }));

    const { getByTestId, queryByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    act(() => {
      mapView.props.onSpotPress('spot-123');
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Spot unavailable',
        'Failed to load this dive spot. Please try another spot or retry.',
      );
    });

    expect(queryByTestId('map-start-create-spot-button')).toBeTruthy();
    alertSpy.mockRestore();
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
      currentUserId: 'user-1',
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
      currentUserId: 'user-1',
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
      currentUserId: null,
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

  it('hides tab bar while creating a spot', () => {
    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('map-start-create-spot-button'));

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        tabBarStyle: { display: 'none' },
      }),
    );
  });

  it('updates pin coordinate text source from live map center callback', () => {
    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('map-start-create-spot-button'));
    const mapView = getByTestId('map-view');

    act(() => {
      mapView.props.onMapCenterDidChange({ lat: 60.1234, lng: 11.5678 });
    });

    expect(getByTestId('create-spot-overlay').props.pinCoordinate).toEqual({
      lat: 60.1234,
      lng: 11.5678,
    });
  });

  it('shows draft markers only when form sheet is collapsed', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    fireEvent.press(getByTestId('map-start-create-spot-button'));
    act(() => {
      getByTestId('create-spot-overlay').props.onConfirmPin();
    });

    expect(mapView.props.draftSpotCoordinate).toBeNull();
    expect(mapView.props.draftParkingLocations).toEqual([]);

    act(() => {
      getByTestId('create-spot-overlay').props.onStartParkingPlacement();
      getByTestId('create-spot-overlay').props.onConfirmParkingPlacement();
    });

    expect(getByTestId('map-view').props.draftSpotCoordinate).toBeNull();
    expect(getByTestId('map-view').props.draftParkingLocations).toEqual([]);

    act(() => {
      getByTestId('create-spot-overlay').props.onFormSheetIndexChange(0);
    });

    expect(getByTestId('map-view').props.draftSpotCoordinate).toEqual({
      lat: 59.9139,
      lng: 10.7522,
    });
    expect(getByTestId('map-view').props.draftParkingLocations).toEqual([
      { lat: 59.9139, lon: 10.7522, label: '' },
    ]);
  });

  it('submits create payload with the latest center selected by the user', async () => {
    const createSpot = jest.fn().mockRejectedValue(new Error('create failed'));
    mockUseCreateSpot.mockReturnValue({
      createSpot,
      isSubmitting: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    fireEvent.press(getByTestId('map-start-create-spot-button'));
    act(() => {
      mapView.props.onMapCenterDidChange({ lat: 60.4321, lng: 11.2345 });
    });
    expect(getByTestId('create-spot-overlay').props.pinCoordinate).toEqual({
      lat: 60.4321,
      lng: 11.2345,
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onConfirmPin();
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onTitleChange('Updated center');
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onSubmit();
    });

    await waitFor(() => {
      expect(createSpot).toHaveBeenCalledWith(
        expect.objectContaining({
          centerLat: 60.4321,
          centerLon: 11.2345,
        }),
      );
    });
  });

  it('returns to placing on 409 and accepts a retried center after panning', async () => {
    const createSpot = jest
      .fn()
      .mockRejectedValueOnce({
        status: 409,
        message: 'A dive spot already exists within 1000m of this location',
      })
      .mockRejectedValueOnce(new Error('retry create failed'));
    mockUseCreateSpot.mockReturnValue({
      createSpot,
      isSubmitting: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    fireEvent.press(getByTestId('map-start-create-spot-button'));
    act(() => {
      mapView.props.onMapCenterDidChange({ lat: 59.9139, lng: 10.7522 });
    });
    expect(getByTestId('create-spot-overlay').props.pinCoordinate).toEqual({
      lat: 59.9139,
      lng: 10.7522,
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onConfirmPin();
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onTitleChange('Too close');
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onSubmit();
    });

    await waitFor(() => {
      const overlay = getByTestId('create-spot-overlay');
      expect(overlay.props.step).toBe('placing');
      expect(overlay.props.error).toContain('Move the pin and try again.');
    });

    act(() => {
      mapView.props.onMapCenterDidChange({ lat: 60.5, lng: 11.5 });
    });
    expect(getByTestId('create-spot-overlay').props.pinCoordinate).toEqual({
      lat: 60.5,
      lng: 11.5,
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onConfirmPin();
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onSubmit();
    });

    await waitFor(() => {
      expect(createSpot).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          centerLat: 59.9139,
          centerLon: 10.7522,
        }),
      );
      expect(createSpot).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          centerLat: 60.5,
          centerLon: 11.5,
        }),
      );
    });
  });

  it('adds a newly created spot summary to the in-memory map cache', async () => {
    const createSpot = jest.fn().mockResolvedValue({
      ...mockSpot,
      id: 'spot-new',
      title: 'Fresh Spot',
      centerLat: 60.25,
      centerLon: 11.25,
    });
    mockUseCreateSpot.mockReturnValue({
      createSpot,
      isSubmitting: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('map-start-create-spot-button'));
    act(() => {
      getByTestId('create-spot-overlay').props.onConfirmPin();
    });
    act(() => {
      getByTestId('create-spot-overlay').props.onTitleChange('Fresh Spot');
    });
    await act(async () => {
      await getByTestId('create-spot-overlay').props.onSubmit();
    });

    await waitFor(() => {
      expect(mockUpsertSpotSummary).toHaveBeenCalledWith({
        id: 'spot-new',
        title: 'Fresh Spot',
        centerLat: 60.25,
        centerLon: 11.25,
      });
    });
  });

  it('posts spot rating when selecting a post-dive star', async () => {
    const submitDiveLog = jest.fn().mockResolvedValue({
      shouldPromptRating: true,
    });
    mockUseDiveLogSubmit.mockReturnValue({
      submitDiveLog,
      updateDiveLog: jest.fn(),
      isSubmitting: false,
      isUploadingPhotos: false,
      error: null,
      clearError: jest.fn(),
    });
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    act(() => {
      sheet.props.onAddDive(mockSpot);
    });
    fireEvent.press(getByTestId('add-dive-next-button'));
    await act(async () => {
      fireEvent.press(getByTestId('add-dive-submit-button'));
    });

    await waitFor(() => {
      expect(getByTestId('rating-sheet')).toBeTruthy();
    });

    await act(async () => {
      await getByTestId('rating-sheet').props.onRate(4);
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/spots/spot-123/ratings', {
      method: 'POST',
      body: JSON.stringify({ rating: 4 }),
    });
  });

  it('does not re-prompt rating in the same session after dismissing Not now', async () => {
    const submitDiveLog = jest.fn().mockResolvedValue({
      shouldPromptRating: true,
    });
    mockUseDiveLogSubmit.mockReturnValue({
      submitDiveLog,
      updateDiveLog: jest.fn(),
      isSubmitting: false,
      isUploadingPhotos: false,
      error: null,
      clearError: jest.fn(),
    });
    mockUseSpotDetail.mockReturnValue({
      spot: mockSpot,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByTestId, queryByTestId } = render(<MapScreen />);
    const sheet = getByTestId('spot-detail-sheet');

    act(() => {
      sheet.props.onAddDive(mockSpot);
    });
    fireEvent.press(getByTestId('add-dive-next-button'));
    await act(async () => {
      fireEvent.press(getByTestId('add-dive-submit-button'));
    });
    await waitFor(() => {
      expect(getByTestId('rating-sheet')).toBeTruthy();
    });

    act(() => {
      getByTestId('rating-sheet').props.onDismiss();
    });
    expect(queryByTestId('rating-sheet')).toBeNull();

    act(() => {
      sheet.props.onAddDive(mockSpot);
    });
    fireEvent.press(getByTestId('add-dive-next-button'));
    await act(async () => {
      fireEvent.press(getByTestId('add-dive-submit-button'));
    });

    await waitFor(() => {
      expect(submitDiveLog).toHaveBeenCalledTimes(2);
    });
    expect(queryByTestId('rating-sheet')).toBeNull();
  });
});
