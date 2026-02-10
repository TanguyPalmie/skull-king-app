# API Documentation

Base URL: `http://localhost:4000` (development) | `https://api.taggy.app` (production)

All endpoints return JSON. Authenticated endpoints require a `Bearer` token in the `Authorization` header.

---

## Table of Contents

- [Authentication](#authentication)
- [WebAuthn](#webauthn)
- [Profile](#profile)
- [Queue (Matchmaking)](#queue-matchmaking)
- [Matches](#matches)
- [Events](#events)
- [Billing](#billing)
- [Social](#social)
- [KYC](#kyc)
- [Notifications](#notifications)
- [Common Error Responses](#common-error-responses)

---

## Authentication

All auth endpoints are rate-limited to **5 requests per 15 minutes per IP**.

### POST /auth/request-otp

Request a one-time password sent via SMS to the given phone number.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP) + 5/15min per phone number

**Request body:**

```json
{
  "phone": "+33612345678"
}
```

**Success response (200):**

```json
{
  "message": "If this number is registered, an OTP has been sent.",
  "expiresIn": 300
}
```

> The response is intentionally identical whether the phone number exists or not, to prevent enumeration.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_PHONE` | Phone number format is invalid |
| 429 | `RATE_LIMITED` | Too many OTP requests |

---

### POST /auth/verify-otp

Verify the OTP code and receive authentication tokens. If the phone number is new, a user account is created automatically.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "phone": "+33612345678",
  "code": "482901"
}
```

**Success response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "phone": "+33612345678",
    "displayName": null,
    "isNewUser": true
  }
}
```

> The refresh token is set as an `HttpOnly` cookie (not in the response body).

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_OTP` | OTP code is incorrect or expired |
| 400 | `OTP_MAX_ATTEMPTS` | Maximum verification attempts exceeded |
| 429 | `RATE_LIMITED` | Too many verification attempts |

---

### POST /auth/login

Authenticate with email and password (for users who have set a password).

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "email": "player@example.com",
  "password": "secureP@ss123"
}
```

**Success response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "phone": "+33612345678",
    "email": "player@example.com",
    "displayName": "Alex"
  }
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_CREDENTIALS` | Email or password is incorrect |
| 429 | `RATE_LIMITED` | Too many login attempts |

---

### POST /auth/refresh

Exchange a valid refresh token for a new access token and rotated refresh token.

- **Auth required**: No (uses refresh cookie)
- **Rate limit**: Global (100/15min per IP)

**Request body:** None (refresh token is read from the `HttpOnly` cookie).

**Success response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> A new refresh token cookie is set in the response.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token is missing, expired, or revoked |
| 401 | `TOKEN_REUSE_DETECTED` | Replay attack detected; all sessions revoked |

---

### POST /auth/logout

Revoke the current refresh token and clear the cookie.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:** None.

**Success response (200):**

```json
{
  "message": "Logged out successfully."
}
```

---

### POST /auth/forgot-password

Request a password reset email.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "email": "player@example.com"
}
```

**Success response (200):**

```json
{
  "message": "If an account with this email exists, a reset link has been sent."
}
```

> The response is intentionally identical whether the email exists or not.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_EMAIL` | Email format is invalid |
| 429 | `RATE_LIMITED` | Too many reset requests |

---

### POST /auth/reset-password

Set a new password using a reset token received via email.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "token": "a4f8c2e1b3d7...",
  "newPassword": "newSecureP@ss456"
}
```

**Success response (200):**

```json
{
  "message": "Password has been reset successfully."
}
```

> All existing refresh tokens for the user are revoked after a successful reset.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_TOKEN` | Reset token is missing, expired, or already used |
| 400 | `WEAK_PASSWORD` | Password does not meet minimum requirements (8+ characters) |
| 429 | `RATE_LIMITED` | Too many reset attempts |

---

## WebAuthn

WebAuthn endpoints enable passkey/biometric registration and login. These follow the FIDO2 challenge-response flow.

### POST /webauthn/register/options

Generate WebAuthn registration options (challenge) for the authenticated user.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:** None.

**Success response (200):**

```json
{
  "challenge": "dGVzdC1jaGFsbGVuZ2U...",
  "rp": {
    "name": "Taggy",
    "id": "taggy.app"
  },
  "user": {
    "id": "YTFiMmMzZDQ...",
    "name": "+33612345678",
    "displayName": "Alex"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  },
  "timeout": 60000
}
```

---

### POST /webauthn/register/verify

Complete WebAuthn registration by submitting the authenticator response.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "id": "credential-id-base64url",
  "rawId": "credential-raw-id-base64url",
  "response": {
    "attestationObject": "base64url-encoded-attestation",
    "clientDataJSON": "base64url-encoded-client-data"
  },
  "type": "public-key"
}
```

**Success response (200):**

```json
{
  "message": "WebAuthn credential registered successfully.",
  "credentialId": "credential-id-base64url"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_ATTESTATION` | Authenticator response verification failed |
| 409 | `CREDENTIAL_EXISTS` | This credential is already registered |

---

### POST /webauthn/login/options

Generate WebAuthn login options (challenge) for a user.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "phone": "+33612345678"
}
```

**Success response (200):**

```json
{
  "challenge": "dGVzdC1jaGFsbGVuZ2U...",
  "allowCredentials": [
    {
      "id": "credential-id-base64url",
      "type": "public-key",
      "transports": ["internal"]
    }
  ],
  "timeout": 60000,
  "userVerification": "required"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 404 | `NO_CREDENTIALS` | No WebAuthn credentials found for this user |

---

### POST /webauthn/login/verify

Complete WebAuthn login by submitting the authenticator assertion.

- **Auth required**: No
- **Rate limit**: Sensitive (5/15min per IP)

**Request body:**

```json
{
  "id": "credential-id-base64url",
  "rawId": "credential-raw-id-base64url",
  "response": {
    "authenticatorData": "base64url-encoded-auth-data",
    "clientDataJSON": "base64url-encoded-client-data",
    "signature": "base64url-encoded-signature"
  },
  "type": "public-key"
}
```

**Success response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "phone": "+33612345678",
    "displayName": "Alex"
  }
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_ASSERTION` | Authenticator assertion verification failed |
| 401 | `AUTHENTICATION_FAILED` | User could not be authenticated |

---

## Profile

### GET /me

Retrieve the authenticated user's profile.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Success response (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phone": "+33612345678",
  "email": "player@example.com",
  "displayName": "Alex",
  "avatarUrl": "https://cdn.taggy.app/avatars/a1b2c3d4.jpg",
  "bio": "Tennis and basketball enthusiast",
  "dateOfBirth": "1995-03-15",
  "languages": ["fr", "en"],
  "sports": [
    { "sportId": "tennis", "level": 3 },
    { "sportId": "basketball", "level": 2 }
  ],
  "location": {
    "lat": 48.8566,
    "lng": 2.3522,
    "label": "Paris, France"
  },
  "kycStatus": "verified",
  "rating": 4.2,
  "ratingCount": 17,
  "createdAt": "2025-01-10T14:30:00Z"
}
```

---

### PATCH /me

Update the authenticated user's profile fields. Only provided fields are updated.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body (all fields optional):**

```json
{
  "displayName": "Alex M.",
  "bio": "Love playing tennis on weekends",
  "email": "newemail@example.com",
  "dateOfBirth": "1995-03-15",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522,
    "label": "Paris, France"
  }
}
```

**Success response (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "displayName": "Alex M.",
  "bio": "Love playing tennis on weekends",
  "email": "newemail@example.com",
  "dateOfBirth": "1995-03-15",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522,
    "label": "Paris, France"
  },
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | One or more fields failed validation |
| 409 | `EMAIL_TAKEN` | Email address is already in use by another account |

---

### PUT /me/languages

Replace the authenticated user's language preferences.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "languages": ["fr", "en", "es"]
}
```

**Success response (200):**

```json
{
  "languages": ["fr", "en", "es"]
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_LANGUAGE` | One or more language codes are not supported (supported: `fr`, `en`, `es`) |

---

### PUT /me/sports

Replace the authenticated user's sport preferences with skill levels.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "sports": [
    { "sportId": "tennis", "level": 3 },
    { "sportId": "basketball", "level": 2 },
    { "sportId": "running", "level": 4 }
  ]
}
```

> `level` is an integer from 1 (beginner) to 5 (expert).

**Success response (200):**

```json
{
  "sports": [
    { "sportId": "tennis", "level": 3 },
    { "sportId": "basketball", "level": 2 },
    { "sportId": "running", "level": 4 }
  ]
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_SPORT` | One or more sport IDs are not recognized |
| 400 | `INVALID_LEVEL` | Level must be an integer between 1 and 5 |

---

## Queue (Matchmaking)

The matchmaking queue pairs players by sport, skill level, time window, location proximity, and language preference.

### POST /queue/join

Join the matchmaking queue for a specific sport and time window.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "sportId": "tennis",
  "timeWindow": {
    "start": "2025-07-15T09:00:00Z",
    "end": "2025-07-15T12:00:00Z"
  },
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  },
  "maxDistance": 10,
  "languages": ["fr", "en"]
}
```

> `maxDistance` is in kilometers.

**Success response (200):**

```json
{
  "queueEntryId": "q-1a2b3c4d-5e6f-7890-abcd-ef1234567890",
  "status": "searching",
  "sportId": "tennis",
  "estimatedWait": 120,
  "joinedAt": "2025-07-14T18:30:00Z"
}
```

> `estimatedWait` is in seconds.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid sport, time window, or location |
| 400 | `INVALID_TIME_WINDOW` | Start must be before end; window must be in the future |
| 409 | `ALREADY_IN_QUEUE` | User is already in the queue for this sport and overlapping time |

---

### POST /queue/leave

Leave the matchmaking queue.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "queueEntryId": "q-1a2b3c4d-5e6f-7890-abcd-ef1234567890"
}
```

**Success response (200):**

```json
{
  "message": "Left the queue successfully."
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 404 | `QUEUE_ENTRY_NOT_FOUND` | Queue entry does not exist or does not belong to the user |

---

### GET /queue/status

Get the current queue status for the authenticated user.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Success response (200):**

```json
{
  "entries": [
    {
      "queueEntryId": "q-1a2b3c4d-5e6f-7890-abcd-ef1234567890",
      "sportId": "tennis",
      "status": "searching",
      "estimatedWait": 85,
      "joinedAt": "2025-07-14T18:30:00Z"
    }
  ]
}
```

> `status` values: `searching`, `matched`, `expired`.

---

## Matches

### GET /matches/:id

Retrieve details of a match created by the matchmaking system.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Success response (200):**

```json
{
  "id": "m-9f8e7d6c-5b4a-3210-fedc-ba0987654321",
  "sportId": "tennis",
  "status": "confirmed",
  "scheduledAt": "2025-07-15T10:00:00Z",
  "location": {
    "lat": 48.8580,
    "lng": 2.3510,
    "label": "Court Municipal de Tennis, Paris"
  },
  "players": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "displayName": "Alex",
      "level": 3,
      "rating": 4.2
    },
    {
      "userId": "f6e5d4c3-b2a1-0987-6543-210fedcba987",
      "displayName": "Jordan",
      "level": 3,
      "rating": 4.5
    }
  ],
  "createdAt": "2025-07-14T18:35:00Z"
}
```

> `status` values: `pending`, `confirmed`, `completed`, `cancelled`.

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 403 | `FORBIDDEN` | User is not a participant in this match |
| 404 | `MATCH_NOT_FOUND` | Match does not exist |

---

## Events

Events are user-created sports gatherings. Events with 20 or fewer participants are free; larger events require Stripe payment.

### POST /events

Create a new sports event.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "title": "Sunday Basketball Pickup Game",
  "description": "Friendly 5v5 game. All levels welcome!",
  "sportId": "basketball",
  "scheduledAt": "2025-07-20T14:00:00Z",
  "durationMinutes": 90,
  "location": {
    "lat": 48.8620,
    "lng": 2.3400,
    "label": "Parc des Buttes-Chaumont, Paris"
  },
  "maxParticipants": 10,
  "minLevel": 1,
  "maxLevel": 5,
  "languages": ["fr", "en"],
  "price": 0
}
```

> If `maxParticipants` > 20, a `price` (in cents) is required and payment is processed via Stripe.

**Success response (201):**

```json
{
  "id": "e-abcdef12-3456-7890-abcd-ef1234567890",
  "title": "Sunday Basketball Pickup Game",
  "description": "Friendly 5v5 game. All levels welcome!",
  "sportId": "basketball",
  "scheduledAt": "2025-07-20T14:00:00Z",
  "durationMinutes": 90,
  "location": {
    "lat": 48.8620,
    "lng": 2.3400,
    "label": "Parc des Buttes-Chaumont, Paris"
  },
  "maxParticipants": 10,
  "currentParticipants": 1,
  "minLevel": 1,
  "maxLevel": 5,
  "languages": ["fr", "en"],
  "price": 0,
  "organizer": {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "displayName": "Alex"
  },
  "createdAt": "2025-07-14T20:00:00Z"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | One or more fields failed validation |
| 400 | `PRICE_REQUIRED` | Events with >20 participants require a price |
| 400 | `INVALID_TIME` | Scheduled time must be in the future |

---

### GET /events

List events with optional filters.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `sportId` | string | Filter by sport |
| `lat` | number | Latitude for proximity search |
| `lng` | number | Longitude for proximity search |
| `maxDistance` | number | Maximum distance in km (default: 25) |
| `from` | ISO 8601 | Start of date range |
| `to` | ISO 8601 | End of date range |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |

**Success response (200):**

```json
{
  "events": [
    {
      "id": "e-abcdef12-3456-7890-abcd-ef1234567890",
      "title": "Sunday Basketball Pickup Game",
      "sportId": "basketball",
      "scheduledAt": "2025-07-20T14:00:00Z",
      "durationMinutes": 90,
      "location": {
        "lat": 48.8620,
        "lng": 2.3400,
        "label": "Parc des Buttes-Chaumont, Paris"
      },
      "maxParticipants": 10,
      "currentParticipants": 4,
      "price": 0,
      "organizer": {
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "displayName": "Alex"
      },
      "distance": 2.3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

### POST /events/:id/join

Join an existing event. If the event requires payment (>20 participants), a Stripe checkout session is created.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:** None.

**Success response (200) -- free event:**

```json
{
  "message": "Successfully joined the event.",
  "eventId": "e-abcdef12-3456-7890-abcd-ef1234567890",
  "currentParticipants": 5
}
```

**Success response (200) -- paid event:**

```json
{
  "message": "Payment required to join.",
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "eventId": "e-abcdef12-3456-7890-abcd-ef1234567890"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 404 | `EVENT_NOT_FOUND` | Event does not exist |
| 409 | `ALREADY_JOINED` | User has already joined this event |
| 409 | `EVENT_FULL` | Event has reached its maximum participant count |
| 400 | `EVENT_PAST` | Event has already occurred |
| 403 | `LEVEL_MISMATCH` | User's skill level is outside the event's min/max range |

---

## Billing

Stripe integration for paid events (>20 participants).

### POST /billing/checkout

Create a Stripe checkout session for a paid event.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "eventId": "e-abcdef12-3456-7890-abcd-ef1234567890"
}
```

**Success response (200):**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_a1b2c3d4..."
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 404 | `EVENT_NOT_FOUND` | Event does not exist |
| 400 | `EVENT_NOT_PAID` | Event does not require payment |
| 409 | `ALREADY_PAID` | User has already paid for this event |

---

### POST /billing/webhook

Stripe webhook receiver. Processes payment confirmations and updates event participation.

- **Auth required**: No (verified via Stripe webhook signature)
- **Rate limit**: None (Stripe IPs only)

**Request body:** Raw Stripe event payload (see [Stripe Webhook documentation](https://stripe.com/docs/webhooks)).

**Handled event types:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Confirm participant and add to event |
| `checkout.session.expired` | Release the reserved spot |

**Success response (200):**

```json
{
  "received": true
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_SIGNATURE` | Stripe webhook signature verification failed |

---

## Social

### POST /ratings

Submit a rating and optional comment for a user after a shared activity (match or event).

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "targetUserId": "f6e5d4c3-b2a1-0987-6543-210fedcba987",
  "activityType": "match",
  "activityId": "m-9f8e7d6c-5b4a-3210-fedc-ba0987654321",
  "score": 4,
  "comment": "Great sportsmanship, very punctual."
}
```

> `score` is an integer from 1 to 5. `comment` is optional (max 500 characters). `activityType` is either `match` or `event`.

**Success response (201):**

```json
{
  "id": "r-12345678-abcd-ef01-2345-678901234567",
  "targetUserId": "f6e5d4c3-b2a1-0987-6543-210fedcba987",
  "activityType": "match",
  "activityId": "m-9f8e7d6c-5b4a-3210-fedc-ba0987654321",
  "score": 4,
  "comment": "Great sportsmanship, very punctual.",
  "createdAt": "2025-07-16T09:00:00Z"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid score, missing required fields, or comment too long |
| 403 | `NOT_PARTICIPANT` | Rater and target were not both participants in the specified activity |
| 404 | `ACTIVITY_NOT_FOUND` | The specified activity does not exist |
| 409 | `ALREADY_RATED` | User has already submitted a rating for this target in this activity |

---

### POST /blocks

Shadow-block a user. The blocked user will not be notified and will not appear in the blocker's matchmaking results or event listings.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body:**

```json
{
  "targetUserId": "f6e5d4c3-b2a1-0987-6543-210fedcba987"
}
```

**Success response (201):**

```json
{
  "message": "User has been blocked.",
  "blockedUserId": "f6e5d4c3-b2a1-0987-6543-210fedcba987"
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `CANNOT_BLOCK_SELF` | Users cannot block themselves |
| 404 | `USER_NOT_FOUND` | Target user does not exist |
| 409 | `ALREADY_BLOCKED` | Target user is already blocked |

---

## KYC

Light identity verification required after a user's first activity.

### POST /kyc/submit

Submit identity documents for KYC verification.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Request body** (`multipart/form-data`):

| Field | Type | Description |
|---|---|---|
| `documentType` | string | `passport`, `national_id`, or `drivers_license` |
| `documentFront` | file | Front image of the document (JPEG/PNG, max 5 MB) |
| `documentBack` | file | Back image of the document (JPEG/PNG, max 5 MB, optional for passport) |

**Success response (200):**

```json
{
  "kycId": "kyc-abcdef12-3456-7890-abcd-ef1234567890",
  "status": "pending",
  "submittedAt": "2025-07-16T10:00:00Z",
  "message": "Documents submitted successfully. Verification typically takes 1-2 business days."
}
```

**Error codes:**

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_DOCUMENT_TYPE` | Unrecognized document type |
| 400 | `INVALID_FILE` | File type not supported or exceeds size limit |
| 400 | `MISSING_DOCUMENT` | Required document image not provided |
| 409 | `KYC_ALREADY_SUBMITTED` | A KYC submission is already pending or approved |

---

### GET /kyc/status

Check the current KYC verification status.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Success response (200):**

```json
{
  "status": "verified",
  "submittedAt": "2025-07-16T10:00:00Z",
  "verifiedAt": "2025-07-17T14:30:00Z"
}
```

> `status` values: `none`, `pending`, `verified`, `rejected`.

If rejected:

```json
{
  "status": "rejected",
  "submittedAt": "2025-07-16T10:00:00Z",
  "rejectedAt": "2025-07-17T14:30:00Z",
  "reason": "Document image is unclear. Please resubmit with a higher quality photo."
}
```

---

## Notifications

### GET /notifications

Retrieve the authenticated user's notifications, ordered by most recent first.

- **Auth required**: Yes
- **Rate limit**: Global (100/15min per IP)

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |
| `unreadOnly` | boolean | Filter to unread notifications only (default: false) |

**Success response (200):**

```json
{
  "notifications": [
    {
      "id": "n-11111111-2222-3333-4444-555555555555",
      "type": "match_found",
      "title": "Match Found!",
      "body": "You've been matched with Jordan for tennis on July 15 at 10:00 AM.",
      "data": {
        "matchId": "m-9f8e7d6c-5b4a-3210-fedc-ba0987654321"
      },
      "read": false,
      "createdAt": "2025-07-14T18:35:00Z"
    },
    {
      "id": "n-66666666-7777-8888-9999-aaaaaaaaaaaa",
      "type": "event_reminder",
      "title": "Event Tomorrow",
      "body": "Don't forget: Sunday Basketball Pickup Game tomorrow at 2:00 PM.",
      "data": {
        "eventId": "e-abcdef12-3456-7890-abcd-ef1234567890"
      },
      "read": true,
      "createdAt": "2025-07-19T09:00:00Z"
    },
    {
      "id": "n-bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      "type": "kyc_verified",
      "title": "Identity Verified",
      "body": "Your identity verification has been approved.",
      "data": {},
      "read": true,
      "createdAt": "2025-07-17T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

**Notification types:**

| Type | Description |
|---|---|
| `match_found` | Matchmaking queue found a match |
| `match_confirmed` | All players confirmed the match |
| `match_cancelled` | A match was cancelled |
| `event_reminder` | Reminder for an upcoming event |
| `event_joined` | A new participant joined your event |
| `event_cancelled` | An event was cancelled |
| `rating_received` | Another user rated you |
| `kyc_verified` | KYC verification approved |
| `kyc_rejected` | KYC verification rejected |
| `payment_confirmed` | Stripe payment confirmed |

---

## Common Error Responses

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description."
  }
}
```

### Standard HTTP Status Codes

| Status | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but lacking permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Authentication Errors (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token is missing or invalid."
  }
}
```

### Rate Limit Errors (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

The response includes a `Retry-After` header indicating how many seconds to wait before retrying.

### Validation Errors (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "phone",
        "message": "Phone number must be in E.164 format (e.g. +33612345678)."
      }
    ]
  }
}
```
