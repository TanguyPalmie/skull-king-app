# Taggy

Mobile-first app to play sports with people of similar skill, based on time windows and location.

Taggy matches players by sport, skill level, availability, and proximity using a LoL-style matchmaking queue. Create or join events, rate opponents, and build your sports reputation -- all from your phone.

## Tech Stack

- **Frontend**: React + Material UI (MUI), Vite, pnpm
- **Backend**: Node.js + Express, pnpm
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker + Docker Compose (dev/prod/test)
- **Auth**: JWT (access + refresh with rotation), SMS OTP, WebAuthn-ready
- **Payments**: Stripe (events > 20 participants)
- **i18n**: FR / EN / ES

## Prerequisites

- Docker & Docker Compose
- Node.js >= 20 (for local development)
- pnpm >= 9

## Quick Start (Development)

```bash
# Clone and start
git clone <repo-url>
cd taggy

# Start all services (PostgreSQL + API + Web)
docker compose -f docker/docker-compose.dev.yml up --build

# Services:
# - Web:  http://localhost:3000
# - API:  http://localhost:4000
# - DB:   localhost:5432
```

Migrations and seeds run automatically on boot.

## Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (you need a running instance)
# Set DATABASE_URL in apps/api/.env

# Run migrations + seed
pnpm --filter api migrate
pnpm --filter api seed

# Start API
pnpm --filter api dev

# Start Web (in another terminal)
pnpm --filter web dev
```

## Production

```bash
# Copy and configure env
cp docker/.env.example docker/.env
# Edit docker/.env with production values

# Generate TLS certificates
mkdir -p docker/nginx/certs
# Place cert.pem and key.pem in docker/nginx/certs/

# Start
docker compose -f docker/docker-compose.prod.yml up --build -d
```

## Testing

```bash
# Run all tests via Docker
docker compose -f docker/docker-compose.test.yml up --build --abort-on-container-exit

# Or locally
pnpm test
# Which runs:
# pnpm --filter api test
# pnpm --filter web test
```

## Project Structure

```
taggy/
├── apps/
│   ├── api/              # Express backend
│   │   └── src/
│   │       ├── config/   # Environment config
│   │       ├── controllers/
│   │       ├── db/       # Migrations, seeds, pool
│   │       ├── middlewares/
│   │       ├── repositories/
│   │       ├── routes/
│   │       ├── services/
│   │       └── utils/
│   └── web/              # React + MUI frontend
│       └── src/
│           ├── api/      # API client
│           ├── components/
│           ├── contexts/
│           ├── i18n/
│           ├── pages/
│           └── test/
├── packages/
│   └── shared/           # Shared constants, validation, i18n keys
├── docker/               # Docker configs
│   ├── nginx/
│   └── scripts/
└── docs/                 # Documentation
```

## Environment Variables

All environment variables used across the application:

| Variable | Description | Default (dev) |
|---|---|---|
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `PORT` | API server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@host:5432/taggy`) | -- |
| `JWT_SECRET` | Secret key for signing access tokens (min 32 characters) | -- |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (min 32 characters) | -- |
| `CORS_ORIGIN` | Allowed CORS origin for the frontend | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe secret API key for payment processing | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for verifying events | `whsec_xxx` |
| `SMS_PROVIDER` | SMS delivery provider (`console` for dev, `twilio` for production) | `console` |
| `EMAIL_PROVIDER` | Email delivery provider (`console` for dev, `sendgrid` for production) | `console` |
| `VITE_API_URL` | Frontend API base URL (used by Vite at build time) | `http://localhost:4000` |

> **Note:** Variables without a default value are required and must be set before the application will start. In development, `console` providers print OTPs and emails to stdout instead of sending them.

## Key Features

- **Phone + SMS OTP authentication** -- mandatory for all users
- **Email + password login** -- available for password-based recovery flows
- **WebAuthn / Passkeys ready** -- biometric re-login on supported devices
- **LoL-style matchmaking queue** -- matches by sport, level, time window, location, and language
- **Sports events** -- free for up to 20 participants, Stripe-powered billing for larger events
- **Light KYC** -- identity verification required after first activity
- **Shadow blocking** -- block users silently without notification
- **Rating + comments** -- post-activity feedback system
- **Push notification ready** -- architecture supports push via service workers
- **Dark / light theme** -- user-selectable, system-aware theming
- **FR / EN / ES internationalization** -- full i18n with shared translation keys

## API Documentation

See [docs/API.md](docs/API.md) for complete endpoint reference with request/response examples.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for authentication architecture, threat model, and production hardening checklist.

## License

Proprietary. All rights reserved.
