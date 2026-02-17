import { mockSupabase } from '@/src/__tests__/mocks/supabase-client.mock';
import { mockSession } from '@/src/__tests__/fixtures/users.fixture';

import { apiFetch } from '@/src/infrastructure/api/client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  });
});

describe('apiFetch', () => {
  it('sends Bearer token when session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    await apiFetch('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockSession.access_token}`,
        }),
      }),
    );
  });

  it('omits Authorization header when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await apiFetch('/test');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const result = await apiFetch('/test');

    expect(result).toEqual({ id: 1 });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(apiFetch('/test')).rejects.toThrow('API error: 404');
  });

  it('passes custom method from options', async () => {
    await apiFetch('/test', { method: 'POST' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('builds URL with API_BASE_URL and path', async () => {
    await apiFetch('/spots/123');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/spots/123');
  });
});
