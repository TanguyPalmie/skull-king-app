const pool = require('../db/pool');

const otpRepo = {
  async create(phone, codeHash, expiresAt) {
    const { rows } = await pool.query(
      `INSERT INTO otp_codes (phone_e164, code_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [phone, codeHash, expiresAt]
    );
    return rows[0];
  },

  async findLatest(phone) {
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone_e164 = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );
    return rows[0] || null;
  },

  async markUsed(id) {
    await pool.query(
      'UPDATE otp_codes SET used_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async countAttempts(phone, since) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM otp_codes
       WHERE phone_e164 = $1 AND created_at >= $2`,
      [phone, since]
    );
    return rows[0].count;
  },
};

module.exports = otpRepo;
