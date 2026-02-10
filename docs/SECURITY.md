# Security Documentation

This document describes the security architecture, controls, and operational practices for the Taggy application. It is intended for developers, auditors, and operators.

---

## Authentication Architecture

### Overview

Taggy uses a multi-factor authentication system with SMS OTP as the primary mechanism, optional email+password for recovery, and WebAuthn for biometric re-login. All token-based sessions use short-lived access tokens paired with rotated refresh tokens.

### Token Strategy

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| **Access Token** | 1 hour | In-memory (JavaScript variable) | API authentication (Bearer header) |
| **Refresh Token** | 7 days | HttpOnly cookie | Silent token renewal |
| **OTP Code** | 5 minutes | Hashed in database | Phone number verification |
| **Password Reset Token** | 30-60 minutes | Hashed in database | One-time password reset link |

**Access Token details:**
- Signed JWT (`HS256`) using `JWT_SECRET`
- Payload contains `userId`, `role`, and `iat`/`exp` claims
- Stored exclusively in memory -- never written to `localStorage` or `sessionStorage`
- Lost on page refresh; the client silently obtains a new one via the refresh endpoint

**Refresh Token details:**
- Signed JWT using `JWT_REFRESH_SECRET`
- Delivered as an `HttpOnly`, `Secure`, `SameSite=Lax` cookie scoped to `Path=/auth/refresh`
- The SHA-256 hash of each issued refresh token is stored in the `refresh_tokens` table
- On each use, the old token is revoked and a new one is issued (rotation)

### Refresh Token Rotation

1. Client sends a request to `POST /auth/refresh` with the refresh cookie.
2. Server validates the JWT signature and expiry.
3. Server looks up the token hash in the database and confirms it has not been revoked.
4. Server revokes the current token hash and issues a new access + refresh pair.
5. If a revoked token is presented (replay detection), all tokens for that user are invalidated, forcing re-authentication.

This mechanism ensures that a stolen refresh token can only be used once. Any replay attempt triggers a full session invalidation for the affected user.

### OTP Security

- 6-digit numeric code generated using a cryptographically secure random source
- Stored as a bcrypt hash in the database (never in plaintext)
- Expires after 5 minutes
- Maximum 5 verification attempts per code; after 5 failures the code is invalidated
- Rate limited: 5 OTP requests per phone number per 15-minute window
- In development, the `console` SMS provider prints the OTP to stdout

### Password Security

- Passwords are hashed with **bcrypt** using a cost factor of **12 rounds**
- Minimum length: 8 characters
- Password reset tokens are generated with `crypto.randomBytes(32)` and stored hashed (SHA-256) in the database
- Reset tokens have a 30-60 minute TTL and are single-use
- After a successful reset, all existing refresh tokens for the user are revoked

### Session Management

- **Logout**: The `POST /auth/logout` endpoint revokes the refresh token server-side and clears the cookie
- **Token rotation**: Every refresh cycle invalidates the previous token, preventing replay
- **Expired refresh**: If the refresh token has expired, the user must re-authenticate; if WebAuthn credentials are registered, biometric re-login is offered
- **Concurrent sessions**: Each device holds its own refresh token; revoking one does not affect others unless replay is detected

---

## Input Validation

- All user input is validated on the server side using shared validation schemas (from `packages/shared`)
- Frontend validation exists for UX but is never trusted by the backend
- SQL queries use parameterized statements exclusively -- no string concatenation or template literals with user data
- Request body schemas reject unknown fields by default
- Path and query parameters are validated and cast to expected types before use

---

## Rate Limiting

Rate limits are enforced at the Express middleware layer using an in-memory store (upgradeable to Redis for multi-instance deployments).

| Scope | Limit | Window | Applies To |
|---|---|---|---|
| **Global** | 100 requests | 15 minutes | All endpoints, per IP |
| **Sensitive** | 5 requests | 15 minutes | Auth endpoints (`/auth/*`), per IP |
| **OTP verification** | 5 attempts | Per code lifetime | Per phone number |
| **OTP request** | 5 requests | 15 minutes | Per phone number |

When a rate limit is exceeded, the server responds with `429 Too Many Requests` and a `Retry-After` header.

---

## HTTP Security Headers

The application uses [Helmet.js](https://helmetjs.github.io/) to set secure HTTP headers on all responses:

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | Strict policy allowing only same-origin scripts and styles, plus trusted CDNs | Prevents XSS via injected scripts |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) | Forces HTTPS for 1 year |
| `X-XSS-Protection` | `0` (disabled, CSP is preferred) | Legacy XSS filter (disabled to avoid edge cases) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | Camera, microphone, geolocation scoped as needed | Restricts browser feature access |

---

## Cookie Security

The refresh token cookie is configured with the following attributes:

| Attribute | Value | Rationale |
|---|---|---|
| `HttpOnly` | `true` | Prevents JavaScript access, mitigating XSS token theft |
| `Secure` | `true` (production) / `false` (development) | Ensures transmission over HTTPS only in production |
| `SameSite` | `Lax` | Prevents the cookie from being sent in cross-origin POST requests (CSRF protection) |
| `Path` | `/auth/refresh` | Limits the cookie scope so it is only sent to the refresh endpoint |
| `Max-Age` | `604800` (7 days) | Matches the refresh token lifetime |

---

## CORS

- The `CORS_ORIGIN` environment variable defines the strict allowlist of permitted origins
- Only the configured origin(s) may send credentialed requests
- Preflight (`OPTIONS`) requests are handled automatically
- No wildcard (`*`) origins are permitted when credentials are enabled
- In production, `CORS_ORIGIN` must match the exact frontend deployment URL

---

## File Uploads (KYC)

KYC identity verification requires document uploads. The following controls are in place:

- **File type validation**: Only JPEG, PNG, and PDF are accepted; validated by both MIME type and file extension
- **File size limits**: Maximum 5 MB per file
- **Storage abstraction**: Local filesystem in development, cloud object storage (S3-compatible) in production
- **Access control**: Uploaded files are stored in a non-public directory and served only through authenticated API endpoints
- **Filename sanitization**: Original filenames are replaced with UUIDs to prevent path traversal
- **Virus scanning**: Planned for production (integration point documented)

---

## Database Security

- **Parameterized queries only**: All SQL is executed through parameterized statements via the `pg` library. No query is ever built with string concatenation.
- **Connection pooling**: The database connection pool is configured with sensible limits to prevent connection exhaustion
- **Least privilege**: The application database user has only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` permissions. Schema migrations run under a separate privileged user.
- **Sensitive data hashing**: Passwords (bcrypt), refresh token hashes (SHA-256), OTP codes (bcrypt), and password reset tokens (SHA-256) are never stored in plaintext
- **No sensitive data in logs**: Database query logging in development omits parameter values

---

## Vulnerability Checklist

This checklist maps common vulnerability classes to the controls implemented in Taggy:

- [x] **SQL Injection**: All queries use parameterized statements; no string concatenation with user input
- [x] **Cross-Site Scripting (XSS)**: Content-Security-Policy headers restrict script sources; React auto-escapes output; user input is sanitized server-side
- [x] **Cross-Site Request Forgery (CSRF)**: `SameSite=Lax` cookies prevent cross-origin submission; strict CORS policy rejects unknown origins
- [x] **Broken Authentication**: Refresh token rotation with replay detection; rate limiting on auth endpoints; bcrypt password hashing
- [x] **Sensitive Data Exposure**: Access tokens stored in memory only (never `localStorage`); refresh tokens in `HttpOnly` cookies; all secrets loaded from environment variables
- [x] **Security Misconfiguration**: Helmet.js sets secure headers by default; strict CORS; no default credentials; environment-specific configuration
- [x] **Insecure Direct Object References (IDOR)**: All data-access queries include ownership checks (`WHERE user_id = $1`); service layer enforces authorization
- [x] **Missing Function-Level Access Control**: Authentication middleware applied to all protected routes; role-based guards where applicable
- [x] **Using Components with Known Vulnerabilities**: `pnpm audit` integrated into CI; dependency updates tracked; lock file committed
- [x] **Unvalidated Redirects and Forwards**: No user-controlled redirects; all navigation handled client-side by the router
- [x] **Rate Limiting**: Global rate limit (100/15min) on all endpoints; strict limit (5/15min) on auth endpoints; per-code OTP attempt limit
- [x] **File Upload Vulnerabilities**: MIME type and extension validation; size limits; UUID filenames; non-public storage; authenticated access only

---

## Threat Model

### Account Takeover

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Credential stuffing | Automated login attempts with leaked credentials | Rate limiting (5 attempts/15 min on auth), bcrypt cost factor 12 |
| OTP interception | SIM swap or SS7 attack | OTP expiry (5 min), single-use codes, future: WebAuthn as primary factor |
| Password reset abuse | Attacker requests reset for victim's account | Reset tokens are hashed, single-use, short-lived (30-60 min), sent to registered email only |

### Session Hijacking

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Token theft via XSS | Malicious script reads token from storage | Access tokens in memory only (not `localStorage`); refresh tokens in `HttpOnly` cookies; CSP headers |
| Token theft via network sniffing | MITM on unencrypted connection | HSTS enforces HTTPS; `Secure` cookie flag; TLS termination at reverse proxy |
| Refresh token replay | Attacker reuses a previously valid refresh token | Token rotation: each use invalidates the old token; replay triggers full session revocation |

### Phone Number Enumeration

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Timing-based enumeration | Different response times for existing vs. non-existing numbers | Constant-time response for OTP requests regardless of phone number existence |
| Response-based enumeration | Different response messages for existing vs. non-existing numbers | Identical success response for all OTP requests ("If this number is registered, an OTP has been sent") |

### OTP Brute Force

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Code guessing | Automated attempts to guess 6-digit OTP | Max 5 attempts per code; rate limit on verification endpoint; code invalidated after max attempts |
| Code generation flooding | Requesting many OTPs to increase odds | Rate limit on OTP request endpoint (5 per 15 min per phone number) |

### Token Replay

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Refresh token reuse | Attacker captures and replays a refresh token | Token rotation with server-side revocation; replay detection triggers full user session invalidation |
| Access token reuse | Attacker captures and replays an access token | Short lifetime (1 hour); no revocation needed due to natural expiry; critical operations may require re-authentication |

### Privilege Escalation

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Role manipulation | Tampering with JWT claims to elevate role | JWTs are signed server-side; role is read from the verified token, never from client input |
| IDOR exploitation | Accessing resources belonging to other users by changing IDs | All database queries include ownership predicates; service layer enforces authorization checks |
| Admin endpoint access | Accessing admin routes without proper role | Auth middleware verifies role on every request to protected routes; no role information exposed to client |

---

## Production Checklist

Complete this checklist before deploying to production:

- [ ] All environment secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) are strong, randomly generated values (minimum 32 characters for signing secrets)
- [ ] TLS certificates are installed and configured in the Nginx reverse proxy (`docker/nginx/certs/`)
- [ ] HSTS header is enabled with a long max-age (`Strict-Transport-Security: max-age=31536000; includeSubDomains`)
- [ ] Database credentials have been rotated from any defaults used during development
- [ ] The database application user has minimal privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE` only)
- [ ] Rate limiting is configured and tested (global: 100/15min, auth: 5/15min)
- [ ] Error responses do not leak internal details (stack traces, SQL errors, file paths)
- [ ] Application logging is configured to exclude sensitive data (passwords, tokens, OTPs, PII)
- [ ] `pnpm audit` reports no high or critical vulnerabilities
- [ ] `CORS_ORIGIN` is set to the exact production frontend URL (no wildcards)
- [ ] `SMS_PROVIDER` is set to `twilio` (not `console`)
- [ ] `EMAIL_PROVIDER` is set to `sendgrid` (not `console`)
- [ ] Cookie `Secure` flag is enabled (automatic when `NODE_ENV=production`)
- [ ] Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) is configured with the production value from the Stripe dashboard
- [ ] Docker images are built from pinned base image versions
- [ ] Backup and recovery procedures are documented and tested for the PostgreSQL database
- [ ] Access to production infrastructure is restricted and auditable

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly by contacting the maintainers directly. Do not open a public issue.
