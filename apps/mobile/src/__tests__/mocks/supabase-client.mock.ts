const mockUnsubscribe = jest.fn();

export const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: { provider: 'google', url: null },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    }),
  },
};

export { mockUnsubscribe };

jest.mock('@/src/infrastructure/supabase/client', () => ({
  supabase: mockSupabase,
}));
