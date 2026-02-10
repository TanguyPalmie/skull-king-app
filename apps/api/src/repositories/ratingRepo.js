const pool = require('../db/pool');

const ratingRepo = {
  /**
   * Create a new rating.
   * @param {Object} rating - { rater_id, rated_id, match_id, score, comment }
   * @returns {Object} The created rating row
   */
  async create(rating) {
    const { rows } = await pool.query(
      `INSERT INTO ratings (rater_id, rated_id, match_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [rating.rater_id, rating.rated_id, rating.match_id, rating.score, rating.comment || null]
    );
    return rows[0];
  },
};

module.exports = ratingRepo;
