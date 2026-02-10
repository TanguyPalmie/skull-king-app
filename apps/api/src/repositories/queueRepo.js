const pool = require('../db/pool');

const queueRepo = {
  async insert(entry) {
    const { rows } = await pool.query(
      `INSERT INTO queue_entries
         (user_id, sport_id, level, lat, lng, radius_km, time_start, time_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        entry.user_id,
        entry.sport_id,
        entry.level_id || entry.level,
        entry.lat,
        entry.lng,
        entry.radius_km || 50,
        entry.available_from || entry.time_start,
        entry.available_to || entry.time_end,
      ]
    );
    return rows[0];
  },

  async remove(userId, sportId) {
    const { rowCount } = await pool.query(
      'DELETE FROM queue_entries WHERE user_id = $1 AND sport_id = $2',
      [userId, sportId]
    );
    return rowCount > 0;
  },

  async findByUser(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM queue_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findCandidates(criteria) {
    const { rows } = await pool.query(
      `SELECT qe.*, u.display_name
       FROM queue_entries qe
       JOIN users u ON u.id = qe.user_id
       WHERE qe.sport_id = $1
         AND ABS(qe.level - $2) <= 1
         AND qe.time_start < $4
         AND qe.time_end > $3
         AND qe.user_id != $5
       ORDER BY qe.created_at ASC`,
      [
        criteria.sport_id,
        criteria.level_id || criteria.level,
        criteria.available_from || criteria.time_start,
        criteria.available_to || criteria.time_end,
        criteria.excludeUserId,
      ]
    );
    return rows;
  },
};

module.exports = queueRepo;
