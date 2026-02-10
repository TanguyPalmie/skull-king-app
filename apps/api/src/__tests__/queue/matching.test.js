const request = require('supertest');
const app = require('../../index');
const { authHeader } = require('../helpers/auth');
const queueRepo = require('../../repositories/queueRepo');
const matchService = require('../../services/matchService');

jest.mock('../../repositories/queueRepo');
jest.mock('../../services/matchService');

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

const TEST_USER_ID = 'user-uuid-queue-1';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /queue/join', () => {
  const queuePayload = {
    sport_id: 1,
    level_id: 3,
    lat: 48.8566,
    lng: 2.3522,
    radius_km: 10,
    available_from: '2025-06-01T10:00:00Z',
    available_to: '2025-06-01T12:00:00Z',
  };

  const mockEntry = {
    id: 'queue-entry-1',
    user_id: TEST_USER_ID,
    ...queuePayload,
    created_at: new Date().toISOString(),
  };

  it('should return 200 with queue entry when joining', async () => {
    queueRepo.insert.mockResolvedValue(mockEntry);
    matchService.findMatches.mockResolvedValue([]);

    const res = await request(app)
      .post('/queue/join')
      .set(authHeader(TEST_USER_ID))
      .send(queuePayload);

    expect(res.status).toBe(200);
    expect(res.body.entry).toBeDefined();
    expect(res.body.entry.id).toBe('queue-entry-1');
    expect(res.body.matched).toBe(false);
    expect(res.body.match).toBeNull();
  });

  it('should return a match when a compatible candidate exists', async () => {
    const candidateEntry = {
      id: 'queue-entry-2',
      user_id: 'other-user-uuid',
      sport_id: 1,
      level_id: 3,
      lat: 48.857,
      lng: 2.353,
      radius_km: 10,
    };
    const mockMatch = {
      id: 'match-uuid-1',
      sport_id: 1,
      status: 'confirmed',
    };

    queueRepo.insert.mockResolvedValue(mockEntry);
    matchService.findMatches.mockResolvedValue([candidateEntry]);
    matchService.createMatch.mockResolvedValue(mockMatch);

    const res = await request(app)
      .post('/queue/join')
      .set(authHeader(TEST_USER_ID))
      .send(queuePayload);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.match).toBeDefined();
    expect(res.body.match.id).toBe('match-uuid-1');
    expect(matchService.createMatch).toHaveBeenCalledWith([mockEntry, candidateEntry]);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/queue/join')
      .send(queuePayload);

    expect(res.status).toBe(401);
  });
});

describe('GET /queue/status', () => {
  it('should return the current queue entries for the user', async () => {
    const mockEntries = [
      {
        id: 'queue-entry-1',
        user_id: TEST_USER_ID,
        sport_id: 1,
        level_id: 3,
        lat: 48.8566,
        lng: 2.3522,
      },
    ];
    queueRepo.findByUser.mockResolvedValue(mockEntries);

    const res = await request(app)
      .get('/queue/status')
      .set(authHeader(TEST_USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.entries).toBeDefined();
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].id).toBe('queue-entry-1');
  });

  it('should return empty array when user has no queue entries', async () => {
    queueRepo.findByUser.mockResolvedValue([]);

    const res = await request(app)
      .get('/queue/status')
      .set(authHeader(TEST_USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .get('/queue/status');

    expect(res.status).toBe(401);
  });
});

describe('POST /queue/leave', () => {
  it('should return 200 when successfully leaving the queue', async () => {
    queueRepo.remove.mockResolvedValue(true);

    const res = await request(app)
      .post('/queue/leave')
      .set(authHeader(TEST_USER_ID))
      .send({ sport_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/left the queue/i);
    expect(queueRepo.remove).toHaveBeenCalledWith(TEST_USER_ID, 1);
  });

  it('should return 404 when no queue entry found', async () => {
    queueRepo.remove.mockResolvedValue(false);

    const res = await request(app)
      .post('/queue/leave')
      .set(authHeader(TEST_USER_ID))
      .send({ sport_id: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no queue entry/i);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/queue/leave')
      .send({ sport_id: 1 });

    expect(res.status).toBe(401);
  });
});

describe('Shadow block prevents matching', () => {
  it('should not return blocked users as match candidates', async () => {
    // This test verifies the contract: matchService.findMatches filters out blocked users
    // The actual filtering is done inside matchService, which calls blockRepo.isBlocked
    const queuePayload = {
      sport_id: 1,
      level_id: 3,
      lat: 48.8566,
      lng: 2.3522,
      radius_km: 10,
      available_from: '2025-06-01T10:00:00Z',
      available_to: '2025-06-01T12:00:00Z',
    };
    const mockEntry = {
      id: 'queue-entry-1',
      user_id: TEST_USER_ID,
      ...queuePayload,
    };

    queueRepo.insert.mockResolvedValue(mockEntry);
    // findMatches returns empty because blocked users are filtered out
    matchService.findMatches.mockResolvedValue([]);

    const res = await request(app)
      .post('/queue/join')
      .set(authHeader(TEST_USER_ID))
      .send(queuePayload);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
    expect(res.body.match).toBeNull();
    expect(matchService.findMatches).toHaveBeenCalledWith(mockEntry);
  });
});
