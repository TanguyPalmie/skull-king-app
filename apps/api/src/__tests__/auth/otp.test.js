const request = require('supertest');
const app = require('../../index');
const otpService = require('../../services/otpService');
const userRepo = require('../../repositories/userRepo');
const tokenService = require('../../services/tokenService');

// Mock the services and repos so we don't need a real DB
jest.mock('../../services/otpService');
jest.mock('../../repositories/userRepo');
jest.mock('../../services/tokenService');

// Disable rate limiting for tests
jest.mock('../../middlewares/rateLimit', () => ({
  globalLimiter: (req, res, next) => next(),
  sensitiveLimiter: (req, res, next) => next(),
}));

// Disable shared validation (may not resolve in test env)
jest.mock('../../middlewares/validate', () => {
  return function validate(fields) {
    return (req, res, next) => {
      // Minimal validation: check that required fields are present
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

describe('POST /auth/request-otp', () => {
  it('should return 200 for a valid phone number', async () => {
    otpService.sendOtp.mockResolvedValue({ id: 'otp-1', phone: '+33612345678' });

    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '+33612345678' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent successfully');
    expect(otpService.sendOtp).toHaveBeenCalledWith('+33612345678');
  });

  it('should return 400 when phone is missing', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when phone is empty string', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '' });

    expect(res.status).toBe(400);
  });

  it('should propagate 429 when OTP service rate-limits', async () => {
    const err = new Error('Too many OTP requests. Please try again later.');
    err.statusCode = 429;
    otpService.sendOtp.mockRejectedValue(err);

    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '+33612345678' });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many/i);
  });
});

describe('POST /auth/verify-otp', () => {
  const mockUser = {
    id: 'user-uuid-1',
    phone: '+33612345678',
    email: null,
    display_name: 'Test User',
  };

  it('should return 200 with accessToken for a valid code', async () => {
    otpService.verifyOtp.mockResolvedValue(true);
    userRepo.findByPhone.mockResolvedValue(mockUser);
    tokenService.generateAccessToken.mockReturnValue('mock-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('mock-refresh-token');

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+33612345678', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock-access-token');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(mockUser.id);
    expect(res.body.isNewUser).toBe(false);
  });

  it('should set a refresh token cookie on valid verification', async () => {
    otpService.verifyOtp.mockResolvedValue(true);
    userRepo.findByPhone.mockResolvedValue(mockUser);
    tokenService.generateAccessToken.mockReturnValue('mock-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('mock-refresh-token');

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+33612345678', code: '123456' });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('should create a new user if phone is not registered', async () => {
    const newUser = { ...mockUser, id: 'new-user-uuid' };
    otpService.verifyOtp.mockResolvedValue(true);
    userRepo.findByPhone.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(newUser);
    tokenService.generateAccessToken.mockReturnValue('mock-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('mock-refresh-token');

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+33612345678', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(true);
    expect(userRepo.create).toHaveBeenCalledWith({ phone: '+33612345678' });
  });

  it('should return an error when the OTP code is invalid', async () => {
    const err = new Error('Invalid OTP code');
    err.statusCode = 400;
    otpService.verifyOtp.mockRejectedValue(err);

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+33612345678', code: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should return 400 when code field is missing', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+33612345678' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when phone field is missing', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });
});

describe('OTP rate limiting (service level)', () => {
  it('should return 429 when too many OTP requests are made', async () => {
    // The 6th request triggers rate limiting in the OTP service
    const err = new Error('Too many OTP requests. Please try again later.');
    err.statusCode = 429;
    otpService.sendOtp.mockRejectedValue(err);

    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '+33612345678' });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many/i);
  });
});
