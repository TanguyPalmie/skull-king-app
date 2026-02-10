const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const tokenRepo = require('../repositories/tokenRepo');
const { hashToken } = require('../utils/crypto');

const tokenService = {
  /**
   * Generate a short-lived JWT access token.
   * @param {Object} user - User object (must have .id)
   * @returns {string} Signed JWT
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, phone: user.phone_e164 },
      config.JWT_SECRET,
      { expiresIn: config.ACCESS_TOKEN_EXPIRY }
    );
  },

  /**
   * Generate a refresh token (opaque random string), store its hash in the DB.
   * @param {Object} user - User object (must have .id)
   * @returns {string} The raw refresh token (to be sent to client)
   */
  async generateRefreshToken(user) {
    const token = uuidv4();
    const tokenHash = hashToken(token);

    // Parse expiry string like '7d' into milliseconds
    const expiresAt = new Date(Date.now() + parseExpiry(config.REFRESH_TOKEN_EXPIRY));

    await tokenRepo.createRefreshToken(user.id, tokenHash, expiresAt);

    return token;
  },

  /**
   * Verify a refresh token: find it in DB, check it's not expired or revoked.
   * @param {string} token - Raw refresh token
   * @returns {Object} The token record from DB
   * @throws {Error} If token is invalid
   */
  async verifyRefreshToken(token) {
    const tokenHash = hashToken(token);
    const record = await tokenRepo.findByHash(tokenHash);

    if (!record) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    return record;
  },

  /**
   * Revoke a refresh token by its DB record ID.
   * @param {string} tokenId - DB row ID of the refresh token
   */
  async revokeRefreshToken(tokenId) {
    await tokenRepo.revoke(tokenId);
  },

  /**
   * Rotate a refresh token: revoke the old one and issue a new one.
   * This implements refresh token rotation for security.
   *
   * @param {string} oldToken - The current raw refresh token
   * @returns {{ refreshToken: string, userId: string }} New raw refresh token and user ID
   */
  async rotateRefreshToken(oldToken) {
    const record = await this.verifyRefreshToken(oldToken);

    // Revoke the old token
    await this.revokeRefreshToken(record.id);

    // Issue a new one for the same user
    const newToken = await this.generateRefreshToken({ id: record.user_id });

    return { refreshToken: newToken, userId: record.user_id };
  },
};

/**
 * Parse a duration string like '7d', '1h', '30m' into milliseconds.
 */
function parseExpiry(str) {
  const match = str.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

module.exports = tokenService;
