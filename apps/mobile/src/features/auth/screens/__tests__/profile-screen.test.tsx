import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { mockSession } from '@/src/__tests__/fixtures/users.fixture';

const mockSignOut = jest.fn();

jest.mock('@/src/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    session: mockSession,
    signOut: mockSignOut,
  }),
}));

import ProfileScreen from '@/src/features/auth/screens/profile-screen';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfileScreen', () => {
  it('renders user email from session', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('calls signOut when button pressed', () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Sign Out'));

    expect(mockSignOut).toHaveBeenCalled();
  });
});
