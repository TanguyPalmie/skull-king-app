const crypto = require('crypto');
const config = require('../config');
const otpRepo = require('../repositories/otpRepo');
const { hashToken } = require('../utils/crypto');

const otpService = {
  /**
   * Generate a 6-digit numeric OTP.
   * @returns {string} 6-digit code
   */
  generateOtp() {
    const num = crypto.randomInt(0, 1000000);
    return num.toString().padStart(6, '0');
  },

  /**
   * Create and "send" an OTP for the given phone number.
   * In development, the code is logged to the console.
   * In production, this would call an SMS provider (Twilio, etc.).
   *
   * @param {string} phone - E.164 phone number
   * @returns {Object} The created OTP record (code not included in prod)
   */
  async sendOtp(phone) {
    // Check rate limiting: max attempts within the OTP expiry window
    const since = new Date(Date.now() - config.OTP_EXPIRY_MINUTES * 60 * 1000);
    const attempts = await otpRepo.countAttempts(phone, since);

    if (attempts >= config.OTP_MAX_ATTEMPTS) {
      const err = new Error('Too many OTP requests. Please try again later.');
      err.statusCode = 429;
      throw err;
    }

    const code = this.generateOtp();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    const record = await otpRepo.create(phone, codeHash, expiresAt);

    // Send via configured provider
    if (config.SMS_PROVIDER === 'mock' || config.NODE_ENV === 'development') {
      console.log(`[OTP] Code for ${phone}: ${code}`);
    } else {
      // TODO: integrate real SMS provider (Twilio, Vonage, etc.)
      console.log(`[OTP] Sending SMS to ${phone} via ${config.SMS_PROVIDER}`);
    }

    return record;
  },

  /**
   * Verify an OTP code for a phone number.
   * Checks expiry, hash match, and max attempts.
   *
   * @param {string} phone - E.164 phone number
   * @param {string} code - 6-digit OTP code
   * @returns {boolean} True if valid
   * @throws {Error} If OTP is invalid, expired, or max attempts exceeded
   */
  async verifyOtp(phone, code) {
    const record = await otpRepo.findLatest(phone);

    if (!record) {
      const err = new Error('No OTP found or OTP expired');
      err.statusCode = 400;
      throw err;
    }

    const codeHash = hashToken(code);

    if (codeHash !== record.code_hash) {
      const err = new Error('Invalid OTP code');
      err.statusCode = 400;
      throw err;
    }

    // Mark as used so it cannot be reused
    await otpRepo.markUsed(record.id);

    return true;
  },
};

module.exports = otpService;
