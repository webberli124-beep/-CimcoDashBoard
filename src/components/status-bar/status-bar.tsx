import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/types/dashboard";
import { useClock } from "@/hooks/use-clock";

function ClockSection({ lastUpdated, refreshInterval, isTV }: { lastUpdated: Date; refreshInterval: number; isTV: boolean }) {
  const { time } = useClock();
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  return (
    <div className="text-right">
      <div
        className="font-mono font-extrabold"
        style={{ fontSize: isTV ? "24px" : "16px", color: "#E2E8F0" }}
      >
        {time}
      </div>
      <div style={{ fontSize: "10px", color: "#475569" }}>
        Updated {secondsAgo}s ago · {refreshInterval}s
      </div>
    </div>
  );
}

interface StatusBarProps {
  stats: DashboardStats;
  shiftName: string;
  shiftTime: string;
  lastUpdated: Date;
  refreshInterval: number;
  isTV?: boolean;
  onOpenSettings: () => void;
}

export function StatusBar({
  stats,
  shiftName,
  shiftTime,
  lastUpdated,
  refreshInterval,
  isTV = false,
  onOpenSettings,
}: StatusBarProps) {

  const badges = [
    { label: "On Track", count: stats.onTrack, color: "#10B981" },
    { label: "Warning", count: stats.warning, color: "#F59E0B" },
    { label: "Behind", count: stats.behind, color: "#EF4444" },
  ];

  return (
    <div style={{ padding: isTV ? "20px 32px" : "12px 16px" }}>
      <div
        className="flex items-center justify-between flex-wrap gap-2 rounded-[14px]"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid #334155",
          padding: isTV ? "18px 28px" : "10px 16px",
        }}
      >
        {/* Left: title + shift info */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <div
              className="font-extrabold tracking-tight"
              style={{
                fontSize: isTV ? "20px" : "15px",
                color: "#E2E8F0",
              }}
            >
              CIMCO MDC Dashboard
            </div>
            <div
              style={{
                fontSize: isTV ? "13px" : "11px",
                color: "#64748B",
                marginTop: "1px",
              }}
            >
              {shiftName} · {shiftTime}
            </div>
          </div>
        </div>

        {/* Center: status badges + total gap */}
        <div className="flex items-center gap-2 flex-wrap">
          {badges.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 rounded-[8px]"
              style={{
                padding: isTV ? "6px 14px" : "4px 10px",
                background: `${s.color}15`,
                border: `1px solid ${s.color}33`,
              }}
            >
              <div
                className="rounded-full"
                style={{ width: 7, height: 7, background: s.color }}
              />
              <span
                className="font-mono font-extrabold"
                style={{
                  fontSize: isTV ? "22px" : "16px",
                  color: s.color,
                }}
              >
                {s.count}
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                {s.label}
              </span>
            </div>
          ))}
          {/* Total Gap */}
          {stats.totalGap !== 0 && (
            <div
              className="flex items-center gap-1.5 rounded-[8px]"
              style={{
                padding: isTV ? "6px 14px" : "4px 10px",
                background: stats.totalGap < 0 ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                border: `1px solid ${stats.totalGap < 0 ? "rgba(239,68,68,0.33)" : "rgba(16,185,129,0.33)"}`,
              }}
            >
              <span
                className="font-mono font-extrabold"
                style={{
                  fontSize: isTV ? "22px" : "16px",
                  color: stats.totalGap < 0 ? "#EF4444" : "#10B981",
                }}
              >
                {stats.totalGap > 0 ? "+" : ""}{stats.totalGap}
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                Total Gap
              </span>
            </div>
          )}
        </div>

        {/* Right: time + settings */}
        <div className="flex items-center gap-2 shrink-0">
          <ClockSection lastUpdated={lastUpdated} refreshInterval={refreshInterval} isTV={isTV} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 rounded-[8px] border border-slate-700 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
          >
            <Settings size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
