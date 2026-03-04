import { Settings, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/types/dashboard";
import { useClock } from "@/hooks/use-clock";
import { getLocalToday, STATUS_LABELS, APP_VERSION } from "@/config/constants";

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

function formatSelectedDate(dateStr: string): string {
  if (!dateStr) return "Today";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "Today";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} (${days[d.getDay()]})`;
}

interface StatusBarProps {
  stats: DashboardStats;
  selectedDate: string;
  lastUpdated: Date;
  refreshInterval: number;
  isTV?: boolean;
  onOpenSettings: () => void;
}

export function StatusBar({
  stats,
  selectedDate,
  lastUpdated,
  refreshInterval,
  isTV = false,
  onOpenSettings,
}: StatusBarProps) {

  const isToday = selectedDate === getLocalToday();

  const badges = [
    { label: STATUS_LABELS.green,  count: stats.onTrack, color: "#10B981" },
    { label: STATUS_LABELS.yellow, count: stats.warning,  color: "#EAB308" },
    { label: STATUS_LABELS.orange, count: stats.caution,  color: "#F97316" },
    { label: STATUS_LABELS.red,    count: stats.behind,   color: "#EF4444" },
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
        {/* Left: title + date badge */}
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
              <span style={{ fontSize: "11px", color: "#475569", fontWeight: 500, marginLeft: "6px" }}>
                {APP_VERSION}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ marginTop: "2px" }}
            >
              <CalendarDays size={isTV ? 14 : 12} style={{ color: isToday ? "#64748B" : "#F59E0B" }} />
              <span
                className="font-mono font-semibold"
                style={{
                  fontSize: isTV ? "13px" : "11px",
                  color: isToday ? "#94A3B8" : "#FDE68A",
                }}
              >
                {formatSelectedDate(selectedDate)}
              </span>
              {!isToday && (
                <span
                  className="font-semibold"
                  style={{
                    fontSize: "9px",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    background: "rgba(245,158,11,0.2)",
                    color: "#F59E0B",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  HISTORY
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: status badges + total gap + efficiency */}
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
          {/* Production Efficiency */}
          {stats.total > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-[8px]"
              style={{
                padding: isTV ? "6px 14px" : "4px 10px",
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.33)",
              }}
            >
              <span
                className="font-mono font-extrabold"
                style={{
                  fontSize: isTV ? "22px" : "16px",
                  color: "#818CF8",
                }}
              >
                {stats.efficiency}%
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                Efficiency
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
