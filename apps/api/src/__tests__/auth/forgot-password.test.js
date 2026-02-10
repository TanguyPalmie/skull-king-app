const request = require('supertest');
const app = require('../../index');
const userRepo = require('../../repositories/userRepo');
const tokenRepo = require('../../repositories/tokenRepo');
const emailService = require('../../services/emailService');
const { hashToken } = require('../../utils/crypto');

jest.mock('../../repositories/userRepo');
jest.mock('../../repositories/tokenRepo');
jest.mock('../../services/emailService');

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

describe('POST /auth/forgot-password', () => {
  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    display_name: 'Test User',
  };

  it('should return 200 for a valid email and send reset email', async () => {
    userRepo.findByEmail.mockResolvedValue(mockUser);
    tokenRepo.createPasswordResetToken.mockResolvedValue({ id: 'token-1' });
    emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if the email exists/i);
    expect(tokenRepo.createPasswordResetToken).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(String),
      expect.any(Date)
    );
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String)
    );
  });

  it('should return 200 for an unknown email (no information leak)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if the email exists/i);
    // Should NOT attempt to create a token or send email
    expect(tokenRepo.createPasswordResetToken).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should return 400 when email field is missing', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/reset-password', () => {
  it('should return 200 when resetting with a valid token', async () => {
    const rawToken = 'valid-reset-token-abc123';
    const tokenHash = hashToken(rawToken);

    tokenRepo.findPasswordResetByHash.mockResolvedValue({
      id: 'prt-1',
      user_id: 'user-uuid-1',
      token_hash: tokenHash,
    });
    userRepo.updatePassword.mockResolvedValue({ id: 'user-uuid-1' });
    tokenRepo.markPasswordResetUsed.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'NewSecurePassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password has been reset/i);
    expect(userRepo.updatePassword).toHaveBeenCalledWith(
      'user-uuid-1',
      expect.any(String) // bcrypt hash
    );
    expect(tokenRepo.markPasswordResetUsed).toHaveBeenCalledWith('prt-1');
  });

  it('should return 400 for an expired or already used reset token', async () => {
    tokenRepo.findPasswordResetByHash.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: 'expired-or-used-token', password: 'NewPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('should return 400 when token is missing', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ password: 'NewPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: 'some-token' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when both token and password are missing', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({});

    expect(res.status).toBe(400);
  });
});
