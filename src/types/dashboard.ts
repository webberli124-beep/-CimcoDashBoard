// Raw database row from mdc.valtb_hourly_dashboard
export interface HourlyRecord {
  starttime: string;
  portid: string;
  column1: number; // cumulative target
  column2: number; // hourly target
  column3: number; // actual output
}

// Parsed hourly slot
export interface HourlySlot {
  hour: string;       // e.g. "08:00"
  target: number;
  actual: number;
  difference: number; // actual - target
  percentage: number; // (actual / target) * 100
}

export type MachineStatus = "green" | "yellow" | "red";

export interface MachineData {
  id: string;
  name: string;
  currentHour: HourlySlot;
  hourlySlots: HourlySlot[];
  cumulative: {
    target: number;
    actual: number;
    difference: number;
    percentage: number;
  };
  status: MachineStatus;
  trend: number[];
}

export interface DashboardSettings {
  refreshInterval: number; // seconds
  greenThreshold: number;  // percentage, default 100
  yellowThreshold: number; // percentage, default 80
  shiftStart: string;      // "08:00"
  shiftEnd: string;        // "16:00"
  shiftName: string;       // "Day Shift"
  tvMode: boolean;
}

export interface DashboardStats {
  total: number;
  onTrack: number;
  warning: number;
  behind: number;
  totalGap: number;
}
