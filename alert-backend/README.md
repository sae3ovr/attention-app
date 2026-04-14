# Alert.io — Backend API

REST API for the Alert.io community safety platform. Built with **Express + TypeScript**, backed by **PostgreSQL 16**.

## Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 16** (or Docker)

### With Docker (recommended)

```bash
# From the monorepo root (attention-app/)
cp .env.example .env
# Edit .env with strong passwords!

docker-compose up -d
```

### Without Docker

```bash
cd alert-backend
npm install

# Set required environment variables
export DATABASE_URL=postgresql://user:pass@localhost:5432/alertio
export JWT_SECRET=$(openssl rand -hex 32)

# Run migrations manually against your PostgreSQL
psql $DATABASE_URL -f migrations/001_initial.sql

# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes (prod)** | `postgresql://alertio:alertio_dev@localhost:5432/alertio` | PostgreSQL connection string |
| `JWT_SECRET` | **Yes (prod)** | `alertio-dev-secret` | JWT signing secret (use 64+ random chars) |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment (`production` enables SSL, hides errors) |
| `CORS_ORIGINS` | No | `http://localhost:8081,http://localhost:8080` | Comma-separated allowed origins |

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login (returns JWT) |
| `GET` | `/auth/me` | Get current user (auth required) |

### Incidents (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/incidents` | List incidents (limit 200) |
| `POST` | `/incidents` | Create incident |
| `PATCH` | `/incidents/:id/confirm` | Confirm incident |
| `PATCH` | `/incidents/:id/deny` | Deny incident |

### Family (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/family/groups` | List user's family groups |
| `POST` | `/family/groups` | Create family group |
| `POST` | `/family/join` | Join group by invite code |
| `GET` | `/family/members` | List family members |
| `PATCH` | `/family/members/:id/location` | Update member location (ownership verified) |

### Chains (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/chains` | List user's chains |
| `POST` | `/chains` | Create chain |
| `POST` | `/chains/join` | Join by invite code |
| `GET` | `/chains/:id/messages` | Get messages (membership verified) |
| `POST` | `/chains/:id/messages` | Send message (membership verified) |

### Other (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST/PATCH/DELETE` | `/tracked-items/*` | Tracked items CRUD |
| `POST` | `/sos/alert` | Send SOS alert |
| `POST` | `/sos/family-panic` | Family panic alert |
| `GET` | `/cameras` | List public cameras |

## Security

- **Parameterized SQL** — all queries use `$1`, `$2` placeholders (no injection risk)
- **bcrypt password hashing** — cost factor 10
- **JWT with HS256** — explicitly pinned algorithm, 7-day expiry
- **CORS restricted** — only allowed origins via `CORS_ORIGINS` env var
- **Ownership checks** — family location updates verify group membership
- **Chain membership** — messages require verified membership
- **Error sanitization** — internal errors hidden in production mode
- **No hardcoded secrets** — fails fast if `JWT_SECRET`/`DATABASE_URL` missing in production

## Database

Schema defined in `migrations/001_initial.sql`. Tables:

- `users` — accounts with reputation, badges, location
- `incidents` — community-reported incidents with geolocation
- `incident_votes` — confirm/deny votes with reputation tracking
- `family_groups` / `family_members` — family safety groups
- `chains` / `chain_members` / `chain_messages` — chain communication
- `tracked_items` — pets, vehicles, devices
- `sos_alerts` / `sos_contacts` — emergency alerts
- `public_cameras` — surveillance camera registry

## Docker

Multi-stage Dockerfile:
1. **Builder** — installs deps, compiles TypeScript
2. **Runtime** — production deps only, non-root user, healthcheck

```bash
docker build -t alertio-api .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3000:3000 alertio-api
```

## License

MIT
