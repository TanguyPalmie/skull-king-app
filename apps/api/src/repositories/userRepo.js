const pool = require('../db/pool');

const userRepo = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE phone_e164 = $1',
      [phone]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO users (phone_e164, phone_verified_at, email, password_hash, display_name, birthdate)
       VALUES ($1, NOW(), $2, $3, $4, $5)
       RETURNING *`,
      [
        data.phone || null,
        data.email || null,
        data.password_hash || null,
        data.display_name || null,
        data.birthdate || null,
      ]
    );
    return rows[0];
  },

  async updateProfile(id, fields) {
    const { rows } = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           bio = COALESCE($3, bio),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, fields.display_name, fields.bio, fields.avatar_url]
    );
    return rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const { rows } = await pool.query(
      'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, passwordHash]
    );
    return rows[0] || null;
  },
};

module.exports = userRepo;
