const jwt = require('jsonwebtoken');
const config = require('../../config');

const JWT_SECRET = config.JWT_SECRET;

function generateTestToken(userId, extra = {}) {
  return jwt.sign({ id: userId, ...extra }, JWT_SECRET, { expiresIn: '1h' });
}

function authHeader(userId, extra = {}) {
  return { Authorization: `Bearer ${generateTestToken(userId, extra)}` };
}

module.exports = { generateTestToken, authHeader };
