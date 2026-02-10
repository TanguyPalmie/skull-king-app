const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9]\d{6,14}$/;
const OTP_RE = /^\d{6}$/;

function validateField(value, rules) {
  for (const rule of rules) {
    const err = rule(value);
    if (err) return err;
  }
  return null;
}

const required = (msg = 'Required') => (v) => (v == null || v === '' ? msg : null);
const minLen = (n, msg) => (v) => (v && v.length < n ? msg || `Min ${n} chars` : null);
const maxLen = (n, msg) => (v) => (v && v.length > n ? msg || `Max ${n} chars` : null);
const matchesRe = (re, msg) => (v) => (v && !re.test(v) ? msg : null);

const schemas = {
  phone: [required('Phone required'), matchesRe(PHONE_RE, 'Invalid E.164 phone')],
  otp: [required('OTP required'), matchesRe(OTP_RE, 'OTP must be 6 digits')],
  email: [required('Email required'), matchesRe(EMAIL_RE, 'Invalid email')],
  password: [required('Password required'), minLen(8, 'Min 8 chars'), maxLen(128, 'Max 128 chars')],
  displayName: [required('Name required'), minLen(2, 'Min 2 chars'), maxLen(50, 'Max 50 chars')],
};

function validate(value, schemaKey) {
  const rules = schemas[schemaKey];
  if (!rules) return null;
  return validateField(value, rules);
}

function validateBody(body, fields) {
  const errors = {};
  let hasError = false;
  for (const [key, schemaKey] of Object.entries(fields)) {
    const err = validate(body[key], schemaKey);
    if (err) {
      errors[key] = err;
      hasError = true;
    }
  }
  return hasError ? errors : null;
}

module.exports = { validate, validateBody, schemas };
