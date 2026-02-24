import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { SpotDetail } from '@/src/features/map/types';

import '@/src/__tests__/mocks/expo-vector-icons.mock';

jest.mock('@gorhom/bottom-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ScrollView, View } = require('react-native');

  // eslint-disable-next-line react/display-name
  const BottomSheet = React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return React.createElement(View, { testID: 'bottom-sheet', ...props }, children);
  });

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetScrollView: ({ children, ...props }: any) =>
      React.createElement(ScrollView, { testID: 'sheet-scroll', ...props }, children),
  };
});

// eslint-disable-next-line import/first
import { SpotDetailSheet } from '@/src/features/map/components/spot-detail-sheet';

const oldReportDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();

const mockSpot: SpotDetail = {
  id: 'uuid-1',
  title: 'Test Dive Spot',
  description: 'A great dive spot for beginners',
  centerLat: 60,
  centerLon: 5,
  createdById: 'uuid-user-1',
  creatorDisplayName: 'TestUser',
  accessInfo: 'Park at the pier and walk 200m',
  parkingLocations: [
    { id: 'p-1', lat: 60.01, lon: 5.01, label: 'Main parking' },
    { id: 'p-2', lat: 60.02, lon: 5.02, label: null },
  ],
  photoUrls: [],
  isFavorite: false,
  averageVisibilityMeters: 8.2,
  averageRating: 4.5,
  reportCount: 12,
  latestReportAt: oldReportDate,
  diveLogs: [],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

describe('SpotDetailSheet', () => {
  const defaultProps = {
    spot: null as SpotDetail | null,
    isLoading: false,
    onDismiss: jest.fn(),
    onParkingPress: jest.fn(),
    onAddPhoto: jest.fn(),
    isUploadingPhoto: false,
    photoUploadError: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no spot and not loading', () => {
    const { toJSON } = render(<SpotDetailSheet {...defaultProps} />);
    expect(toJSON()).toBeNull();
  });

  it('shows loading indicator when isLoading and no spot', () => {
    const { getByTestId } = render(
      <SpotDetailSheet {...defaultProps} isLoading />,
    );
    expect(getByTestId('bottom-sheet')).toBeTruthy();
  });

  it('renders spot title and header controls', () => {
    const { getByTestId, getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('Test Dive Spot')).toBeTruthy();
    expect(getByTestId('spot-detail-favorite-toggle')).toBeTruthy();
    expect(getByTestId('spot-detail-close-button')).toBeTruthy();
  });

  it('calls onDismiss when close button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} onDismiss={onDismiss} />,
    );

    fireEvent.press(getByTestId('spot-detail-close-button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders stats row values and stale indicator', () => {
    const { getByTestId, getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('8.2 m')).toBeTruthy();
    expect(getByText('4.5 ★')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByTestId('spot-detail-stale-indicator')).toBeTruthy();
  });

  it('does not show stale indicator when latestReportAt is null', () => {
    const { queryByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={{ ...mockSpot, latestReportAt: null }}
      />,
    );

    expect(queryByTestId('spot-detail-stale-indicator')).toBeNull();
  });

  it('renders description and access info', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('A great dive spot for beginners')).toBeTruthy();
    expect(getByText('Park at the pier and walk 200m')).toBeTruthy();
  });

  it('renders photos placeholder and dive logs placeholder when empty', () => {
    const { getByTestId, getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('No photos yet.')).toBeTruthy();
    expect(getByTestId('spot-detail-add-photo-button')).toBeTruthy();
    expect(getByTestId('spot-detail-dive-log-placeholder')).toBeTruthy();
    expect(
      getByTestId('spot-detail-add-dive-button').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('renders photo items when photo URLs are present', () => {
    const { getAllByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={{
          ...mockSpot,
          photoUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        }}
      />,
    );

    expect(getAllByTestId('spot-detail-photo')).toHaveLength(2);
  });

  it('calls onAddPhoto when add photo button is pressed', () => {
    const onAddPhoto = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={mockSpot}
        onAddPhoto={onAddPhoto}
      />,
    );

    fireEvent.press(getByTestId('spot-detail-add-photo-button'));
    expect(onAddPhoto).toHaveBeenCalledWith(mockSpot);
  });

  it('shows limit text and disables add photo button when max photos reached', () => {
    const onAddPhoto = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        onAddPhoto={onAddPhoto}
        spot={{
          ...mockSpot,
          photoUrls: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
            'https://example.com/5.jpg',
          ],
        }}
      />,
    );

    expect(getByTestId('spot-detail-photo-limit-text')).toBeTruthy();
    expect(
      getByTestId('spot-detail-add-photo-button').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('renders photo upload error message when provided', () => {
    const { getByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={mockSpot}
        photoUploadError="Failed to upload"
      />,
    );

    expect(getByTestId('spot-detail-photo-upload-error')).toBeTruthy();
  });

  it('renders parking locations and handles parking press', () => {
    const onParkingPress = jest.fn();
    const { getByText } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={mockSpot}
        onParkingPress={onParkingPress}
      />,
    );

    fireEvent.press(getByText('Main parking'));
    expect(onParkingPress).toHaveBeenCalledWith(mockSpot.parkingLocations[0]);
    expect(getByText(/60\.0200.*5\.0200/)).toBeTruthy();
  });
});
