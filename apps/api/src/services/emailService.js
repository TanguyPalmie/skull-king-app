const config = require('../config');

const emailService = {
  /**
   * Send a password reset email.
   * In development, logs the token to the console.
   * In production, this would integrate with SendGrid, Mailgun, etc.
   *
   * @param {string} email - Recipient email address
   * @param {string} token - Raw password reset token
   */
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

    if (config.EMAIL_PROVIDER === 'console' || config.NODE_ENV === 'development') {
      console.log('─────────────────────────────────────────');
      console.log('[Email] Password reset requested');
      console.log(`  To: ${email}`);
      console.log(`  Reset URL: ${resetUrl}`);
      console.log(`  Token: ${token}`);
      console.log('─────────────────────────────────────────');
    } else {
      // TODO: integrate real email provider (SendGrid, Mailgun, SES)
      console.log(`[Email] Sending password reset to ${email} via ${config.EMAIL_PROVIDER}`);
    }
  },
};

module.exports = emailService;
