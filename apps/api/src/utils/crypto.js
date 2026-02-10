const crypto = require('crypto');

/**
 * Hash a token string with SHA-256.
 * Used for storing refresh tokens and password reset tokens securely.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically random hex token (32 bytes = 64 hex chars).
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashToken, generateRandomToken };
