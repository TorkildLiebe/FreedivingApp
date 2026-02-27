import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileScreen from '@/src/features/auth/screens/profile-screen';
import { apiFetch } from '@/src/infrastructure/api/client';

const mockUseProfileData = jest.fn();
const refreshMock = jest.fn();
const mockSignOut = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/src/features/auth/hooks/use-profile-data', () => ({
  useProfileData: () => mockUseProfileData(),
}));

jest.mock('@/src/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  refreshMock.mockReset();
  mockSignOut.mockReset();
  mockSignOut.mockResolvedValue(undefined);
  mockApiFetch.mockResolvedValue({} as never);
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
    refresh: refreshMock,
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

  it('opens language picker and persists selected language', async () => {
    const { getByTestId, queryByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-language'));
    expect(getByTestId('profile-view-title').props.children).toBe('Language');
    expect(getByTestId('profile-language-check-en')).toBeTruthy();
    expect(queryByTestId('profile-language-check-no')).toBeNull();

    fireEvent.press(getByTestId('profile-language-option-no'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ preferredLanguage: 'no' }),
        }),
      );
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it('signs out when pressing logout row', async () => {
    const { getByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
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

  it('enters edit mode, validates alias, and saves profile', async () => {
    const { getByTestId, queryByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-edit-button'));
    expect(getByTestId('profile-edit-alias-input')).toBeTruthy();
    expect(getByTestId('profile-edit-bio-count').props.children).toEqual([
      19,
      '/',
      300,
    ]);

    fireEvent.changeText(getByTestId('profile-edit-alias-input'), '   ');
    fireEvent.press(getByTestId('profile-save-button'));
    expect(getByTestId('profile-edit-error').props.children).toBe(
      'Alias is required.',
    );

    fireEvent.changeText(getByTestId('profile-edit-alias-input'), 'Updated Diver');
    fireEvent.changeText(getByTestId('profile-edit-bio-input'), 'New bio');
    fireEvent.press(getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });
    expect(refreshMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(queryByTestId('profile-edit-alias-input')).toBeNull();
    });
  });
});
