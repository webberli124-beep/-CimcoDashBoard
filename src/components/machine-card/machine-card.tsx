import { memo } from "react";
import type { MachineData } from "@/types/dashboard";
import { STATUS_COLORS, getPct, getStatus } from "@/config/constants";
import { ProgressRing } from "./progress-ring";
import { DeviationBadge } from "./deviation-badge";
import { SparklineChart } from "./sparkline-chart";

interface MachineCardProps {
  machine: MachineData;
  isTV?: boolean;
  greenThreshold?: number;
  yellowThreshold?: number;
  onClick?: () => void;
}

export const MachineCard = memo(function MachineCard({
  machine,
  isTV = false,
  greenThreshold = 100,
  yellowThreshold = 80,
  onClick,
}: MachineCardProps) {
  const sc = STATUS_COLORS[machine.status];
  const hourlyPct = getPct(machine.currentHour.actual, machine.currentHour.target);
  const cumPct = machine.cumulative.percentage;
  const cumStatusKey = getStatus(
    machine.cumulative.actual,
    machine.cumulative.target,
    greenThreshold,
    yellowThreshold
  );
  const cumStatus = STATUS_COLORS[cumStatusKey];

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      role="button"
      tabIndex={0}
      className="relative flex flex-col rounded-[14px] cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #1E293B 0%, ${sc.bg}22 100%)`,
        border: `1.5px solid ${sc.border}44`,
        padding: isTV ? "20px" : "14px",
        gap: isTV ? "14px" : "8px",
        boxShadow: sc.glow,
        minHeight: isTV ? "220px" : "auto",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div
            className="font-mono tracking-wider"
            style={{
              fontSize: isTV ? "11px" : "10px",
              color: "#64748B",
              letterSpacing: "0.05em",
            }}
          >
            {machine.id}
          </div>
          <div
            className="font-semibold"
            style={{
              fontSize: isTV ? "15px" : "13px",
              color: "#E2E8F0",
              marginTop: "2px",
            }}
          >
            {machine.name}
          </div>
        </div>
        <div
          className="rounded-full shrink-0"
          style={{
            width: isTV ? 12 : 10,
            height: isTV ? 12 : 10,
            background: sc.border,
            boxShadow: `0 0 8px ${sc.border}88`,
            animation: machine.status === "red" ? "status-pulse 1.5s infinite" : "none",
          }}
        />
      </div>

      {/* Hourly: ring + numbers */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ProgressRing
            percentage={hourlyPct}
            color={sc.border}
            size={isTV ? 72 : 58}
            strokeWidth={isTV ? 6 : 5}
          />
          <div
            className="absolute inset-0 flex items-center justify-center font-mono font-bold"
            style={{
              fontSize: isTV ? "18px" : "15px",
              color: sc.text,
            }}
          >
            {hourlyPct}%
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="uppercase tracking-wider"
            style={{ fontSize: "10px", color: "#64748B", letterSpacing: "0.08em", marginBottom: "2px" }}
          >
            Hourly Output
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className="font-mono font-extrabold leading-none"
              style={{
                fontSize: isTV ? "28px" : "22px",
                color: sc.text,
              }}
            >
              {machine.currentHour.actual}
            </span>
            <span style={{ fontSize: isTV ? "14px" : "12px", color: "#64748B" }}>
              / {machine.currentHour.target}
            </span>
            <DeviationBadge
              actual={machine.currentHour.actual}
              target={machine.currentHour.target}
              yellowThreshold={yellowThreshold}
            />
          </div>
        </div>
      </div>

      {/* Cumulative bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span
            className="uppercase tracking-wider"
            style={{ fontSize: "10px", color: "#64748B", letterSpacing: "0.08em" }}
          >
            Cumulative
          </span>
          <span
            className="font-mono font-semibold"
            style={{ fontSize: "12px", color: cumStatus.text }}
          >
            {machine.cumulative.actual} / {machine.cumulative.target}
          </span>
        </div>
        <div
          className="w-full overflow-hidden"
          style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(cumPct, 100)}%`,
              background: cumStatus.border,
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-auto">
        <div style={{ fontSize: "10px", color: "#475569", marginBottom: "4px" }}>
          Today's Trend
        </div>
        <div className="w-full">
          <SparklineChart
            data={machine.trend}
            color={sc.border}
            width="100%"
            height={isTV ? 32 : 24}
          />
        </div>
      </div>
    </div>
  );
});
