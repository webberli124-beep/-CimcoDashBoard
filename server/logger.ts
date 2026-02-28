import fs from "node:fs";
import path from "node:path";

const LOGS_DIR = path.resolve(process.cwd(), "logs");

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogFile(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `dashboard-${date}.log`);
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatExtra(extra?: unknown): string {
  if (extra === undefined || extra === null) return "";
  if (extra instanceof Error) {
    return ` | ${JSON.stringify({ message: extra.message, code: (extra as NodeJS.ErrnoException).code, stack: extra.stack?.split("\n")[1]?.trim() })}`;
  }
  if (typeof extra === "object") {
    try {
      return ` | ${JSON.stringify(extra)}`;
    } catch {
      return ` | [unserializable]`;
    }
  }
  return ` | ${String(extra)}`;
}

function write(level: "INFO" | "WARN" | "ERROR", message: string, extra?: unknown): void {
  const line = `[${timestamp()}] [${level}] ${message}${formatExtra(extra)}\n`;

  // Console output
  if (level === "ERROR") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }

  // File output
  try {
    ensureLogsDir();
    fs.appendFileSync(getLogFile(), line, "utf-8");
  } catch {
    // If file logging fails, we already wrote to console — don't crash
  }
}

export const log = {
  info: (message: string, extra?: unknown) => write("INFO", message, extra),
  warn: (message: string, extra?: unknown) => write("WARN", message, extra),
  error: (message: string, extra?: unknown) => write("ERROR", message, extra),
};
