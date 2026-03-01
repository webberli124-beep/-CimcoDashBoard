import mysql from "mysql2/promise";
import { log } from "./logger.js";

/**
 * READ-ONLY connection pool to the existing CIMCO MDC MariaDB database.
 * This dashboard only performs SELECT queries — no data is written.
 *
 * Pool is lazily initialized after dotenv.config() has loaded env vars.
 *
 * For extra safety, consider creating a read-only DB user:
 *   CREATE USER 'dashboard'@'%' IDENTIFIED BY 'xxx';
 *   GRANT SELECT ON MDC.valtb_hourly_dashboard TO 'dashboard'@'%';
 *   FLUSH PRIVILEGES;
 */
let _pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "MDC",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 50,
    });
  }
  return _pool;
}

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Test database connectivity by running `SELECT 1`.
 * Throws on failure so the caller can decide whether to exit.
 */
export async function testConnection(): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    await conn.query("SELECT 1");
    log.info("Database connected", {
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "MDC",
    });
  } finally {
    conn.release();
  }
}

/**
 * Structured error detail returned to the frontend.
 */
export interface DbErrorDetail {
  code: string;
  message: string;
  suggestion: string;
  httpStatus: number;
}

/**
 * Classify a database error into a user-friendly message with a suggestion.
 */
export function classifyDbError(err: unknown): DbErrorDetail {
  const code = (err as { code?: string }).code ?? "UNKNOWN";
  const errno = (err as { errno?: number }).errno;

  switch (code) {
    case "ECONNREFUSED":
      return {
        code: "DB_CONNECTION_REFUSED",
        message: "Database server not reachable",
        suggestion: "Check that MariaDB/MySQL is running and accepting connections on the configured host and port.",
        httpStatus: 503,
      };
    case "ETIMEDOUT":
    case "ENOTFOUND":
      return {
        code: "DB_TIMEOUT",
        message: "Connection to database timed out",
        suggestion: "Check DB_HOST is correct and the database server is reachable from this machine.",
        httpStatus: 503,
      };
    case "ER_ACCESS_DENIED_ERROR":
      return {
        code: "DB_ACCESS_DENIED",
        message: "Wrong database credentials",
        suggestion: "Check DB_USER and DB_PASSWORD in your .env file.",
        httpStatus: 403,
      };
    case "ER_BAD_DB_ERROR":
      return {
        code: "DB_NOT_FOUND",
        message: `Database '${(err as { sqlMessage?: string }).sqlMessage?.match(/'([^']+)'/)?.[1] ?? "unknown"}' not found`,
        suggestion: "Check DB_NAME in your .env file matches an existing database.",
        httpStatus: 404,
      };
    case "ER_NO_SUCH_TABLE":
      return {
        code: "DB_TABLE_NOT_FOUND",
        message: "Required table not found",
        suggestion: "Verify the CIMCO MDC database contains the table 'valtb_hourly_dashboard'.",
        httpStatus: 404,
      };
    default:
      // errno 1045 is also access denied in some drivers
      if (errno === 1045) {
        return {
          code: "DB_ACCESS_DENIED",
          message: "Wrong database credentials",
          suggestion: "Check DB_USER and DB_PASSWORD in your .env file.",
          httpStatus: 403,
        };
      }
      return {
        code: "DB_ERROR",
        message: "An unexpected database error occurred",
        suggestion: "Check server logs for details.",
        httpStatus: 500,
      };
  }
}
