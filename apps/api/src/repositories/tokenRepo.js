const pool = require('../db/pool');

const tokenRepo = {
  // ─── Refresh Tokens ──────────────────────────────────────────────────

  /**
   * Store a hashed refresh token.
   * @param {string} userId - User ID
   * @param {string} tokenHash - SHA-256 hash of the refresh token
   * @param {Date} expiresAt - Token expiration time
   * @returns {Object} The created row
   */
  async createRefreshToken(userId, tokenHash, expiresAt) {
    const { rows } = await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  },

  /**
   * Find a refresh token record by its hash.
   * Only returns tokens that have not been revoked and have not expired.
   */
  async findByHash(hash) {
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [hash]
    );
    return rows[0] || null;
  },

  /**
   * Revoke a refresh token by marking revoked_at.
   */
  async revoke(id) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [id]
    );
  },

  // ─── Password Reset Tokens ───────────────────────────────────────────

  /**
   * Store a hashed password reset token.
   */
  async createPasswordResetToken(userId, tokenHash, expiresAt) {
    const { rows } = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  },

  /**
   * Find a password reset token by its hash.
   * Only returns tokens that have not been used and have not expired.
   */
  async findPasswordResetByHash(hash) {
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [hash]
    );
    return rows[0] || null;
  },

  /**
   * Mark a password reset token as used.
   */
  async markPasswordResetUsed(id) {
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [id]
    );
  },
};

module.exports = tokenRepo;
