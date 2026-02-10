const request = require('supertest');
const app = require('../../index');
const tokenService = require('../../services/tokenService');
const userRepo = require('../../repositories/userRepo');

jest.mock('../../services/tokenService');
jest.mock('../../repositories/userRepo');

// Disable rate limiting for tests
jest.mock('../../middlewares/rateLimit', () => ({
  globalLimiter: (req, res, next) => next(),
  sensitiveLimiter: (req, res, next) => next(),
}));

// Minimal validation mock
jest.mock('../../middlewares/validate', () => {
  return function validate(fields) {
    return (req, res, next) => {
      for (const field of Object.keys(fields)) {
        if (!req.body[field] && req.body[field] !== 0) {
          return res.status(400).json({ error: 'Validation failed', details: { [field]: 'required' } });
        }
      }
      next();
    };
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/refresh', () => {
  const mockUser = {
    id: 'user-uuid-1',
    phone: '+33612345678',
    email: 'test@example.com',
    display_name: 'Test User',
  };

  it('should return a new access token and set a new refresh cookie', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'new-refresh-token',
      userId: mockUser.id,
    });
    userRepo.findById.mockResolvedValue(mockUser);
    tokenService.generateAccessToken.mockReturnValue('new-access-token');

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=old-refresh-token');

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('new-access-token');

    // Should set a new refresh cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('new-refresh-token');
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('should rotate the token (old token is consumed by rotateRefreshToken)', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'rotated-refresh-token',
      userId: mockUser.id,
    });
    userRepo.findById.mockResolvedValue(mockUser);
    tokenService.generateAccessToken.mockReturnValue('new-access-token');

    await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=old-refresh-token');

    // rotateRefreshToken should have been called with the old token
    expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith('old-refresh-token');
  });

  it('should return 401 when refresh token is revoked or invalid', async () => {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    tokenService.rotateRefreshToken.mockRejectedValue(err);

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=revoked-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('should return 401 when no refresh cookie is present', async () => {
    const res = await request(app)
      .post('/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no refresh token/i);
  });

  it('should return 401 when user is not found after token rotation', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'new-refresh-token',
      userId: 'deleted-user-id',
    });
    userRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=some-refresh-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/user not found/i);
  });
});
