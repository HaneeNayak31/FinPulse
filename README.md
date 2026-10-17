# FinPulse — Real-Time Fintech & Portfolio Management Engine

FinPulse is a full-stack, simulated financial transaction and portfolio management platform built with Node.js, Express, TypeScript, PostgreSQL, Redis, and WebSockets.

---

## 🏛 System Architecture

The backend follows a layered, modular architecture:

```
src/
├── config/             # Type-safe environment variable validation (env.ts)
├── controllers/        # Thin HTTP request/response handlers
│   ├── assetController.ts
│   ├── authController.ts
│   ├── orderController.ts
│   └── portfolioController.ts
├── services/           # Core business logic and database access
│   ├── assetService.ts
│   ├── authService.ts
│   ├── orderService.ts
│   ├── portfolioService.ts
│   └── priceSimulator.ts
├── routes/             # Express router declarations and path mounting
│   ├── assetRoutes.ts
│   ├── authRoutes.ts
│   ├── orderRoutes.ts
│   ├── portfolioEvents.ts
│   └── portfolioRoutes.ts
├── middleware/         # Authentication and request middleware
│   ├── auth.ts
│   ├── cors.ts         # Origin-validated CORS with preflight handling
│   └── rateLimiter.ts  # Sliding-window IP rate limiter for auth routes
├── app.ts              # Express application setup and router composition
├── server.ts           # HTTP server, WebSocket lifecycle, and graceful shutdown
├── db.ts               # PostgreSQL connection pool (pg)
└── redis.ts            # Redis client and Pub/Sub subscriber (ioredis)
```

---

## 🚀 Core Features & Implementation Highlights

### 1. Financial Order Execution & Concurrency Safety
- **ACID Transaction Boundaries**: Every order execution is wrapped in an explicit `BEGIN ... COMMIT / ROLLBACK` block.
- **Pessimistic Row Locking (`FOR UPDATE`)**: Prevents race conditions and negative holdings during concurrent SELL orders. If concurrent requests exceed available quantity, subsequent requests are safely rejected with `INSUFFICIENT_HOLDINGS`.
- **Average Cost (AVCO) Accounting**:
  - **BUY orders** blend entry prices into the weighted average cost basis:
    $$\text{AvgPrice}_{\text{new}} = \frac{Q_{\text{old}} \cdot \text{AvgPrice}_{\text{old}} + Q_{\text{buy}} \cdot P_{\text{buy}}}{Q_{\text{old}} + Q_{\text{buy}}}$$
  - **Partial SELL orders** decrement shares while holding the cost basis per share strictly invariant.
  - **Precision**: Fractional shares supported up to 4 decimal places (`numeric(14,4)`).

### 2. Real-Time Market Simulation Pipeline & Scoped SSE
- **Price Simulator**: Random-walk price fluctuations with DB persistence.
- **Redis Pub/Sub**: Price ticks publish to the `market:prices` Redis channel.
- **WebSocket Streaming**: Symbol-level subscription delivery (`SUBSCRIBE` / `UNSUBSCRIBE`).
- **Scoped Server-Sent Events (SSE)**: Streams at `/portfolios/:id/events` deliver price ticks strictly for assets currently held in that portfolio, filtering out all unheld symbols without per-tick DB queries.
- **Cache Eviction**: Automated eviction of Redis keys `asset:<SYMBOL>` and `assets:all` upon price changes.

### 3. Caching Strategy
- Redis key-value caching with 30-second TTL on `/assets` and `/assets/:symbol`.
- Automatic cache invalidation upon simulated price ticks to ensure zero stale reads.

### 4. Security & Traffic Control
- **CORS Management**: Strict origin filtering configured via `CORS_ORIGIN` (defaults to local Vite origins). Credentials allowed only for whitelisted origins; disallowed origins receive explicit 403 preflight rejection.
- **Rate Limiting**: Sliding-window rate limiter protecting `/auth/register` and `/auth/login` against brute-force attacks, returning HTTP `429 Too Many Requests` and standard `Retry-After` header. Supports proxy IP extraction via `trust proxy`.
- **Authentication**: JWT token verification (`24h` expiration) with bcrypt password hashing (10 salt rounds).
- **Data Isolation**: Strict user-ownership enforcement on all portfolio queries, orders, and event streams.
- **SQL Injection Prevention**: 100% parameterized SQL queries using PostgreSQL placeholders (`$1, $2, ...`).
- **Authentication**: JWT token verification (`24h` expiration) with bcrypt password hashing (10 salt rounds).
- **Data Isolation**: Strict user-ownership enforcement on all portfolio queries and order executions.
- **SQL Injection Prevention**: 100% parameterized SQL queries using PostgreSQL placeholders (`$1, $2, ...`).

---

## 🛠 Local Setup & Running

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose

### 1. Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:
```bash
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/FinPulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
```

### 2. Running with Docker Compose
```bash
docker compose up -d
```
Starts PostgreSQL, Redis, and the compiled production Node backend.

### 3. Running Locally for Development
```bash
# Install dependencies
npm install

# Start backend in development mode with live watch
npm run dev

# Start frontend in development mode
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Testing

The test suite runs against an isolated test database (`finpulse_test`) to ensure zero mutation or corruption of development data.

Run the test suite:
```bash
npm test
```

### Test Coverage Summary:
- **`tests/auth.test.ts`**: Registration validation, duplicate checks, login, JWT token issuance, and protected routes.
- **`tests/orders.test.ts`**: Input validation, portfolio ownership checks, BUY order holding creation, SELL order deductions, and pagination.
- **`tests/holdings_and_pnl.test.ts`**: Mathematical verification of weighted average cost basis, valuation, and unrealized P&L calculations.
- **`tests/concurrency_and_rollback.test.ts`**: Transaction rollbacks and concurrent SELL race conditions with row-level locking.
- **`tests/redis_cache.test.ts`**: Redis cache miss, hit, TTL validation, and tick invalidation.
- **`tests/realtime_pipeline.test.ts`**: End-to-end WebSocket subscriptions, SSE streaming, and reconnection missed-event recovery.

---

## 📋 API Contract Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check |
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login and receive JWT |
| `GET` | `/auth/me` | Bearer | Get current authenticated user |
| `GET` | `/assets` | No | List all assets (cached in Redis) |
| `GET` | `/assets/:symbol` | No | Get single asset details (cached in Redis) |
| `POST` | `/assets/:symbol/simulate`| No | Simulate market price tick |
| `GET` | `/portfolios` | Bearer | List user portfolios |
| `POST` | `/portfolios` | Bearer | Create new portfolio |
| `GET` | `/portfolios/:id` | Bearer | Get portfolio by ID |
| `GET` | `/portfolios/:id/holdings`| Bearer | Get portfolio holdings with current market prices |
| `POST` | `/portfolios/:id/orders` | Bearer | Execute BUY or SELL order |
| `GET` | `/portfolios/:id/orders` | Bearer | Get paginated order history (`?page=1&limit=20`) |
| `GET` | `/portfolios/:id/events` | Bearer | SSE stream for real-time market updates |
