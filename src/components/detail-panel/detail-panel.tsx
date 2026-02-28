import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MachineData } from "@/types/dashboard";
import { STATUS_COLORS, getStatus } from "@/config/constants";
import { HourlyBarChart } from "./hourly-bar-chart";
import { DeviationBadge } from "@/components/machine-card/deviation-badge";

interface DetailPanelProps {
  machine: MachineData | null;
  greenThreshold?: number;
  yellowThreshold?: number;
  onClose: () => void;
}

export function DetailPanel({
  machine,
  greenThreshold = 100,
  yellowThreshold = 80,
  onClose,
}: DetailPanelProps) {
  if (!machine) return null;

  const cumStatusKey = getStatus(
    machine.cumulative.actual,
    machine.cumulative.target,
    greenThreshold,
    yellowThreshold
  );
  const cumColor = STATUS_COLORS[cumStatusKey];

  return (
    <Dialog open={!!machine} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[720px] w-[95vw] border-slate-700 max-h-[90vh] overflow-y-auto"
        style={{
          background: "#1E293B",
        }}
      >
        <DialogHeader>
          <div
            className="font-mono text-[10px] tracking-wider"
            style={{ color: "#64748B" }}
          >
            {machine.id}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-200">
            {machine.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Machine detail for {machine.name}
          </DialogDescription>
        </DialogHeader>

        {/* Hourly Bar Chart */}
        <div>
          <div
            className="uppercase tracking-wider mb-3"
            style={{
              fontSize: "11px",
              color: "#64748B",
              letterSpacing: "0.08em",
            }}
          >
            Hourly Output vs Target
          </div>
          <HourlyBarChart
            slots={machine.hourlySlots}
            greenThreshold={greenThreshold}
            yellowThreshold={yellowThreshold}
          />
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[11px]" style={{ color: "#94A3B8" }}>
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "rgba(148,163,184,0.3)" }}
            />
            Target
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "#10B981" }}
            />
            Actual
          </div>
        </div>

        {/* Cumulative Progress */}
        <div className="mt-2">
          <div
            className="uppercase tracking-wider mb-2"
            style={{
              fontSize: "11px",
              color: "#64748B",
              letterSpacing: "0.08em",
            }}
          >
            Cumulative Progress
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-[13px] text-slate-200">
              {machine.cumulative.actual} / {machine.cumulative.target} (
              {machine.cumulative.percentage}%)
            </span>
            <DeviationBadge
              actual={machine.cumulative.actual}
              target={machine.cumulative.target}
            />
          </div>
          <div
            className="w-full overflow-hidden"
            style={{
              height: 10,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 5,
            }}
          >
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(machine.cumulative.percentage, 100)}%`,
                background: cumColor.border,
                borderRadius: 5,
              }}
            />
          </div>
        </div>

        {/* Data Source Note */}
        <div
          className="font-mono mt-4"
          style={{
            padding: "10px 14px",
            background: "rgba(99,102,241,0.08)",
            border: "1px dashed #4F46E5",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#A5B4FC",
            lineHeight: 1.5,
          }}
        >
          MariaDB · mdc.valtb_hourly_dashboard
          <br />
          · starttime(text) → readable time · portid → machine ID
          <br />
          · column1=cum_target · column2=hourly_target · column3=output
        </div>
      </DialogContent>
    </Dialog>
  );
}
