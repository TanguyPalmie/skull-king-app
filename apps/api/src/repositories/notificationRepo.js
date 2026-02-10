const pool = require('../db/pool');

const notificationRepo = {
  /**
   * Create a new notification for a user.
   * @param {string} userId - Target user ID
   * @param {string} type - Notification type (e.g. 'match_found', 'event_joined')
   * @param {Object} data - JSON payload with notification details
   * @returns {Object} The created notification row
   */
  async create(userId, type, data) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, type, JSON.stringify(data)]
    );
    return rows[0];
  },

  /**
   * Fetch recent notifications for a user.
   * @param {string} userId - User ID
   * @param {number} limit - Max number of notifications to return (default 50)
   */
  async findByUser(userId, limit = 50) {
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },
};

module.exports = notificationRepo;
