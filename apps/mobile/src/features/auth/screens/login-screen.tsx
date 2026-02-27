import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/features/auth/context/auth-context';
import { colors, typography } from '@/src/shared/theme';

type AuthView = 'login' | 'signup' | 'forgot-password';
type BusyAction = 'login' | 'signup' | 'forgot' | 'google' | null;

interface FormErrors {
  email?: string;
  password?: string;
  alias?: string;
  forgotEmail?: string;
  form?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailValid(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

function AuthHeader({ view }: { view: AuthView }) {
  const subtitle =
    view === 'login'
      ? 'Sign in to continue'
      : view === 'signup'
        ? 'Create an account'
        : 'Reset password';

  return (
    <View style={styles.header}>
      <View style={styles.brandIconWrap}>
        <Text style={styles.brandIconText}>F</Text>
      </View>
      <Text style={styles.brandTitle}>Freedive</Text>
      <Text testID="auth-screen-title" style={styles.brandSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

interface InlineInputProps {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  testID: string;
  error?: string;
  secureTextEntry?: boolean;
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
}

function InlineInput({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  error,
  secureTextEntry,
  autoComplete,
  keyboardType,
}: InlineInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(245,245,244,0.34)"
        style={[styles.input, error ? styles.inputError : null]}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
      />
      {error ? (
        <Text testID="auth-inline-error" style={styles.inlineError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const forgotConfirmationEmail = useMemo(() => forgotEmail.trim(), [forgotEmail]);

  const clearStateForNextView = (next: AuthView) => {
    setView(next);
    setBusyAction(null);
    setErrors({});
    setForgotSuccess(false);
    setEmail('');
    setPassword('');
    setAlias('');
    setForgotEmail('');
    setAvatarUri(null);
  };

  const validateLogin = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!isEmailValid(email)) {
      nextErrors.email = 'Enter a valid email';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    return nextErrors;
  };

  const validateSignUp = (): FormErrors => {
    const nextErrors: FormErrors = validateLogin();

    if (!alias.trim()) {
      nextErrors.alias = 'Alias is required';
    } else if (alias.trim().length > 120) {
      nextErrors.alias = 'Alias must be 120 characters or less';
    }

    if (password && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    return nextErrors;
  };

  const validateForgot = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!forgotEmail.trim()) {
      nextErrors.forgotEmail = 'Email is required';
    } else if (!isEmailValid(forgotEmail)) {
      nextErrors.forgotEmail = 'Enter a valid email';
    }

    return nextErrors;
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrors({ form: 'Photo permission is required to add an avatar' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setErrors((current) => ({ ...current, form: undefined }));
    }
  };

  const handleLogin = async () => {
    const validationErrors = validateLogin();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBusyAction('login');

    const { error } = await signIn(email, password);
    setBusyAction(null);

    if (error) {
      setErrors({ form: error.message });
    }
  };

  const handleGoogle = async () => {
    setErrors({});
    setBusyAction('google');

    const { error } = await signInWithGoogle();
    setBusyAction(null);

    if (error) {
      setErrors({ form: error.message });
    }
  };

  const handleSignUp = async () => {
    const validationErrors = validateSignUp();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBusyAction('signup');

    const { error } = await signUp({
      alias,
      email,
      password,
      avatarUrl: avatarUri,
    });
    setBusyAction(null);

    if (error) {
      setErrors({ form: error.message });
    }
  };

  const handleForgotPassword = async () => {
    const validationErrors = validateForgot();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBusyAction('forgot');

    const { error } = await resetPassword(forgotEmail);
    setBusyAction(null);

    if (error) {
      setErrors({ form: error.message });
      return;
    }

    setForgotSuccess(true);
  };

  const isBusy = busyAction !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowLeft} />
        <View style={styles.glowRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <AuthHeader view={view} />

          <View style={styles.card}>
            {view === 'login' ? (
              <View style={styles.formWrap}>
                <Pressable
                  testID="auth-google-button"
                  accessibilityRole="button"
                  onPress={handleGoogle}
                  disabled={isBusy}
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  {busyAction === 'google' ? (
                    <ActivityIndicator color={colors.neutral[900]} />
                  ) : (
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  )}
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <InlineInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  testID="auth-email-input"
                  autoComplete="email"
                  keyboardType="email-address"
                  error={errors.email}
                />
                <InlineInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  testID="auth-password-input"
                  autoComplete="current-password"
                  secureTextEntry
                  error={errors.password}
                />

                <Pressable
                  testID="auth-toggle-forgot-button"
                  onPress={() => clearStateForNextView('forgot-password')}
                  disabled={isBusy}
                  style={styles.inlineLinkWrap}
                >
                  <Text style={styles.inlineLink}>Forgot password?</Text>
                </Pressable>

                <Pressable
                  testID="auth-submit-button"
                  accessibilityRole="button"
                  onPress={handleLogin}
                  disabled={isBusy}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  {busyAction === 'login' ? (
                    <ActivityIndicator color={colors.neutral[50]} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Log in</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {view === 'signup' ? (
              <View style={styles.formWrap}>
                <Pressable
                  testID="auth-signup-avatar-button"
                  onPress={pickAvatar}
                  disabled={isBusy}
                  style={styles.avatarPicker}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>Add photo</Text>
                  )}
                </Pressable>

                <InlineInput
                  label="Alias"
                  value={alias}
                  onChangeText={setAlias}
                  placeholder="Alias (display name)"
                  testID="auth-signup-alias-input"
                  autoComplete="username"
                  error={errors.alias}
                />
                <InlineInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  testID="auth-email-input"
                  autoComplete="email"
                  keyboardType="email-address"
                  error={errors.email}
                />
                <InlineInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  testID="auth-password-input"
                  autoComplete="new-password"
                  secureTextEntry
                  error={errors.password}
                />

                <Pressable
                  testID="auth-submit-button"
                  accessibilityRole="button"
                  onPress={handleSignUp}
                  disabled={isBusy}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  {busyAction === 'signup' ? (
                    <ActivityIndicator color={colors.neutral[50]} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create account</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {view === 'forgot-password' ? (
              forgotSuccess ? (
                <View style={styles.successWrap}>
                  <Text testID="auth-forgot-success" style={styles.successTitle}>
                    Check your email
                  </Text>
                  <Text style={styles.successBody}>
                    We&apos;ve sent a reset link to {forgotConfirmationEmail}
                  </Text>
                </View>
              ) : (
                <View style={styles.formWrap}>
                  <Text style={styles.helpText}>
                    Enter your email and we&apos;ll send a reset link.
                  </Text>
                  <InlineInput
                    label="Email"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="Email"
                    testID="auth-forgot-email-input"
                    autoComplete="email"
                    keyboardType="email-address"
                    error={errors.forgotEmail}
                  />
                  <Pressable
                    testID="auth-forgot-submit-button"
                    accessibilityRole="button"
                    onPress={handleForgotPassword}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed ? styles.buttonPressed : null,
                    ]}
                  >
                    {busyAction === 'forgot' ? (
                      <ActivityIndicator color={colors.neutral[50]} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send reset link</Text>
                    )}
                  </Pressable>
                </View>
              )
            ) : null}

            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          </View>

          <View style={styles.footerLinkWrap}>
            {view === 'login' ? (
              <Pressable
                testID="auth-toggle-mode-button"
                onPress={() => clearStateForNextView('signup')}
                disabled={isBusy}
              >
                <Text style={styles.footerLinkText}>Don&apos;t have an account? Sign up</Text>
              </Pressable>
            ) : null}

            {view === 'signup' ? (
              <Pressable
                testID="auth-toggle-mode-button"
                onPress={() => clearStateForNextView('login')}
                disabled={isBusy}
              >
                <Text style={styles.footerLinkText}>Already have an account? Log in</Text>
              </Pressable>
            ) : null}

            {view === 'forgot-password' ? (
              <Pressable
                testID="auth-forgot-back-button"
                onPress={() => clearStateForNextView('login')}
                disabled={isBusy}
              >
                <Text style={styles.footerLinkText}>Back to login</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    width: 460,
    height: 300,
    top: -120,
    left: '50%',
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: 'rgba(5, 150, 105, 0.34)',
  },
  glowLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    bottom: -80,
    left: -60,
    borderRadius: 130,
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
  },
  glowRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    bottom: 60,
    right: -40,
    borderRadius: 110,
    backgroundColor: 'rgba(4, 47, 46, 0.42)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  content: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.36)',
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandIconText: {
    ...typography.h3,
    color: colors.primary[400],
    fontSize: 20,
    lineHeight: 24,
  },
  brandTitle: {
    ...typography.h2,
    color: colors.neutral[50],
    fontSize: 24,
    lineHeight: 30,
  },
  brandSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(245, 245, 244, 0.52)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.12)',
    backgroundColor: 'rgba(245,245,244,0.05)',
    padding: 18,
  },
  formWrap: {
    gap: 12,
  },
  googleButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  googleButtonText: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(245,245,244,0.2)',
  },
  dividerText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.36)',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.7)',
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.2)',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    color: colors.neutral[50],
    backgroundColor: 'rgba(245,245,244,0.04)',
  },
  inputError: {
    borderColor: '#fca5a5',
  },
  inlineError: {
    ...typography.bodySmall,
    color: '#fca5a5',
  },
  inlineLinkWrap: {
    alignSelf: 'flex-start',
  },
  inlineLink: {
    ...typography.bodySmall,
    color: colors.primary[400],
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.neutral[50],
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  avatarPicker: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.28)',
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(245,245,244,0.05)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.6)',
  },
  helpText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.72)',
    lineHeight: 20,
  },
  successWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  successTitle: {
    ...typography.h3,
    color: colors.neutral[50],
    fontSize: 20,
    lineHeight: 24,
  },
  successBody: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formError: {
    ...typography.bodySmall,
    color: '#fca5a5',
    marginTop: 10,
    textAlign: 'center',
  },
  footerLinkWrap: {
    marginTop: 20,
  },
  footerLinkText: {
    ...typography.bodySmall,
    color: colors.primary[400],
    textAlign: 'center',
  },
});
