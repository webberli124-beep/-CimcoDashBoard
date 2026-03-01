import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Globe, CalendarDays } from "lucide-react";
import type { DashboardSettings } from "@/types/dashboard";
import {
  REFRESH_OPTIONS,
  GREEN_THRESHOLD_OPTIONS,
  YELLOW_THRESHOLD_OPTIONS,
  getLocalToday,
} from "@/config/constants";
import type { ShiftSchedule } from "@/services/api";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onUpdate: (patch: Partial<DashboardSettings>) => void;
  onReset: () => void;
  onRefresh: () => void;
  shifts: ShiftSchedule[];
  networkUrl: string;
}

function OptionGroup({
  label,
  options,
  value,
  onSelect,
  format,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onSelect: (v: number) => void;
  format?: (v: number) => string;
}) {
  const fmt = format ?? ((v: number) => String(v));
  return (
    <div className="mb-3">
      <div
        className="uppercase tracking-wider mb-1.5"
        style={{
          fontSize: "11px",
          color: "#64748B",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            className="font-mono transition-colors"
            aria-pressed={opt === value}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              background: opt === value ? "#4F46E5" : "rgba(255,255,255,0.05)",
              color: opt === value ? "#fff" : "#94A3B8",
              border: `1px solid ${opt === value ? "#4F46E5" : "#334155"}`,
              cursor: "pointer",
            }}
            onClick={() => onSelect(opt)}
          >
            {fmt(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onUpdate,
  onReset,
  onRefresh,
  shifts,
  networkUrl,
}: SettingsPanelProps) {
  const today = getLocalToday();
  const isToday = settings.selectedDate === today;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-[85vw] sm:w-[340px] max-w-[340px] border-slate-700 flex flex-col"
        style={{ background: "#1E293B" }}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-slate-200 text-base font-bold">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-0">
          {/* Shift config */}
          <div className="mb-3">
            <div
              className="uppercase tracking-wider mb-1.5"
              style={{
                fontSize: "11px",
                color: "#64748B",
                letterSpacing: "0.08em",
              }}
            >
              Shift Schedule
            </div>
            {shifts.map((s) => {
              const isActive = settings.shiftName === s.name;
              return (
                <button
                  key={s.name}
                  aria-pressed={isActive}
                  className="flex justify-between rounded-lg mb-1 w-full text-left transition-colors"
                  style={{
                    padding: "6px 12px",
                    background: isActive ? "rgba(79,70,229,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "#4F46E5" : "#334155"}`,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    onUpdate({
                      shiftName: s.name,
                      shiftStart: s.start,
                      shiftEnd: s.end,
                    })
                  }
                >
                  <span className="text-xs text-slate-200">{s.name}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {s.start} – {s.end}
                  </span>
                </button>
              );
            })}
          </div>

          <Separator className="bg-slate-700 my-3" />

          <OptionGroup
            label="Refresh Interval"
            options={REFRESH_OPTIONS}
            value={settings.refreshInterval}
            onSelect={(v) => onUpdate({ refreshInterval: v })}
            format={(v) => `${v}s`}
          />

          <OptionGroup
            label="Green Threshold ≥"
            options={GREEN_THRESHOLD_OPTIONS}
            value={settings.greenThreshold}
            onSelect={(v) => onUpdate({ greenThreshold: v })}
            format={(v) => `${v}%`}
          />

          <OptionGroup
            label="Yellow Threshold ≥"
            options={YELLOW_THRESHOLD_OPTIONS}
            value={settings.yellowThreshold}
            onSelect={(v) => onUpdate({ yellowThreshold: v })}
            format={(v) => `${v}%`}
          />

          <Separator className="bg-slate-700 my-3" />

          {/* TV Mode */}
          <div
            className="flex justify-between items-center rounded-lg mb-3"
            style={{
              padding: "8px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid #334155",
            }}
          >
            <span className="text-xs text-slate-200">TV Mode</span>
            <Switch
              checked={settings.tvMode}
              onCheckedChange={(v) => onUpdate({ tvMode: v })}
            />
          </div>

          {/* Network Access */}
          {networkUrl && (
            <div className="mb-3">
              <div
                className="uppercase tracking-wider mb-1.5"
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  letterSpacing: "0.08em",
                }}
              >
                Network Access
              </div>
              <div
                className="flex items-center gap-2 rounded-lg"
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #334155",
                }}
              >
                <Globe size={14} style={{ color: "#64748B" }} />
                <span className="text-xs text-slate-400 font-mono">
                  {networkUrl}
                </span>
              </div>
            </div>
          )}

          <Separator className="bg-slate-700 my-3" />

          {/* Query Date */}
          <div className="mb-3">
            <div
              className="uppercase tracking-wider mb-1.5"
              style={{
                fontSize: "11px",
                color: "#64748B",
                letterSpacing: "0.08em",
              }}
            >
              Query Date
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <CalendarDays
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748B",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="date"
                  value={settings.selectedDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) onUpdate({ selectedDate: v });
                  }}
                  className="font-mono w-full"
                  style={{
                    padding: "6px 10px 6px 30px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    background: "rgba(255,255,255,0.05)",
                    color: "#E2E8F0",
                    border: "1px solid #334155",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <button
                className="transition-colors font-semibold shrink-0"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: isToday ? "#334155" : "#4F46E5",
                  color: "#fff",
                  border: "1px solid #334155",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (isToday) {
                    onRefresh();
                  } else {
                    onUpdate({ selectedDate: today });
                  }
                }}
              >
                Today
              </button>
            </div>
          </div>

          <Separator className="bg-slate-700 my-3" />

          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-slate-200"
            onClick={onReset}
          >
            <RotateCcw size={14} className="mr-2" />
            Reset to Defaults
          </Button>

          {/* Bottom spacer for safe scrolling */}
          <div className="h-2 shrink-0" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
