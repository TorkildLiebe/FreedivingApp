import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import type { SpotDetail } from '@/src/features/map/types';

import '@/src/__tests__/mocks/expo-vector-icons.mock';

jest.mock('@gorhom/bottom-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, ScrollView } = require('react-native');

  // eslint-disable-next-line react/display-name
  const BottomSheet = React.forwardRef(
    ({ children, ...props }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(),
      }));
      return React.createElement(
        View,
        { testID: 'bottom-sheet', ...props },
        children,
      );
    },
  );

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetScrollView: ({ children, ...props }: any) =>
      React.createElement(ScrollView, { testID: 'sheet-scroll', ...props }, children),
  };
});

// eslint-disable-next-line import/first
import { SpotDetailSheet } from '@/src/features/map/components/spot-detail-sheet';

const mockSpot: SpotDetail = {
  id: 'uuid-1',
  title: 'Test Dive Spot',
  description: 'A great dive spot for beginners',
  centerLat: 60.0,
  centerLon: 5.0,
  createdById: 'uuid-user-1',
  creatorDisplayName: 'TestUser',
  accessInfo: 'Park at the pier and walk 200m',
  parkingLocations: [
    { id: 'p-1', lat: 60.01, lon: 5.01, label: 'Main parking' },
    { id: 'p-2', lat: 60.02, lon: 5.02, label: null },
  ],
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

  it('renders spot title and creator name', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );
    expect(getByText('Test Dive Spot')).toBeTruthy();
    expect(getByText('TestUser')).toBeTruthy();
  });

  it('shows Anonymous when creator display name is null', () => {
    const spotWithoutCreator = { ...mockSpot, creatorDisplayName: null };
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={spotWithoutCreator} />,
    );
    expect(getByText('Anonymous')).toBeTruthy();
  });

  it('renders description and access info', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );
    expect(getByText('A great dive spot for beginners')).toBeTruthy();
    expect(getByText('Park at the pier and walk 200m')).toBeTruthy();
  });

  it('renders parking locations as tappable items', () => {
    const onParkingPress = jest.fn();
    const { getByText } = render(
      <SpotDetailSheet
        {...defaultProps}
        spot={mockSpot}
        onParkingPress={onParkingPress}
      />,
    );

    const parkingItem = getByText('Main parking');
    expect(parkingItem).toBeTruthy();

    fireEvent.press(parkingItem);
    expect(onParkingPress).toHaveBeenCalledWith(mockSpot.parkingLocations[0]);
  });

  it('shows coordinate fallback for parking without label', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );
    expect(getByText(/60\.0200.*5\.0200/)).toBeTruthy();
  });

  it('renders created and updated dates', () => {
    const { getByText } = render(
      <SpotDetailSheet {...defaultProps} spot={mockSpot} />,
    );
    expect(getByText(/Created/)).toBeTruthy();
    expect(getByText(/Updated/)).toBeTruthy();
  });

  it('does not show updated date when same as created', () => {
    const spotSameDate = { ...mockSpot, updatedAt: mockSpot.createdAt };
    const { queryByText } = render(
      <SpotDetailSheet {...defaultProps} spot={spotSameDate} />,
    );
    expect(queryByText(/Updated/)).toBeNull();
  });
});
