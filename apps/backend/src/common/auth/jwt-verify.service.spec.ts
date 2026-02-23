import { JwtVerifyService } from './jwt-verify.service';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

import { createRemoteJWKSet, jwtVerify } from 'jose';

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

describe('JwtVerifyService', () => {
  let service: JwtVerifyService;

  beforeEach(() => {
    service = new JwtVerifyService();
    jest.clearAllMocks();
    process.env.AUTH_JWKS_URL =
      'http://localhost:54321/auth/v1/.well-known/jwks.json';
    process.env.AUTH_ISSUER = 'http://localhost:54321/auth/v1';
  });

  describe('verify', () => {
    it('should verify token and return payload', async () => {
      const mockPayload = { sub: 'user-123', email: 'test@example.com' };
      mockJwtVerify.mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

      const result = await service.verify('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', 'mock-jwks', {
        issuer: 'http://localhost:54321/auth/v1',
      });
    });

    it('should create JWKS from AUTH_JWKS_URL', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: 'user-123' },
        protectedHeader: { alg: 'RS256' },
      } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

      await service.verify('token');

      expect(createRemoteJWKSet).toHaveBeenCalledWith(
        new URL('http://localhost:54321/auth/v1/.well-known/jwks.json'),
      );
    });

    it('should cache JWKS after first call', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: 'user-123' },
        protectedHeader: { alg: 'RS256' },
      } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

      await service.verify('token-1');
      await service.verify('token-2');

      expect(createRemoteJWKSet).toHaveBeenCalledTimes(1);
    });

    it('should throw when AUTH_JWKS_URL is not configured', async () => {
      delete process.env.AUTH_JWKS_URL;

      await expect(service.verify('token')).rejects.toThrow(
        'AUTH_JWKS_URL not configured',
      );
    });

    it('should propagate jose verification errors', async () => {
      mockJwtVerify.mockRejectedValue(new Error('token expired'));

      await expect(service.verify('expired-token')).rejects.toThrow(
        'token expired',
      );
    });
  });
});
