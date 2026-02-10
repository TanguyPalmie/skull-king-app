const pool = require('../db/pool');

const kycRepo = {
  /**
   * Create a new KYC document submission.
   * @param {string} userId - User ID
   * @param {string} filePath - Path to the uploaded ID document
   * @returns {Object} The created KYC row
   */
  async create(userId, filePath) {
    const { rows } = await pool.query(
      `INSERT INTO kyc_documents (user_id, file_path, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [userId, filePath]
    );
    return rows[0];
  },

  /**
   * Find the most recent KYC submission for a user.
   */
  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM kyc_documents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Update KYC document status (e.g. 'approved', 'rejected').
   */
  async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE kyc_documents SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status]
    );
    return rows[0] || null;
  },
};

module.exports = kycRepo;
