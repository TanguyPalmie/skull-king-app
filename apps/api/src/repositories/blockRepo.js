const pool = require('../db/pool');

const blockRepo = {
  /**
   * Create a shadow block. The blocked user is never notified.
   * @param {string} blockerId - ID of the user initiating the block
   * @param {string} blockedId - ID of the user being blocked
   * @returns {Object} The created block row
   */
  async create(blockerId, blockedId) {
    const { rows } = await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING
       RETURNING *`,
      [blockerId, blockedId]
    );
    return rows[0] || null;
  },

  /**
   * Check if a block exists between two users (in either direction).
   * @returns {boolean}
   */
  async isBlocked(userA, userB) {
    const { rows } = await pool.query(
      `SELECT 1 FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userA, userB]
    );
    return rows.length > 0;
  },
};

module.exports = blockRepo;
