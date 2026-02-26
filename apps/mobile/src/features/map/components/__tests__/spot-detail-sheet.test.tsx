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

const freshReportDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

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
  ],
  photoUrls: [],
  isFavorite: false,
  averageVisibilityMeters: 8.2,
  averageRating: 4.5,
  reportCount: 12,
  ratingCount: 5,
  latestReportAt: freshReportDate,
  diveLogs: [],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

const editableLogSpot: SpotDetail = {
  ...mockSpot,
  diveLogs: [
    {
      id: 'log-1',
      spotId: 'uuid-1',
      authorId: 'uuid-user-1',
      authorAlias: 'Test Diver',
      authorAvatarUrl: null,
      visibilityMeters: 8,
      currentStrength: 3,
      notes: 'Very clear',
      photoUrls: [],
      notesPreview: 'Very clear',
      divedAt: freshReportDate,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: freshReportDate,
    },
  ],
};

describe('SpotDetailSheet', () => {
  const defaultProps = {
    spot: null as SpotDetail | null,
    isLoading: false,
    onDismiss: jest.fn(),
    onParkingPress: jest.fn(),
    onToggleFavorite: jest.fn(),
    isTogglingFavorite: false,
    onAddPhoto: jest.fn(),
    isUploadingPhoto: false,
    photoUploadError: null as string | null,
    onAddDive: jest.fn(),
    onUpdateRating: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no spot and not loading', () => {
    const { toJSON } = render(<SpotDetailSheet {...defaultProps} />);
    expect(toJSON()).toBeNull();
  });

  it('renders spot title and header controls', () => {
    const { getByTestId, getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('Test Dive Spot')).toBeTruthy();
    expect(getByTestId('spot-detail-favorite-toggle')).toBeTruthy();
    expect(getByTestId('spot-detail-close-button')).toBeTruthy();
  });

  it('shows visibility text from latest report state', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText(/8m/)).toBeTruthy();
  });

  it('renders no-data visibility fallback when latest report missing', () => {
    const { getByText } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={{ ...mockSpot, latestReportAt: null, averageVisibilityMeters: null }}
      />,
    );

    expect(getByText('No data yet')).toBeTruthy();
  });


  it('shows rating count from ratingCount next to stars', () => {
    const { getByText, queryByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('5')).toBeTruthy();
    expect(queryByText('12')).toBeNull();
  });

  it('calls onAddDive when add dive button is pressed', () => {
    const onAddDive = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} onAddDive={onAddDive} />,
    );

    fireEvent.press(getByTestId('spot-detail-add-dive-button'));
    expect(onAddDive).toHaveBeenCalledWith(mockSpot);
  });

  it('opens rating modal and submits selected rating', () => {
    const onUpdateRating = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={mockSpot}
        onUpdateRating={onUpdateRating}
      />,
    );

    fireEvent.press(getByTestId('spot-detail-open-rating'));
    fireEvent.press(getByTestId('spot-detail-rate-4'));
    expect(onUpdateRating).toHaveBeenCalledWith(mockSpot, 4);
  });

  it('renders photos placeholder and dive log placeholder when empty', () => {
    const { getByTestId, getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );

    expect(getByText('No photos yet.')).toBeTruthy();
    expect(getByTestId('spot-detail-add-photo-button')).toBeTruthy();
    expect(getByTestId('spot-detail-dive-log-placeholder')).toBeTruthy();
  });

  it('shows edit button for own log within 48h and calls onEditDive', () => {
    const onEditDive = jest.fn();
    const { getByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={editableLogSpot}
        currentUserId="uuid-user-1"
        onEditDive={onEditDive}
      />,
    );

    fireEvent.press(getByTestId('spot-detail-edit-dive-log-1'));
    expect(onEditDive).toHaveBeenCalledWith(
      editableLogSpot,
      editableLogSpot.diveLogs[0],
    );
  });

  it('hides edit button for non-owner log', () => {
    const { queryByTestId } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={editableLogSpot}
        currentUserId="other-user"
      />,
    );

    expect(queryByTestId('spot-detail-edit-dive-log-1')).toBeNull();
  });
});
