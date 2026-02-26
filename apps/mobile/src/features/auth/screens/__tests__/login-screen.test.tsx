import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/src/features/auth/screens/login-screen';

const mockSignIn = jest.fn().mockResolvedValue({ error: null });
const mockSignUp = jest.fn().mockResolvedValue({ error: null });
const mockSignInWithGoogle = jest.fn().mockResolvedValue({ error: null });
const mockResetPassword = jest.fn().mockResolvedValue({ error: null });

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://avatar.png' }],
  }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('@/src/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    resetPassword: mockResetPassword,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders login mode by default', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    expect(getByTestId('auth-screen-title').props.children).toBe(
      'Sign in to continue',
    );
    expect(getByTestId('auth-email-input')).toBeTruthy();
    expect(getByTestId('auth-password-input')).toBeTruthy();
    expect(getByText("Don't have an account? Sign up")).toBeTruthy();
  });

  it('switches to signup and clears form state on mode switch', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('auth-email-input'), 'one@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');

    fireEvent.press(getByTestId('auth-toggle-mode-button'));

    expect(getByTestId('auth-screen-title').props.children).toBe(
      'Create an account',
    );
    expect(getByTestId('auth-email-input').props.value).toBe('');
    expect(getByTestId('auth-password-input').props.value).toBe('');
    expect(getByTestId('auth-signup-alias-input')).toBeTruthy();

    fireEvent.press(getByTestId('auth-toggle-mode-button'));

    expect(getByText("Don't have an account? Sign up")).toBeTruthy();
    expect(getByTestId('auth-email-input').props.value).toBe('');
  });

  it('shows inline validation errors on invalid login submit', async () => {
    const { getByTestId, getAllByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('auth-submit-button'));
    });

    expect(getAllByTestId('auth-inline-error').length).toBeGreaterThan(0);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with form values', async () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');

    await act(async () => {
      fireEvent.press(getByTestId('auth-submit-button'));
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls signInWithGoogle on Google button tap', async () => {
    const { getByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('auth-google-button'));
    });

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('submits signup with alias and avatar uri', async () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    await act(async () => {
      fireEvent.press(getByTestId('auth-signup-avatar-button'));
    });
    fireEvent.changeText(getByTestId('auth-signup-alias-input'), 'deepwater');
    fireEvent.changeText(getByTestId('auth-email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');

    await act(async () => {
      fireEvent.press(getByTestId('auth-submit-button'));
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        alias: 'deepwater',
        email: 'new@example.com',
        password: 'password123',
        avatarUrl: 'file://avatar.png',
      });
    });
  });

  it('submits forgot-password and shows success state', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.press(getByTestId('auth-toggle-forgot-button'));
    fireEvent.changeText(getByTestId('auth-forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('auth-forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('user@example.com');
    });

    expect(getByTestId('auth-forgot-success')).toBeTruthy();
    expect(getByText("We've sent a reset link to user@example.com")).toBeTruthy();
  });

  it('returns from forgot password to login with cleared fields', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('auth-toggle-forgot-button'));
    fireEvent.changeText(getByTestId('auth-forgot-email-input'), 'user@example.com');

    fireEvent.press(getByTestId('auth-forgot-back-button'));

    expect(getByTestId('auth-screen-title').props.children).toBe(
      'Sign in to continue',
    );
    expect(getByTestId('auth-email-input').props.value).toBe('');
    expect(getByTestId('auth-password-input').props.value).toBe('');
  });
});
