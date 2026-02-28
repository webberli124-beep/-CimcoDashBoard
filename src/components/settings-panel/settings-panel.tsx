import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, RefreshCw, Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { DashboardSettings } from "@/types/dashboard";
import {
  REFRESH_OPTIONS,
  GREEN_THRESHOLD_OPTIONS,
  YELLOW_THRESHOLD_OPTIONS,
} from "@/config/constants";
import type { ShiftSchedule } from "@/services/api";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onUpdate: (patch: Partial<DashboardSettings>) => void;
  onReset: () => void;
  onRefresh: () => Promise<void>;
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
    <div className="mb-5">
      <div
        className="uppercase tracking-wider mb-2"
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
            style={{
              padding: "5px 10px",
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<"success" | "error" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);
    try {
      await onRefresh();
      setRefreshResult("success");
    } catch {
      setRefreshResult("error");
    } finally {
      setIsRefreshing(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRefreshResult(null), 3000);
    }
  };

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

        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-0">
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

          <Separator className="bg-slate-700 my-4" />

          {/* Shift config */}
          <div className="mb-5">
            <div
              className="uppercase tracking-wider mb-2"
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
                  className="flex justify-between rounded-lg mb-1.5 w-full text-left transition-colors"
                  style={{
                    padding: "8px 12px",
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

          <Separator className="bg-slate-700 my-4" />

          {/* TV Mode */}
          <div
            className="flex justify-between items-center rounded-lg"
            style={{
              padding: "12px",
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


          <Separator className="bg-slate-700 my-4" />

          {/* Network Access */}
          {networkUrl && (
            <div className="mb-3">
              <div
                className="uppercase tracking-wider mb-2"
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  letterSpacing: "0.08em",
                }}
              >
                Network Access
              </div>
              <div
                className="flex items-center gap-2 rounded-lg mb-2"
                style={{
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #334155",
                }}
              >
                <Globe size={14} style={{ color: "#64748B" }} />
                <span className="text-xs text-slate-400 font-mono">
                  {networkUrl}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", lineHeight: "1.5" }}>
                Other devices (TV, phone) can access via this URL.
              </div>
            </div>
          )}

          <Separator className="bg-slate-700 my-4" />

          {/* Refresh Data */}
          <div className="mb-3">
            <Button
              className="w-full"
              style={{
                background: isRefreshing ? "#334155" : "#4F46E5",
                color: "#fff",
                border: "none",
              }}
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              <RefreshCw
                size={14}
                className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            {refreshResult === "success" && (
              <div
                style={{
                  color: "#4ADE80",
                  fontSize: "11px",
                  marginTop: "6px",
                  textAlign: "center",
                }}
              >
                Data updated successfully
              </div>
            )}
            {refreshResult === "error" && (
              <div
                style={{
                  color: "#FCA5A5",
                  fontSize: "11px",
                  marginTop: "6px",
                  textAlign: "center",
                }}
              >
                Failed to connect to database. Check server and database configuration.
              </div>
            )}
          </div>

          <Separator className="bg-slate-700 my-4" />

          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-slate-200"
            onClick={onReset}
          >
            <RotateCcw size={14} className="mr-2" />
            Reset to Defaults
          </Button>

          {/* Bottom spacer for safe scrolling */}
          <div className="h-4 shrink-0" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
