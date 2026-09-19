# TradeNest

## Project Overview

TradeNest is a full-stack B2B wholesale marketplace for discovering products, comparing wholesale terms, connecting buyers with suppliers, and monitoring marketplace activity. It is scoped as a university Software Engineering project while presenting a polished, modern SaaS-style purchasing experience.

## Features

### Marketplace

- Public landing page with marketplace messaging, category discovery, featured products, trust metrics, and responsive CTA sections.
- Product browsing with server-backed search, responsive product cards, pricing, MOQ, stock, verified-supplier treatment, loading skeletons, empty states, and retry states.
- Product detail pages with product imagery, description, price, MOQ, stock, quantity controls, request-quote/place-order CTAs, and supplier-trust information.
- Order creation and buyer order listing through the backend API.

### Authentication and access control

- Registration and login using JWT access tokens and refresh tokens.
- Bcrypt password hashing through Passlib.
- Server-side refresh-token JTI persistence, rotation, and revocation.
- Login and registration rate limiting by client IP and route.
- Centralized frontend role mapping for Admin, Supplier / Manufacturer, and Retailer. The existing backend uses `admin`, `supplier`, and `buyer`; `buyer` is presented as Retailer in the UI.
- Protected frontend routes for `/dashboard`, `/supplier`, and `/admin`.
- Frontend loading and unauthorized states, plus role-specific dashboard redirects.
- Backend API authorization remains the authoritative security boundary.

### Role capabilities

- **Admin:** authenticated admin dashboard route; backend user, category, product, order, and dashboard-stat authorization where corresponding API operations exist.
- **Supplier / Manufacturer:** supplier dashboard route; backend product CRUD and supplier-order authorization.
- **Retailer:** retailer dashboard route; public product discovery plus authenticated order placement and buyer order access.

The admin and supplier frontend dashboard pages currently provide presentation shells, while the corresponding backend APIs contain the implemented authorization and CRUD surfaces. No unsupported workflow is represented as complete.

### Analytics and UI

- Dashboard KPI cards for total revenue, total orders, products sold, and average order value.
- Chart.js and `react-chartjs-2` visualizations for sales trends, revenue by period, product performance, and order-status distribution.
- `7D`, `30D`, and `90D` analytics range controls.
- Live API-backed aggregate totals where available; trend, product-performance, and status-distribution series are clearly labeled demo data because matching backend time-series endpoints do not exist yet.
- Responsive premium UI using indigo/violet gradients, cyan and emerald accents, glassmorphism surfaces, and accessible focus styles.
- Framer Motion route transitions, viewport reveals, mobile navigation transitions, product hover effects, animated counters, and reduced-motion support.
- Reusable UI components including `AnimatedSection`, `GradientButton`, `PageTransition`, `ProductCard`, `SkeletonLoader`, `StatCounter`, and `ProtectedRoute`.

### Wholesale Cart, Checkout & Simulated Payment System

> [!IMPORTANT]
> **Academic Demonstration Notice (No Real Payment Gateways)**
> TradeNest is an academic Software Engineering course project. **NO real payment gateway (no Stripe, no PayPal, no real card processing, no actual bank account linking) is integrated.**
> The checkout and payment experience is completely simulated locally to present a realistic, portfolio-grade B2B purchasing flow with zero financial risk.

- **Wholesale Cart System (`/api/cart`):**
  - Persistent cart with client-side `localStorage` caching and automatic server-side synchronization for authenticated buyers.
  - Strict wholesale Minimum Order Quantity (MOQ) and warehouse inventory stock boundary checks.
  - Slide-in `CartDrawer` with animated quantity steppers, item deletion transitions, and subtotal calculations.
  - Physics-inspired `FlyToCartAnimation` with an arcing trajectory from the clicked product button straight into the navbar cart icon.
  - Dynamic navbar cart icon with live count badge pop and bounce animation.
- **Multi-Step Checkout Wizard (`/checkout`):**
  - Step 1: **Order Review** (item breakdown, quantities, MOQ verification, and live pricing).
  - Step 2: **Shipping & Billing Info** (corporate consignee, Tax/VAT ID, address, and freight method selection: Standard Freight, Express Air, Ocean Cargo).
  - Step 3: **Demo Payment Simulation** (3D animated credit card, wire transfer demo, or Letter of Credit).
  - Step 4: **Confirmation & Receipt** (particle celebration, transaction reference ID, and printable commercial invoice).
  - Animated stepper header with progressive connecting bar and completed checkmark draw-ins.
  - Sticky order summary sidebar with dynamic freight cost adjustments and B2B escrow assurance badges.
- **Realistic 3D Credit Card & Simulation Sandbox:**
  - Interactive credit card mockup with EMV metallic chip, live cardholder typing, quad card number formatting, and automatic brand detection (Visa, Mastercard, Amex).
  - Smooth 3D card flip animation when focusing the security code (CVC) input.
  - Quick-fill demo presets: **"Fill Valid Card"** (Visa sandbox) and **"Fill Failing Card"** (tests declination and error handling).
  - Phased simulated authorization latency (`Encrypting credentials...` -> `Connecting to clearinghouse...` -> `Authorizing transaction...`).
  - Particle confetti burst (`ConfettiBurst`) upon order placement.
  - Commercial B2B invoice modal (`ReceiptModal`) with print-to-PDF functionality.

## Tech Stack

### Frontend

- React 18.3 with React Router 6
- Vite 5
- Tailwind CSS 3 with PostCSS and Autoprefixer
- Axios for API requests
- Framer Motion for animation
- Chart.js 4 with `react-chartjs-2`
- `react-icons` for interface icons
- `react-hot-toast` for notifications
- Zustand is installed for lightweight state management, although the current authentication flow uses React Context

### Backend

- Python with FastAPI
- SQLAlchemy 2 ORM
- Pydantic 2 validation
- SQLite by default
- Alembic migration tooling
- `python-jose` for JWT signing and verification
- Passlib with bcrypt for password hashing
- `python-dotenv` for environment configuration
- Uvicorn development server

## Project Structure

```text
TradeNest/
├── backend/
│   ├── app/
│   │   ├── auth.py              # JWT, bcrypt, rate limiting, auth dependencies
│   │   ├── crud.py              # Database operations and dashboard aggregates
│   │   ├── database.py          # SQLAlchemy engine, session, and Base
│   │   ├── deps.py              # Database dependency helper
│   │   ├── main.py              # FastAPI app, CORS, routers, startup seeding
│   │   ├── models.py            # SQLAlchemy models and refresh-token table
│   │   ├── sample_data.py       # Demo users, categories, and products
│   │   ├── schemas.py            # Pydantic request/response models
│   │   └── routers/              # Auth, users, categories, products, orders, dashboard
│   ├── alembic/
│   │   ├── env.py               # Alembic metadata and database configuration
│   │   └── versions/             # Database migration revisions
│   ├── alembic.ini
│   ├── .env.example
│   ├── requirements.txt
│   └── tradenest.db              # Local SQLite database, when created
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client
│   │   ├── auth/                # Centralized role definitions and mapping
│   │   ├── components/          # Shared UI, motion, loading, and guard components
│   │   ├── context/             # Authentication context
│   │   ├── pages/               # Public, dashboard, auth, and product pages
│   │   └── styles/              # Tailwind entry point and design utilities
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.cjs
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## Requirements

- Python 3.10 or newer, with `python` available on PATH
- Node.js and npm, suitable for the installed Vite toolchain
- PowerShell on Windows, or equivalent shell commands on another platform
- A modern browser with JavaScript enabled

## Installation

From the repository root, create and activate a backend virtual environment:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

Create the backend environment file from the template:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` and replace both placeholder secrets before using the application beyond local development. The local frontend is configured in `frontend\vite.config.js` to run on port `3000`, so set `FRONTEND_ORIGIN=http://localhost:3000` for local development. The backend fallback currently uses port `5173`; the explicit `.env` value takes precedence.

Install frontend dependencies:

```powershell
Set-Location frontend
npm install
Set-Location ..
```

## Database Setup and Migrations

The default database is SQLite at `backend/tradenest.db`. The application currently calls SQLAlchemy `create_all` at startup and runs the demo-data loader once when the database is empty.

For an existing database, apply the Alembic revisions from the `backend` directory:

```powershell
Set-Location backend
alembic upgrade head
Set-Location ..
```

To inspect the current migration revision:

```powershell
Set-Location backend
alembic current
Set-Location ..
```

The current migration chain adds failed-login fields and verification state to `users`, creates the `refresh_tokens` table, and aligns legacy marketplace columns with the current models. Do not delete a shared or production database to apply migrations.

To seed or refresh local demo records independently of application startup:

```powershell
Set-Location backend
python seed_demo.py
Set-Location ..
```

The script is idempotent: it creates missing demo users, categories, products, and sample orders without overwriting existing records. Demo credentials are listed below and are for local development only.

## Running the Application

Open two terminals from the repository root.

Backend development server:

```powershell
backend\.venv\Scripts\Activate.ps1
Set-Location backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. FastAPI's interactive documentation is available at `/docs` while the server is running.

Frontend development server:

```powershell
Set-Location frontend
npm run dev
```

The Vite development server is configured for `http://localhost:3000`. The Axios client uses `VITE_API_URL` when provided and otherwise defaults to `http://localhost:8000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. Never commit real secrets, access tokens, or refresh tokens.

| Variable | Purpose | Local example |
| --- | --- | --- |
| `SECRET_KEY` | Signs access JWTs | `replace-with-a-long-random-secret` |
| `REFRESH_TOKEN_SECRET` | Signs refresh JWTs | `replace-with-a-different-long-random-secret` |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///tradenest.db` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access-token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh-token lifetime | `43200` |
| `RATE_LIMIT_WINDOW` | Auth rate-limit window in seconds | `60` |
| `RATE_LIMIT_MAX` | Requests allowed per IP and auth route per window | `6` |

Optional frontend variable:

| Variable | Purpose | Local default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

## Authentication and RBAC

Registration accepts the existing `buyer` and `supplier` roles. Admin accounts are created by controlled data/admin processes rather than exposed as a public registration choice. The UI presents `buyer` as Retailer and `supplier` as Supplier / Manufacturer.

The login flow sends credentials to `POST /api/auth/login`, stores the returned access token for the current frontend session, and requests `GET /api/users/me` to hydrate the centralized `AuthContext`. The backend also issues refresh tokens, stores refresh-token JTIs, rotates them on `POST /api/auth/refresh`, and supports revocation through `POST /api/auth/logout`.

Frontend guards protect:

- `/dashboard` for Retailers
- `/supplier` for Suppliers / Manufacturers
- `/admin` for Admins

Unauthenticated users are redirected to `/login`. Authenticated users with the wrong role receive a 403-style state and a link to their role dashboard. The frontend guard improves navigation and user experience, but it is not a security boundary. Backend dependencies such as `get_current_user` and `require_role` authorize protected API operations and remain authoritative.

## API Surface

The backend exposes these main route groups:

- `/api/auth`: register, login, refresh, logout
- `/api/users`: current-user profile and admin user operations
- `/api/categories`: public listing and admin CRUD
- `/api/products`: public listing/details and supplier/admin CRUD authorization
- `/api/orders`: create, buyer listing, supplier listing, status updates, and admin recent orders
- `/api/dashboard/stats`: authenticated role-specific aggregate statistics

## Analytics

The authenticated `/dashboard` page combines live aggregate values from `/api/dashboard/stats` with Chart.js visualizations. Revenue and order totals use available API fields; average order value is calculated from those live totals when possible.

The backend does not currently expose historical time-series, product-performance, or order-status-distribution endpoints. Accordingly, the sales trend, period revenue, top-product, and status-mix chart series are explicitly labeled demo data in the UI. They are suitable for demonstrating the analytics experience but must be replaced with server-backed values before production reporting.

## Production Build and Deployment Notes

Build the frontend from `frontend`:

```powershell
Set-Location frontend
npm run build
```

The generated static files are written to `frontend/dist`. They can be served by a static hosting provider or web server. No frontend deployment has been performed for this project.

For the backend, install dependencies in a production environment and run Uvicorn behind a process manager and reverse proxy appropriate for the hosting platform. Configure a persistent database, run `alembic upgrade head`, set strong environment-specific secrets, and disable development reload mode. SQLite is suitable for the course/demo deployment; a managed relational database is preferable for concurrent production workloads.

Before exposing the API:

- Set `FRONTEND_ORIGIN` to the exact deployed frontend origin; do not use a wildcard CORS policy with credentials.
- Use long, random, separate `SECRET_KEY` and `REFRESH_TOKEN_SECRET` values.
- Review access-token and refresh-token lifetimes for the threat model.
- Serve the frontend and API over HTTPS.
- Keep `.env` files, database files, credentials, and token values out of source control.
- Back up the database and run migrations as part of the release process.
- Place rate limiting and suitable logging/monitoring at the API edge as the project grows.

The current frontend stores the access token in local storage through the existing Axios/auth flow. A production deployment should consider an HTTP-only, Secure refresh-token cookie and a coordinated frontend refresh interceptor; that is not enabled in the current implementation.

## Validation Status

The project has been validated during implementation with:

- Successful frontend production builds using `npm run build`.
- Backend Python syntax compilation using `python -m compileall -q backend/app`.
- Implemented frontend RBAC and protected route behavior.
- Integrated Chart.js and `react-chartjs-2` analytics.
- Implemented Framer Motion animations and reusable UI components.

The frontend build currently emits a non-blocking Vite warning that the main JavaScript chunk is larger than 500 kB after minification. Code splitting or manual Rollup chunks can address this later.

## Known Limitations

- Admin and supplier dashboard pages are currently presentation shells; their backend authorization and several API CRUD surfaces exist, but complete frontend management workflows are not implemented.
- Historical analytics and detailed product/order analytics are demo data until backend analytics endpoints are added.
- The frontend does not currently run automatic access-token refresh through an Axios interceptor, although backend refresh-token rotation and revocation are implemented.
- Refresh tokens are returned in the API response and are not yet moved to an HTTP-only cookie.
- SQLite and the in-memory auth rate-limit state are appropriate for a university/demo deployment but need infrastructure changes for multi-process production scaling.
- No frontend or backend automated test suite is currently included; validation has been build, syntax, and focused diagnostics based.
- The sample-data loader creates predictable demo credentials for local development only. Change secrets and remove/demo-disable these accounts before any public deployment.
