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

  it('navigates to activity detail view and back', () => {
    const { getByTestId, getByText, queryByTestId } = renderProfileScreen();

    fireEvent.press(getByTestId('profile-row-reports'));

    expect(getByTestId('profile-view-title').props.children).toBe('Dive Reports');
    expect(getByText('No dive reports yet')).toBeTruthy();

    fireEvent.press(getByTestId('profile-back-button'));

    expect(queryByTestId('profile-view-title')).toBeNull();
    expect(getByTestId('profile-row-reports')).toBeTruthy();
  });

  it('renders loading and error states', () => {
    mockUseProfileData.mockReturnValueOnce({
      profile: null,
      stats: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText, rerender } = renderProfileScreen();
    expect(getByText('Loading profile...')).toBeTruthy();

    mockUseProfileData.mockReturnValueOnce({
      profile: null,
      stats: null,
      isLoading: false,
      error: 'Boom',
      refresh: jest.fn(),
    });

    rerender(<ProfileScreen />);
    expect(getByText('Profile unavailable')).toBeTruthy();
    expect(getByText('Boom')).toBeTruthy();
  });
});
