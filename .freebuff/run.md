# TradeNest — Preview Run Doc

Two processes are needed: a FastAPI backend on port **8000** and a Vite dev server on port **3000** (the Preview tab watches the frontend).

## How to reproduce the artifacts

1. **Frontend dependencies** — from `frontend/`, run `npm install` (uses the committed `package-lock.json`).
2. **Backend virtualenv** — from `backend/`, run `python -m venv .venv`, then `.venv\Scripts\pip install -r requirements.txt` (Windows; use `.venv/bin/` on POSIX).
3. **Database** — `backend/tradenest.db` is committed. Running `cd backend && .venv/Scripts/python.exe seed_demo.py` applies idempotent `ALTER TABLE` migrations (backend/app/migrations.py) and seeds demo suppliers/products/orders (also idempotent). Safe to run on every checkout.
4. **Env files** — none required. The frontend calls `http://localhost:8000` directly (see `frontend/src/api/axios.js`, overridable via `VITE_API_URL`); the backend uses the local SQLite file by default.

## How to run the server

Start both detached (stdout and stderr must go to **different** files):

- **Backend** (from `backend/`):
  `Start-Process -FilePath '<repo>\backend\.venv\Scripts\python.exe' -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory '<repo>\backend' -RedirectStandardOutput <log> -RedirectStandardError <log>.err -WindowStyle Hidden`
- **Frontend** (from `frontend/`, uses `npm.cmd` exactly — Start-Process does not resolve shell shims):
  `Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory '<repo>\frontend' -RedirectStandardOutput <log> -RedirectStandardError <log>.err -WindowStyle Hidden`

Vite serves on `http://localhost:3000` (resolves to IPv6 `[::1]`; curl `localhost`, not `127.0.0.1`). Grab the listener pid with `netstat -ano | grep ":3000" | grep LISTENING` for preview registration.

**Demo accounts:** `admin@tradenest.com` / `adminpass` (Admin Console), `supplier@tradenest.com` / `supplierpass` (Supplier Hub), `buyer@tradenest.com` / `buyerpass` (storefront).
