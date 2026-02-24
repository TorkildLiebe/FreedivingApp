import React from 'react';
import { render } from '@testing-library/react-native';

import ProfileScreen from '@/src/features/auth/screens/profile-screen';

describe('ProfileScreen (M1 placeholder)', () => {
  it('renders the M1 placeholder text', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Profile coming in M4')).toBeTruthy();
  });
});
