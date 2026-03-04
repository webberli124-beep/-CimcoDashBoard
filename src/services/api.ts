import type { MachineData } from "@/types/dashboard";

const API_BASE = "/api";

/** Shift schedule entry from server config */
export interface ShiftSchedule {
  name: string;
  start: string;
  end: string;
}

/** App config returned by /api/config */
export interface AppConfig {
  shifts: ShiftSchedule[];
  lanIp: string;
  port: number;
}

/** Fetch app config (shifts, network info) from server */
export async function fetchConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (res.ok) return await res.json();
  } catch {
    // fall through to defaults
  }
  return { shifts: [], lanIp: "", port: 3002 };
}

/**
 * Structured error detail from the server.
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  suggestion: string;
}

/**
 * Custom error class that carries structured API error info.
 */
export class ApiError extends Error {
  detail: ApiErrorDetail;

  constructor(detail: ApiErrorDetail) {
    super(detail.message);
    this.name = "ApiError";
    this.detail = detail;
  }
}

/** Parameters needed for fetching dashboard data */
interface FetchParams {
  shiftStart: string;
  shiftEnd: string;
  greenThreshold: number;
  yellowThreshold: number;
  date?: string;
  signal?: AbortSignal;
}

/**
 * Fetch dashboard data from backend Express server.
 * The server performs READ-ONLY SELECT queries against the existing
 * CIMCO MDC MariaDB table (mdc.valtb_hourly_dashboard) and transforms
 * raw rows into MachineData format.
 *
 * Throws ApiError with structured detail on failure.
 */
export async function fetchDashboardData(
  params: FetchParams
): Promise<MachineData[]> {
  const query = new URLSearchParams({
    shiftStart: params.shiftStart,
    shiftEnd: params.shiftEnd,
    greenThreshold: String(params.greenThreshold),
    yellowThreshold: String(params.yellowThreshold),
  });
  if (params.date) {
    query.set("date", params.date);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/dashboard?${query}`, params.signal ? { signal: params.signal } : undefined);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "Cannot reach the dashboard server",
      suggestion: "Check that the backend server is running and the network is reachable.",
    });
  }

  if (!res.ok) {
    // Try to parse structured error from server
    try {
      const body = await res.json();
      if (body?.error?.code && body.error.message && body.error.suggestion) {
        throw new ApiError(body.error as ApiErrorDetail);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // Fall through to generic error
    }
    throw new ApiError({
      code: "HTTP_ERROR",
      message: `Server returned ${res.status}`,
      suggestion: "Check server logs for details.",
    });
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new ApiError({
      code: "INVALID_RESPONSE",
      message: "Server returned unexpected data format",
      suggestion: "Check server logs. Expected an array of machine data.",
    });
  }
  return data as MachineData[];
}
