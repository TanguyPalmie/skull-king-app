const request = require('supertest');
const app = require('../../index');
const bcrypt = require('bcryptjs');
const userRepo = require('../../repositories/userRepo');
const tokenService = require('../../services/tokenService');

jest.mock('../../repositories/userRepo');
jest.mock('../../services/tokenService');

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

describe('POST /auth/login', () => {
  const hashedPassword = bcrypt.hashSync('SecurePassword123!', 10);

  const mockUser = {
    id: 'user-uuid-1',
    phone: '+33612345678',
    email: 'test@example.com',
    password_hash: hashedPassword,
    display_name: 'Test User',
  };

  it('should return 200 with accessToken and refresh cookie for valid credentials', async () => {
    userRepo.findByEmail.mockResolvedValue(mockUser);
    tokenService.generateAccessToken.mockReturnValue('mock-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('mock-refresh-token');

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock-access-token');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(mockUser.id);
    expect(res.body.user.email).toBe('test@example.com');

    // Check refresh cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('should return 401 for wrong password', async () => {
    userRepo.findByEmail.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('should return 401 for non-existent email', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'SomePassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'SomePassword!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when both fields are missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 401 for user with no password hash set', async () => {
    const userWithoutPassword = { ...mockUser, password_hash: null };
    userRepo.findByEmail.mockResolvedValue(userWithoutPassword);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'SomePassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });
});
