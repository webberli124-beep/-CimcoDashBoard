import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import { log } from "./logger.js";
import { testConnection, classifyDbError, closePool } from "./db.js";
import dashboardRouter from "./dashboard.js";

dotenv.config();

// ── .env validation ──
const REQUIRED_ENV = ["DB_HOST", "DB_USER", "DB_NAME", "DB_PASSWORD"] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    log.error(`Missing required .env variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

// ── App setup ──
const app = express();
const PORT = Number(process.env.SERVER_PORT) || 3002;
if (PORT < 1 || PORT > 65535) {
  log.error(`Invalid SERVER_PORT: ${PORT}`);
  process.exit(1);
}

// CORS: restrict to specific origin or same-origin in production
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(",").map((s) => s.trim()) : false,
}));
app.use(express.json({ limit: "10kb" }));

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Request logging middleware ──
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── API routes ──
// Health check with DB connectivity test
app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    const detail = classifyDbError(err);
    res.status(503).json({
      status: "error",
      db: "disconnected",
      error: { code: detail.code, message: detail.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// App config (shifts, network info)
app.get("/api/config", (_req, res) => {
  res.json({
    shifts: loadShiftSchedules(),
    lanIp: getLanIp(),
    port: PORT,
  });
});

// Dashboard data (read-only)
app.use("/api", dashboardRouter);

// ── Frontend: serve static files from dist/ ──
const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath, { index: "index.html" }));

// SPA fallback for client-side routes (skip /api paths)
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Global error handler ──
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log.error("Unhandled Express error", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      suggestion: "Check server logs for details.",
    },
  });
});

// ── Graceful shutdown ──
async function shutdown(signal: string): Promise<void> {
  log.info(`Received ${signal}, shutting down gracefully...`);
  try {
    await closePool();
    log.info("Database pool closed");
  } catch (err) {
    log.error("Error closing database pool", err);
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Process-level error handlers ──
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection", reason);
});

// ── Helper: detect LAN IPv4 address ──
function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "";
}

// ── Helper: load shift schedules from env ──
function loadShiftSchedules(): Array<{ name: string; start: string; end: string }> {
  const raw = process.env.SHIFT_SCHEDULES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      log.warn("SHIFT_SCHEDULES env var is not valid JSON, using defaults");
    }
  }
  return [
    { name: "Day Shift", start: "08:00", end: "16:00" },
    { name: "Night Shift", start: "16:00", end: "00:00" },
  ];
}

// ── Async startup ──
async function start(): Promise<void> {
  // 1. Validate .env
  validateEnv();
  log.info("Environment validated");

  // 2. Test DB connection (non-fatal: server starts anyway, API returns errors)
  try {
    await testConnection();
    log.info("Database connection OK");
  } catch (err) {
    const detail = classifyDbError(err);
    log.warn(`Startup DB check failed: ${detail.message} — server will start but API calls may fail`, { suggestion: detail.suggestion });
  }

  // 3. Start listening
  app.listen(PORT, () => {
    log.info(`Dashboard running on http://localhost:${PORT}`);
    log.info(`  Frontend: http://localhost:${PORT}`);
    log.info(`  API:      http://localhost:${PORT}/api/dashboard`);
  });
}

start();
