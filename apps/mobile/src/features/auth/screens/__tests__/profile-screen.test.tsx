import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ProfileScreen from '@/src/features/auth/screens/profile-screen';

const mockUseProfileData = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/src/features/auth/hooks/use-profile-data', () => ({
  useProfileData: () => mockUseProfileData(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseProfileData.mockReturnValue({
    profile: {
      id: 'user-1',
      email: 'diver@example.com',
      alias: 'Deep Diver',
      bio: 'Cold water explorer',
      avatarUrl: null,
      role: 'user',
      preferredLanguage: 'en',
      favoriteSpotIds: ['spot-1'],
      createdAt: '2023-08-01T10:00:00.000Z',
    },
    stats: {
      totalReports: 6,
      uniqueSpotsDived: 4,
      favoritesCount: 1,
      memberSince: '2023-08-01T10:00:00.000Z',
    },
    diveReports: [
      {
        id: 'log-1',
        spotId: 'spot-1',
        spotName: 'Oslofjord Wall',
        date: '2026-02-01T10:00:00.000Z',
        visibilityMeters: 9,
        currentStrength: 2,
        notesPreview: 'Clear and calm day.',
      },
    ],
    createdSpots: [
      {
        id: 'spot-1',
        name: 'Oslofjord Wall',
        createdAt: '2025-12-01T10:00:00.000Z',
        reportCount: 3,
      },
    ],
    favorites: [
      {
        id: 'spot-2',
        spotId: 'spot-2',
        spotName: 'Nesodden Drop',
        latestVisibilityMeters: 11,
        latestReportDate: '2026-01-20T10:00:00.000Z',
      },
    ],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  });
});

function renderProfileScreen() {
  return render(<ProfileScreen />);
}

describe('ProfileScreen', () => {
  it('renders profile shell with stats and sections', () => {
    const { getByTestId, getByText } = renderProfileScreen();

    expect(getByTestId('profile-header-alias').props.children).toBe('Deep Diver');
    expect(getByTestId('profile-avatar-initials').props.children).toBe('DD');

    expect(getByTestId('profile-stats-total-reports').props.children).toBe(6);
    expect(getByTestId('profile-stats-unique-spots').props.children).toBe(4);
    expect(getByTestId('profile-stats-favorites').props.children).toBe(1);

    expect(getByTestId('profile-row-reports')).toBeTruthy();
    expect(getByTestId('profile-row-spots')).toBeTruthy();
    expect(getByTestId('profile-row-favorites')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
  });

  it('renders report cards and navigates back to menu', () => {
    const { getByTestId, getByText, queryByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-reports'));

    expect(getByTestId('profile-view-title').props.children).toBe('Dive Reports');
    expect(getByTestId('profile-report-card-0')).toBeTruthy();
    expect(getByText('Oslofjord Wall')).toBeTruthy();
    expect(getByText('9m visibility')).toBeTruthy();
    expect(getByText('Light current')).toBeTruthy();
    expect(getByText('Clear and calm day.')).toBeTruthy();

    fireEvent.press(getByTestId('profile-back-button'));

    expect(queryByTestId('profile-view-title')).toBeNull();
    expect(getByTestId('profile-row-reports')).toBeTruthy();
  });

  it('renders spot and favorite cards in activity detail views', () => {
    const { getByTestId, getByText } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-spots'));
    expect(getByTestId('profile-created-spot-card-0')).toBeTruthy();
    expect(getByText('3 reports')).toBeTruthy();

    fireEvent.press(getByTestId('profile-back-button'));

    fireEvent.press(getByTestId('profile-row-favorites'));
    expect(getByTestId('profile-favorite-spot-card-0')).toBeTruthy();
    expect(getByText('11m latest visibility')).toBeTruthy();
  });

  it('renders empty states for all activity detail views', () => {
    mockUseProfileData.mockReturnValue({
      profile: {
        id: 'user-1',
        email: 'diver@example.com',
        alias: 'Deep Diver',
        bio: null,
        avatarUrl: null,
        role: 'user',
        preferredLanguage: 'en',
        favoriteSpotIds: [],
        createdAt: '2023-08-01T10:00:00.000Z',
      },
      stats: {
        totalReports: 0,
        uniqueSpotsDived: 0,
        favoritesCount: 0,
        memberSince: '2023-08-01T10:00:00.000Z',
      },
      diveReports: [],
      createdSpots: [],
      favorites: [],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-reports'));
    expect(getByTestId('profile-reports-empty')).toBeTruthy();
    fireEvent.press(getByTestId('profile-back-button'));

    fireEvent.press(getByTestId('profile-row-spots'));
    expect(getByTestId('profile-spots-empty')).toBeTruthy();
    fireEvent.press(getByTestId('profile-back-button'));

    fireEvent.press(getByTestId('profile-row-favorites'));
    expect(getByTestId('profile-favorites-empty')).toBeTruthy();
  });

  it('renders loading and error states', () => {
    mockUseProfileData.mockReturnValueOnce({
      profile: null,
      stats: null,
      diveReports: [],
      createdSpots: [],
      favorites: [],
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText, rerender } = renderProfileScreen();
    expect(getByText('Loading profile...')).toBeTruthy();

    mockUseProfileData.mockReturnValueOnce({
      profile: null,
      stats: null,
      diveReports: [],
      createdSpots: [],
      favorites: [],
      isLoading: false,
      error: 'Boom',
      refresh: jest.fn(),
    });

    rerender(<ProfileScreen />);
    expect(getByText('Profile unavailable')).toBeTruthy();
    expect(getByText('Boom')).toBeTruthy();
  });
});
