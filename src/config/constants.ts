import type { MachineStatus, DashboardSettings } from "@/types/dashboard";

export const STATUS_COLORS: Record<
  MachineStatus,
  { bg: string; border: string; text: string; glow: string }
> = {
  green: {
    bg: "#064E3B",
    border: "#10B981",
    text: "#6EE7B7",
    glow: "0 0 12px rgba(16,185,129,0.3)",
  },
  yellow: {
    bg: "#422006",
    border: "#EAB308",
    text: "#FEF08A",
    glow: "0 0 12px rgba(234,179,8,0.3)",
  },
  orange: {
    bg: "#431407",
    border: "#F97316",
    text: "#FDBA74",
    glow: "0 0 12px rgba(249,115,22,0.3)",
  },
  red: {
    bg: "#7F1D1D",
    border: "#EF4444",
    text: "#FCA5A5",
    glow: "0 0 12px rgba(239,68,68,0.3)",
  },
};

export const STATUS_SORT_WEIGHT: Record<MachineStatus, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

/** Return today's date as YYYY-MM-DD in the local timezone. */
export function getLocalToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  refreshInterval: 30,
  greenThreshold: 100,
  yellowThreshold: 80,
  shiftStart: "08:00",
  shiftEnd: "16:00",
  shiftName: "Day Shift",
  tvMode: false,
  selectedDate: getLocalToday(),
};

export const REFRESH_OPTIONS = [15, 30, 60, 120] as const;
export const GREEN_THRESHOLD_OPTIONS = [90, 95, 100] as const;
export const YELLOW_THRESHOLD_OPTIONS = [70, 75, 80, 85] as const;

export function getStatus(
  actual: number,
  target: number,
  greenThreshold = 100,
  yellowThreshold = 80
): MachineStatus {
  if (target <= 0) return "green";
  const pct = (actual / target) * 100;
  if (pct >= greenThreshold) return "green";
  // within 5% below green threshold → yellow (slight deficit)
  if (pct >= greenThreshold - 5) return "yellow";
  // above red boundary → orange (moderate deficit)
  if (pct >= yellowThreshold) return "orange";
  return "red";
}

export function getPct(actual: number, target: number): number {
  return target > 0 ? Math.round((actual / target) * 100) : 0;
}
