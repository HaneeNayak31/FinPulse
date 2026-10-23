# FinPulse

FinPulse is a paper-trading portfolio app for tracking stock holdings, monitoring live quote updates, and practicing buy and sell decisions without real money.

It includes:

- Portfolio creation and selection
- Paper buy and sell orders
- Average-cost basis and unrealized P&L calculations
- Portfolio allocation by position
- Market watchlist for AAPL, MSFT, GOOGL, and TSLA
- Live quote updates through WebSockets and portfolio-scoped SSE
- Short-term price trend charts based on observed quote updates
- Redis caching with a PostgreSQL fallback
- JWT authentication, password hashing, CORS controls, and rate limiting
- Responsive light and dark themes

> FinPulse is not a brokerage service. Prices and orders are simulated, and no real funds or securities are involved.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| API | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache and messaging | Redis 7 |
| Realtime | WebSocket and Server-Sent Events |
| Authentication | JWT and bcrypt |
| Testing | Node test runner, tsx, PostgreSQL, Redis |

## Project layout

```text
FinPulse/
├── src/                 Backend API and realtime server
├── frontend/src/        Pages, components, charts, state, and API client
├── tests/               Backend integration and calculation tests
├── finpulse_schema.sql  PostgreSQL schema
├── db/seed.sql          Initial market assets for a fresh database
├── docker-compose.yml   PostgreSQL, Redis, and backend services
└── Dockerfile            Production backend image
```

## Requirements

- Node.js 20 or newer
- Docker Desktop with Docker Compose

The backend test suite also requires PostgreSQL and Redis to be reachable locally.

## Configuration

Copy the example environment file and set the database password and JWT secret:

```powershell
Copy-Item .env.example .env
```

Example local configuration:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/FinPulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
```

For Docker Compose, the backend uses the internal hosts `db` and `redis`; Compose supplies those connection strings automatically.

## Run with Docker Compose

From the repository root:

```powershell
docker compose up --build
```

Services:

- Frontend development server: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- PostgreSQL from the host: `localhost:5433`
- Redis from the host: `localhost:6379`

On first database initialization, PostgreSQL runs `finpulse_schema.sql` and then inserts baseline assets from `db/seed.sql`.

If the database volume was created before the initialization files were added, PostgreSQL will not rerun them automatically. Recreate only the project database volume when a clean local database is intended:

```powershell
docker compose down -v
docker compose up --build
```

## Run locally

Start PostgreSQL and Redis first, then install and run the backend:

```powershell
npm install
npm run build
npm run dev
```

In a second terminal, start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

The Vite development server proxies `/auth`, `/assets`, `/portfolios`, and WebSocket traffic to the backend.

### Production deployment

The frontend production build reads `VITE_API_BASE_URL` and `VITE_WS_URL` from `frontend/.env.production`; values set in the Vercel project environment override these defaults. The deployed values point to the Render API over HTTPS and its WebSocket endpoint over WSS. The backend allows the deployed Vercel origin and any additional exact origins listed in `CORS_ORIGIN` (comma-separated); it does not allow arbitrary origins.

Render must provide a reachable PostgreSQL `DATABASE_URL` and a strong `JWT_SECRET`. The root endpoint (`/`) is a liveness check. Use `/health/ready` to check whether the backend can query PostgreSQL; it returns 503 when the database is unavailable. Login and registration both require PostgreSQL.

## Verification

Backend build:

```powershell
npm run build
```

Backend integration tests:

```powershell
npm test
```

Frontend production build:

```powershell
Set-Location frontend
npm run build
```

Frontend linting:

```powershell
npm run lint
```

Integration tests use the `finpulse_test` database derived from `DATABASE_URL`. They initialize missing tables, seed standard assets, and clean users, portfolios, holdings, and orders between suites.

## User flows

### Sign up and sign in

1. Open `/register` and create an account with a username, email, and password of at least eight characters.
2. Sign in at `/login`.
3. FinPulse stores the session token in the browser and opens the overview.

### Create a portfolio

Create a portfolio from the overview or portfolio page. A user can have multiple portfolios and switch between them from the header.

### Place a paper trade

Choose an asset from Markets, the overview watchlist, or Portfolio, then choose Buy or Sell. A buy creates or updates a holding using weighted average cost. A sell is allowed only for shares currently held.

### Understand portfolio performance

- Market value is current price multiplied by quantity.
- Cost basis is quantity multiplied by average purchase price.
- Unrealized P&L is market value minus cost basis.
- The allocation chart shows each position's share of portfolio market value.
- Market cards show a compact trend line once quote updates have been observed in the current session.

## API reference

Authenticated endpoints use `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | No | API health response |
| GET | `/health/ready` | No | Readiness check including PostgreSQL connectivity |
| POST | `/auth/register` | No | Create a user |
| POST | `/auth/login` | No | Sign in and receive a JWT |
| GET | `/auth/me` | Yes | Return the current user |
| GET | `/assets` | No | List market assets |
| GET | `/assets/:symbol` | No | Read one asset quote |
| POST | `/assets/:symbol/simulate` | No | Generate a paper price update |
| GET | `/portfolios` | Yes | List the user's portfolios |
| POST | `/portfolios` | Yes | Create a portfolio |
| GET | `/portfolios/:id` | Yes | Read one owned portfolio |
| GET | `/portfolios/:id/holdings` | Yes | Read current holdings and valuation |
| POST | `/portfolios/:id/orders` | Yes | Place a BUY or SELL order |
| GET | `/portfolios/:id/orders` | Yes | Read paginated order history |
| GET | `/portfolios/:id/events` | Yes | Stream scoped portfolio price events |

WebSocket clients connect to the server and send messages such as:

```json
{ "type": "SUBSCRIBE", "symbol": "AAPL" }
```

Price events are delivered only to clients subscribed to the matching symbol. SSE portfolio streams are additionally scoped to assets currently held by that portfolio.

## Data and transaction safety

Order execution runs inside a PostgreSQL transaction. Portfolio ownership is checked before execution, sell holdings are locked with `FOR UPDATE`, and the transaction rolls back if validation or persistence fails. This prevents concurrent sell requests from overselling a holding.

Redis improves quote reads and carries market events, but it is optional for database-backed portfolio functionality. The application falls back to PostgreSQL when Redis is unavailable.

## Troubleshooting

### Backend cannot connect to PostgreSQL

Confirm that the database is running and that the connection string points to the correct port. Compose exposes PostgreSQL on `5433` to the host, while the local `.env` example uses `5432` for a native PostgreSQL installation.

```powershell
docker compose ps
docker compose logs db
```

### The database has no assets or tables

Initialization scripts run only when the PostgreSQL data volume is empty. Recreate the local project volume as described above, then start Compose again.

### Redis is unavailable

The API can still serve database-backed features and logs Redis as optional. Realtime updates, cache hits, and quote event delivery require Redis to be running.

### Frontend cannot reach the API

Run the backend on port 4000, or set the frontend API variables in `frontend/.env` to the correct API and WebSocket URLs. The default Vite proxy expects `http://localhost:4000`.

## Design principles

- Keep product language focused on decisions and outcomes rather than implementation details.
- Show charts only where a visual trend improves understanding: market cards show price movement and the portfolio shows allocation.
- Keep simulated data clearly labeled so it cannot be mistaken for live brokerage data.
- Preserve precise numeric handling for fractional shares and average-cost calculations.
- Keep user data isolated by authenticated ownership checks on every portfolio operation.
