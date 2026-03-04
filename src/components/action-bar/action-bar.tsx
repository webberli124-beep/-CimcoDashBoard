import type { MachineData } from "@/types/dashboard";
import { getLocalToday } from "@/config/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, RefreshCw } from "lucide-react";

export type ViewMode = "hourly" | "cards" | "table";

interface ActionBarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  machines: MachineData[];
  selectedMachineId: string | null;
  onMachineChange: (id: string | null) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  isTV: boolean;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
}

const ALL_MACHINES = "__all__";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "hourly", label: "Hourly Table" },
  { key: "cards", label: "Grid Cards" },
  { key: "table", label: "Summary" },
];

export function ActionBar({
  view,
  onViewChange,
  machines,
  selectedMachineId,
  onMachineChange,
  selectedDate,
  onDateChange,
  onRefresh,
  isTV,
  shiftName,
  shiftStart,
  shiftEnd,
}: ActionBarProps) {
  const today = getLocalToday();
  const isToday = selectedDate === today;

  function handleTodayClick() {
    if (isToday) {
      onRefresh();
    } else {
      onDateChange(today);
    }
  }

  return (
    <div
      style={{ padding: isTV ? "0 32px 8px" : "0 16px 6px" }}
      className="flex items-center justify-between gap-3 flex-wrap"
    >
      {/* Left side: Machine selector + Date picker */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Machine selector */}
        <Select
          value={selectedMachineId ?? ALL_MACHINES}
          onValueChange={(v) => onMachineChange(v === ALL_MACHINES ? null : v)}
        >
          <SelectTrigger
            size="sm"
            className="bg-slate-800/60 border-slate-700 text-slate-200 text-xs min-w-[160px]"
          >
            <SelectValue placeholder="All Machines" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value={ALL_MACHINES} className="text-slate-200 text-xs">
              All Machines
            </SelectItem>
            <SelectSeparator className="bg-slate-700" />
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-slate-200 text-xs">
                [{m.id}] {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date picker */}
        <div className="relative flex items-center">
          <CalendarDays
            size={14}
            className="absolute left-2.5 text-slate-500 pointer-events-none"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            max={today}
            aria-label="Select query date"
            className="h-8 rounded-md border border-slate-700 bg-slate-800/60 text-slate-200 text-xs pl-8 pr-2 outline-none focus:border-slate-500 transition-colors"
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Today / Refresh button */}
        <button
          onClick={handleTodayClick}
          className="h-8 px-3 rounded-md border border-slate-700 bg-slate-800/60 text-xs font-medium text-slate-300 hover:bg-slate-700/60 transition-colors flex items-center gap-1.5"
        >
          {isToday ? <RefreshCw size={12} /> : null}
          {isToday ? "Refresh" : "Today"}
        </button>
      </div>

      {/* Right side: View toggle + Shift badge */}
      <div className="flex items-center gap-2">
        {/* 3-way view toggle */}
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: "#1E293B" }}>
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className="transition-colors font-semibold"
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                background: view === key ? "#334155" : "transparent",
                color: view === key ? "#E2E8F0" : "#64748B",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Shift badge */}
        <span
          className="font-semibold"
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            background: "rgba(79,70,229,0.15)",
            color: "#A5B4FC",
            border: "1px solid rgba(79,70,229,0.3)",
          }}
        >
          {shiftName}
          <span className="font-mono ml-1.5" style={{ color: "#818CF8", fontSize: "11px" }}>
            {shiftStart} – {shiftEnd}
          </span>
        </span>
      </div>
    </div>
  );
}
