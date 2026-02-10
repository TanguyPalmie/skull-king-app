const pool = require('../db/pool');

const matchRepo = {
  /**
   * Create a new match record.
   * @param {Object} match - { sport_id, scheduled_at, lat, lng, status }
   * @returns {Object} The created match row
   */
  async create(match) {
    const { rows } = await pool.query(
      `INSERT INTO matches (sport_id, scheduled_at, lat, lng, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [match.sport_id, match.scheduled_at, match.lat, match.lng, match.status || 'pending']
    );
    return rows[0];
  },

  /**
   * Add members to a match.
   * @param {string} matchId - Match ID
   * @param {string[]} userIds - Array of user IDs
   */
  async addMembers(matchId, userIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const userId of userIds) {
        await client.query(
          'INSERT INTO match_members (match_id, user_id) VALUES ($1, $2)',
          [matchId, userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Find a match by ID, including its members.
   */
  async findById(matchId) {
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1',
      [matchId]
    );

    const match = matchResult.rows[0];
    if (!match) return null;

    const membersResult = await pool.query(
      `SELECT mm.user_id, u.display_name, u.avatar_url
       FROM match_members mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.match_id = $1`,
      [matchId]
    );

    match.members = membersResult.rows;
    return match;
  },
};

module.exports = matchRepo;
