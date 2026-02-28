import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import pool, { classifyDbError } from "./db.js";
import { log } from "./logger.js";

/**
 * CIMCO MDC Dashboard — READ-ONLY API
 *
 * This module ONLY performs SELECT queries against the existing
 * CIMCO MDC production database (schema: MDC, table: valtb_hourly_dashboard).
 * It does NOT create, insert, update, or delete any data.
 * The table is maintained by the CIMCO MDC system.
 */

const router = Router();

/**
 * Machine name mapping — loaded from MACHINE_NAMES env var (JSON) or uses defaults.
 * Format: '{"1":"CNC Lathe #1","2":"CNC Mill #2"}'
 */
function loadMachineNames(): Record<string, string> {
  const envNames = process.env.MACHINE_NAMES;
  if (envNames) {
    try {
      return JSON.parse(envNames);
    } catch {
      log.warn("MACHINE_NAMES env var is not valid JSON, using defaults");
    }
  }
  return {
    "1": "CNC Lathe #1",
    "2": "CNC Mill #2",
    "3": "Drill Press #3",
    "4": "Grinder #4",
    "5": "CNC Router #5",
    "6": "Plasma Cut #6",
    "7": "Press Brake #7",
    "8": "EDM Wire #8",
  };
}

const MACHINE_NAMES = loadMachineNames();

function getMachineName(portid: string): string {
  return MACHINE_NAMES[portid] || `Machine #${portid}`;
}

function getMachineId(portid: string): string {
  return `M-${portid.padStart(3, "0")}`;
}

type MachineStatus = "green" | "yellow" | "red";

// Mirrors frontend getStatus() — kept in sync manually since
// server (Node/Express) and client (Vite/React) use separate module systems.
function getStatus(actual: number, target: number, greenThreshold = 100, yellowThreshold = 80): MachineStatus {
  if (target <= 0) return "green";
  const pct = (actual / target) * 100;
  if (pct >= greenThreshold) return "green";
  if (pct >= yellowThreshold) return "yellow";
  return "red";
}

const STATUS_SORT_WEIGHT: Record<MachineStatus, number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

interface HourlyRow extends RowDataPacket {
  starttime: string;
  portid: string;
  column1: number;
  column2: number;
  column3: number;
}

/**
 * GET /api/dashboard  (READ-ONLY)
 *
 * Reads from existing CIMCO MDC table: mdc.valtb_hourly_dashboard
 * Only performs SELECT — no writes to the production database.
 *
 * Query params:
 *   - shiftStart: shift start time HH:MM (default "08:00")
 *   - shiftEnd: shift end time HH:MM (default "16:00")
 *   - greenThreshold: percentage (default 100)
 *   - yellowThreshold: percentage (default 80)
 *
 * Returns: MachineData[]
 */
router.get("/dashboard", async (req, res) => {
  try {
    const shiftStart = (req.query.shiftStart as string) || "08:00";
    const shiftEnd = (req.query.shiftEnd as string) || "16:00";

    // Validate HH:MM format
    const timeRe = /^\d{1,2}:\d{2}$/;
    if (!timeRe.test(shiftStart) || !timeRe.test(shiftEnd)) {
      res.status(400).json({
        error: {
          code: "INVALID_PARAMS",
          message: "shiftStart and shiftEnd must be in HH:MM format",
          suggestion: 'Use format like "08:00" or "16:00".',
        },
      });
      return;
    }

    const greenRaw = Number(req.query.greenThreshold);
    const yellowRaw = Number(req.query.yellowThreshold);
    const greenThreshold = Number.isFinite(greenRaw) ? greenRaw : 100;
    const yellowThreshold = Number.isFinite(yellowRaw) ? yellowRaw : 80;

    // Calculate today's shift boundaries as unix timestamps
    const today = new Date();
    const [startH, startM] = shiftStart.split(":").map(Number);
    const [endH, endM] = shiftEnd.split(":").map(Number);

    const shiftStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startH, startM, 0);
    let shiftEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endH, endM, 0);

    // Handle cross-midnight shifts (e.g. 22:00 – 06:00): push end to next day
    if (shiftEndDate <= shiftStartDate) {
      shiftEndDate = new Date(shiftEndDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const startUnix = Math.floor(shiftStartDate.getTime() / 1000);
    const endUnix = Math.floor(shiftEndDate.getTime() / 1000);

    // Query all records for today's shift
    // starttime is stored as a numeric string (unix timestamp).
    // Direct string comparison works for unix timestamps of the same digit length.
    // For optimal performance, consider adding a numeric index column.
    const [rows] = await pool.query<HourlyRow[]>(
      `SELECT starttime, portid, column1, column2, column3
       FROM valtb_hourly_dashboard
       WHERE starttime >= ?
         AND starttime < ?
       ORDER BY portid, starttime`,
      [String(startUnix), String(endUnix)]
    );

    // Group rows by portid
    const machineMap = new Map<string, HourlyRow[]>();
    for (const row of rows) {
      const pid = String(row.portid);
      if (!machineMap.has(pid)) machineMap.set(pid, []);
      machineMap.get(pid)!.push(row);
    }

    // Transform into MachineData format
    const machines = Array.from(machineMap.entries()).map(([portid, records]) => {
      const hourlySlots = records.map((r) => {
        const ts = new Date(Number(r.starttime) * 1000);
        const hour = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
        const target = Number(r.column2);
        const actual = Number(r.column3);
        return {
          hour,
          target,
          actual,
          difference: actual - target,
          percentage: target > 0 ? Math.round((actual / target) * 100) : 0,
        };
      });

      const lastSlot = hourlySlots[hourlySlots.length - 1] || {
        hour: "00:00", target: 0, actual: 0, difference: 0, percentage: 0,
      };

      // Cumulative from the latest record's column1 field
      const latestRecord = records[records.length - 1];
      const cumTarget = Number(latestRecord?.column1 ?? 0);
      const cumActual = hourlySlots.reduce((sum, s) => sum + s.actual, 0);

      const trend = hourlySlots.map((s) => s.actual);

      return {
        id: getMachineId(portid),
        name: getMachineName(portid),
        currentHour: lastSlot,
        hourlySlots,
        cumulative: {
          target: cumTarget,
          actual: cumActual,
          difference: cumActual - cumTarget,
          percentage: cumTarget > 0 ? Math.round((cumActual / cumTarget) * 100) : 0,
        },
        status: getStatus(lastSlot.actual, lastSlot.target, greenThreshold, yellowThreshold),
        trend,
      };
    });

    // Sort: red → yellow → green
    machines.sort((a, b) => STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status]);

    res.json(machines);
  } catch (err) {
    const detail = classifyDbError(err);
    log.error("Dashboard API error", { code: detail.code, message: detail.message, raw: (err as Error).message });
    res.status(detail.httpStatus).json({
      error: {
        code: detail.code,
        message: detail.message,
        suggestion: detail.suggestion,
      },
    });
  }
});

export default router;
