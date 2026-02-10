const request = require('supertest');
const app = require('../../index');
const { authHeader } = require('../helpers/auth');
const blockRepo = require('../../repositories/blockRepo');

jest.mock('../../repositories/blockRepo');

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

const BLOCKER_USER_ID = 'user-uuid-blocker';
const BLOCKED_USER_ID = 'user-uuid-blocked';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /blocks', () => {
  it('should return 200 when successfully creating a block', async () => {
    blockRepo.create.mockResolvedValue({
      id: 'block-uuid-1',
      blocker_id: BLOCKER_USER_ID,
      blocked_id: BLOCKED_USER_ID,
    });

    const res = await request(app)
      .post('/blocks')
      .set(authHeader(BLOCKER_USER_ID))
      .send({ blocked_id: BLOCKED_USER_ID });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/action completed/i);
    expect(blockRepo.create).toHaveBeenCalledWith(BLOCKER_USER_ID, BLOCKED_USER_ID);
  });

  it('should return 200 on duplicate block (ON CONFLICT DO NOTHING)', async () => {
    // blockRepo.create returns null when ON CONFLICT DO NOTHING triggers
    blockRepo.create.mockResolvedValue(null);

    const res = await request(app)
      .post('/blocks')
      .set(authHeader(BLOCKER_USER_ID))
      .send({ blocked_id: BLOCKED_USER_ID });

    // The controller does not check the return value, so it still returns 200
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/action completed/i);
  });

  it('should return 400 when blocked_id is missing', async () => {
    const res = await request(app)
      .post('/blocks')
      .set(authHeader(BLOCKER_USER_ID))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when trying to block yourself', async () => {
    const res = await request(app)
      .post('/blocks')
      .set(authHeader(BLOCKER_USER_ID))
      .send({ blocked_id: BLOCKER_USER_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot block yourself/i);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/blocks')
      .send({ blocked_id: BLOCKED_USER_ID });

    expect(res.status).toBe(401);
  });

  it('should not reveal the block to the blocked user (returns generic message)', async () => {
    blockRepo.create.mockResolvedValue({
      id: 'block-uuid-2',
      blocker_id: BLOCKER_USER_ID,
      blocked_id: BLOCKED_USER_ID,
    });

    const res = await request(app)
      .post('/blocks')
      .set(authHeader(BLOCKER_USER_ID))
      .send({ blocked_id: BLOCKED_USER_ID });

    // The response message should be generic, not revealing it's a block
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Action completed');
    // Should NOT contain words like "block" in the response
    expect(res.body.message.toLowerCase()).not.toContain('block');
  });
});
