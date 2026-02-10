const pool = require('../db/pool');

const languageRepo = {
  /**
   * Fetch all available languages.
   */
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM languages ORDER BY code');
    return rows;
  },

  /**
   * Fetch all languages for a given user.
   */
  async findUserLanguages(userId) {
    const { rows } = await pool.query(
      `SELECT l.code, l.name
       FROM user_languages ul
       JOIN languages l ON l.code = ul.language_code
       WHERE ul.user_id = $1
       ORDER BY l.code`,
      [userId]
    );
    return rows;
  },

  /**
   * Replace all user languages in a single transaction.
   * @param {string} userId - User ID
   * @param {string[]} languageCodes - Array of language codes (e.g. ['fr', 'en'])
   */
  async replaceUserLanguages(userId, languageCodes) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM user_languages WHERE user_id = $1', [userId]);

      for (const code of languageCodes) {
        await client.query(
          'INSERT INTO user_languages (user_id, language_code) VALUES ($1, $2)',
          [userId, code]
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

module.exports = languageRepo;
