# FinPulse — Obsidian Terminal Frontend

FinPulse is an institutional-grade, low-glare personal investment portfolio and market-surveillance terminal built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+)
- Backend services running (PostgreSQL on port 5433/5432, Redis on port 6379, Express backend on port 4000 via Docker Compose).

### Development Server
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://127.0.0.1:5173/`.

### Production Build
```bash
cd frontend
npm run build
```
Generates a strictly type-checked and minified production bundle in `frontend/dist/`.

---

## 2. Test Account Credentials

The backend database contains a registered test workstation operator:
- **Email:** `investor@finpulse.local`
- **Password:** `Password123!`

You can also register any new operator handle via the `/register` screen (password must be at least 8 characters).

---

## 3. Obsidian Terminal Design System

The visual design is grounded in the restraint of market terminals and editorial financial typography:

| Design Token | Hex Code | Purpose |
|---|---|---|
| **Main Background** | `#101110` | Deep basalt workspace canvas |
| **Sidebar Background** | `#151614` | Low-glare workstation navigation bar |
| **Primary Surface** | `#1B1C19` | Cards, tables, and modal backgrounds |
| **Elevated Surface** | `#22231F` | Inputs, hover states, and active items |
| **Borders** | `#30312B` | Hairline 1px structural grid dividers |
| **Primary Text** | `#F1EFE7` | Warm ivory for high-contrast legible figures |
| **Secondary Text** | `#A5A69C` | Contextual descriptions and column headers |
| **Muted Text** | `#73756D` | Micro timestamps and supplementary metadata |
| **Accent Amber** | `#D6A75D` | Active navigation, primary CTAs, and badges |
| **Muted Sage** | `#789E7E` | Positive P&L and upward price ticks |
| **Muted Coral** | `#C27878` | Negative P&L and downward price ticks |

---

## 4. Architectural Highlights & Backend Integration

### 1. Reverse Proxy & CORS Architecture
The Express backend operates without CORS middleware. The Vite development server provides reverse-proxying for `/auth`, `/portfolios`, `/assets`, and `/ws` to `http://localhost:4000`. This prevents browser cross-origin preflight errors during development while preserving the original Express backend code intact.

### 2. Real-Time WebSocket Telemetry
- Connected to the root WebSocket endpoint (`ws://localhost:4000/` or proxied `/ws`).
- Subscribes to symbols: `{"type": "SUBSCRIBE", "symbol": "AAPL"}`.
- Unsubscribes cleanly on unmount: `{"type": "UNSUBSCRIBE", "symbol": "AAPL"}`.
- Receives live broadcasts: `{"event": "PRICE_UPDATED", "symbol": "AAPL", "price": 98.35, "timestamp": "..."}`.
- Dynamic Flash Highlight: `<PriceChangeIndicator />` animates a subtle sage or coral highlight upon receipt of each new price tick.
- Reconnection Engine: Implements exponential backoff capped at 15s with random jitter. Upon reconnection, it automatically invalidates TanStack Query caches to guarantee no missed ticks.
- Interactive Simulator Trigger: Each asset card and the top header include an instant **"Simulate Tick"** button that invokes `POST /assets/:symbol/simulate` so operators can test real-time server price updates at any moment.

### 3. Server-Sent Events (SSE) Limitation
The backend provides an SSE endpoint at `GET /portfolios/:id/events`, protected by the `authenticate` middleware requiring `Authorization: Bearer <token>`.
- Native browser `EventSource` **does not** support arbitrary custom HTTP headers.
- Per strict security guidelines, token query parameters were not fabricated. The application leverages the official WebSocket streaming pipeline for real-time market data updates, which is fully operational.

### 4. Mathematical Precision (No Fabricated Data)
- **Holding Market Value:** `quantity * current_price`
- **Holding Cost Basis:** `quantity * average_price`
- **Unrealized P&L ($):** `market_value - cost_basis`
- **Unrealized P&L (%):** `((current_price - average_price) / average_price) * 100`
- **Portfolio Allocation:** Calculated dynamically from active holdings and visualized via an authentic Recharts donut chart.

### 5. Security Disclosure
JWT tokens are securely attached as Bearer tokens in HTTP requests and stored in browser memory storage (`localStorage`) for developer convenience. For banking-grade multi-tenant production systems, moving to `HttpOnly` `SameSite=Strict` secure cookies is recommended to eliminate script-based token exposure.
