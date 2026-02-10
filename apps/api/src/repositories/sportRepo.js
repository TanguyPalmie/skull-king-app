const pool = require('../db/pool');

const sportRepo = {
  /**
   * Fetch all available sports.
   */
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM sports ORDER BY id');
    return rows;
  },

  /**
   * Fetch all sports for a given user, including skill level.
   */
  async findUserSports(userId) {
    const { rows } = await pool.query(
      `SELECT us.sport_id, s.key, s.name, us.level_id
       FROM user_sports us
       JOIN sports s ON s.id = us.sport_id
       WHERE us.user_id = $1
       ORDER BY s.id`,
      [userId]
    );
    return rows;
  },

  /**
   * Replace all user sports in a single transaction.
   * @param {string} userId - User ID
   * @param {Array<{sport_id: number, level_id: number}>} sports - New sport+level pairs
   */
  async replaceUserSports(userId, sports) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM user_sports WHERE user_id = $1', [userId]);

      for (const s of sports) {
        await client.query(
          'INSERT INTO user_sports (user_id, sport_id, level_id) VALUES ($1, $2, $3)',
          [userId, s.sport_id, s.level_id]
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
};

module.exports = sportRepo;
