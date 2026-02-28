# CIMCO MDC Dashboard

Read-only production monitoring dashboard for CIMCO MDC — displays hourly planned vs actual output per machine, highlights deviations. Connects to the existing CIMCO MDC MariaDB database via SELECT queries only.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Configuration](#configuration)
- [Database](#database-read-only)
- [Deployment](#deployment)
- [Browser Compatibility](#browser-compatibility)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Software       | Version   | Notes                                          |
|----------------|-----------|------------------------------------------------|
| Node.js        | >= 18 LTS | Recommended: v22 LTS                          |
| npm            | >= 9      | Bundled with Node.js                           |
| MariaDB        | >= 10.6   | Existing CIMCO MDC database (read-only access) |
| Docker         | >= 24     | Optional, for containerized deployment         |
| Docker Compose | >= 2.20   | Optional, for containerized deployment         |

## Quick Start (Development)

```bash
# 1. Install all dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Edit .env — set DB_HOST, DB_PASSWORD to your CIMCO MDC MariaDB

# 4. Start both frontend + backend in development mode
npm run dev:all
```

- Frontend: http://localhost:5199
- Backend API: http://localhost:3002

Or start them separately:

```bash
# Terminal 1: Backend API server
npm run server

# Terminal 2: Frontend dev server
npm run dev
```

---

## Configuration

All configuration is in the `.env` file. Copy from `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables

| Variable        | Default     | Description                                      |
|-----------------|-------------|--------------------------------------------------|
| `DB_HOST`       | `localhost` | MariaDB server hostname                          |
| `DB_PORT`       | `3306`      | MariaDB server port                              |
| `DB_USER`       | `root`      | Database username                                |
| `DB_PASSWORD`   | *(empty)*   | Database password                                |
| `DB_NAME`       | `MDC`       | Database name                                    |
| `SERVER_PORT`   | `3002`      | Backend API server port                          |
| `DEV_PORT`      | `5199`      | Vite dev server port (development only)          |
| `CORS_ORIGIN`   | *(unset)*   | Allowed CORS origin (defaults to allow all in dev)|
| `MACHINE_NAMES` | *(unset)*   | JSON map of portid to display name (see below)   |

### Machine Name Configuration

Machine display names can be configured via the `MACHINE_NAMES` environment variable in `.env`:

```ini
MACHINE_NAMES={"1":"CNC Lathe #1","2":"CNC Mill #2","3":"Drill Press #3"}
```

If not set, the server uses built-in defaults defined in `server/dashboard.ts`.

### Dashboard Settings (UI)

These settings are configurable via the Settings panel (gear icon) and persisted in browser localStorage:

| Setting          | Default | Description                         |
|------------------|---------|-------------------------------------|
| Refresh Interval | 30s     | Auto-refresh period (15/30/60/120s) |
| Green Threshold  | 100%    | On Track if output >= this %        |
| Yellow Threshold | 80%     | Warning if output >= this %         |
| TV Mode          | Off     | Larger fonts/4-column layout for TV |

---

## Database (READ-ONLY)

> **Important:** This dashboard is **read-only**. It connects to the existing CIMCO MDC production database and only performs `SELECT` queries. It does NOT create tables, insert data, or modify any records.

### Table Schema (Reference)

The dashboard reads from `mdc.valtb_hourly_dashboard` (existing table):

| DB Column    | Type         | Dashboard Field     | Description                            |
|-------------|--------------|--------------------|-----------------------------------------|
| `starttime` | DATETIME     | Timestamp          | Row start time, written by CIMCO        |
| `portid`    | VARCHAR(10)  | Machine ID         | Maps to machine card                    |
| `column1`   | INT          | Cumulative Target  | Shift total target                      |
| `column2`   | INT          | Hourly Target      | Per-hour target                         |
| `column3`   | INT          | Actual Output      | Per-hour actual output                  |

### SQL Query

The backend executes only this read-only query:

```sql
SELECT starttime, portid, column1, column2, column3
FROM valtb_hourly_dashboard
WHERE starttime >= <shift_start>
  AND starttime < <shift_end>
ORDER BY portid, starttime;
```

### Recommended: Create a Read-Only DB User

```sql
CREATE USER 'dashboard'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON MDC.valtb_hourly_dashboard TO 'dashboard'@'%';
FLUSH PRIVILEGES;
```

Then set `DB_USER=dashboard` and `DB_PASSWORD=your_password` in `.env`.

---

## Deployment

### Option 1: Docker Compose (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env: set DB_HOST, DB_PASSWORD

# 2. Start services
docker compose up -d

# 3. Check status / logs
docker compose ps
docker compose logs -f

# 4. Stop
docker compose down
```

| Service  | Port | Description                               |
|----------|------|-------------------------------------------|
| frontend | 80   | Nginx serving static files                |
| backend  | 3002 | Express API server (read-only DB queries) |

> If MariaDB runs on the same host as Docker, use `DB_HOST=host.docker.internal`.

### Option 2: Manual Deployment

#### Build

```bash
# 1. Install dependencies
npm ci

# 2. Build frontend
npm run build

# 3. Compile server TypeScript
npx tsc -p server/tsconfig.json
```

#### Run

```bash
# Start with compiled server
node server/dist/index.js
```

The server serves both the API (`/api/*`) and the frontend static files from `dist/`.

#### Windows Quick Deploy

Use the delivery package (see `pack.bat`):

1. Extract the ZIP to a folder (e.g., `C:\CimcoDashboard\`)
2. Double-click `launch.vbs` — one-click start with dependency checks
3. Or run `install.bat` for first-time setup, then `start.bat` for daily use

#### Running as Windows Service

Using Task Scheduler:

1. Open **Task Scheduler** → "Create Basic Task"
2. Trigger: "When the computer starts"
3. Action: Start a program → `C:\CimcoDashboard\start.bat`
4. Start in: `C:\CimcoDashboard`

---

## Browser Compatibility

| Browser | Version | Status       |
|---------|---------|--------------|
| Chrome  | 80+     | Full support |
| Firefox | 78+     | Full support |
| Edge    | 80+     | Full support |
| Safari  | 14+     | Full support |

Requires ES2020+ support. Internet Explorer is **not supported**.

---

## Project Structure

```
CimcoDashBoard/
├── src/                          # Frontend source (React + TypeScript)
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Tailwind + dark theme
│   ├── types/                    # TypeScript type definitions
│   ├── config/                   # Constants
│   ├── hooks/                    # React hooks (clock, settings, data)
│   ├── services/                 # API client
│   ├── lib/                      # Utility functions
│   ├── pages/                    # Page components
│   └── components/               # UI components
│       ├── ui/                   # Shadcn base components
│       ├── layout/               # Dashboard layout shell
│       ├── status-bar/           # Top status bar
│       ├── machine-card/         # Machine card + sub-components
│       ├── machine-grid/         # Responsive card grid
│       ├── detail-panel/         # Detail dialog + hourly chart
│       ├── summary-table/        # Table view
│       ├── settings-panel/       # Settings sheet
│       └── error-banner/         # Error display
│
├── server/                       # Backend API (Express + TypeScript)
│   ├── index.ts                  # Express server entry
│   ├── db.ts                     # MariaDB connection pool
│   ├── dashboard.ts              # /api/dashboard route
│   ├── logger.ts                 # Logging utility
│   └── tsconfig.json             # Server TypeScript config
│
├── db/
│   └── seed.sql                  # Sample data for development
│
├── dist/                         # Frontend build output
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Full stack deployment
├── nginx.conf                    # Production nginx config
├── .env.example                  # Environment variables template
├── vite.config.ts                # Vite build config
├── pack.bat                      # Build delivery packages
├── install.bat                   # Client one-click installer
├── start.bat                     # Client startup script
├── verify.bat                    # Client verification tool
├── launch.vbs                    # One-click start (hidden window)
├── package.json                  # Dependencies & scripts
├── INSTALL.md                    # Client installation guide
└── README.md                     # This file
```

### npm Scripts

| Script            | Description                                   |
|-------------------|-----------------------------------------------|
| `npm run dev`     | Start Vite dev server (http://localhost:5199)  |
| `npm run build`   | Build production frontend bundle               |
| `npm run preview` | Preview production build locally               |
| `npm run server`  | Start backend API server (tsx, development)    |
| `npm run dev:all` | Start frontend + backend concurrently          |
| `npm run lint`    | Run ESLint                                     |

---

## Troubleshooting

### Frontend shows no data

1. Ensure backend is running (`npm run server` or `node server/dist/index.js`)
2. Check browser console for API errors
3. Verify `.env` database credentials are correct

### Cannot connect to MariaDB

1. Verify MariaDB is running: `mysql -u root -p -h <DB_HOST>`
2. Check `.env` credentials match your CIMCO MDC database
3. Verify the `MDC` database and `valtb_hourly_dashboard` table exist
4. Check firewall allows port 3306
5. For Docker: use `DB_HOST=host.docker.internal`

### Port already in use

```bash
# Find process using the port (Windows)
netstat -ano | findstr :3002

# Change port in .env
SERVER_PORT=3003
```

### Docker build fails

1. Ensure Docker daemon is running
2. Run `docker compose build --no-cache` for a clean build
