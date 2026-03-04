import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import type { MachineData } from "@/types/dashboard";
import { STATUS_COLORS, STATUS_SORT_WEIGHT, getPct, getStatus } from "@/config/constants";
import { DeviationBadge } from "@/components/machine-card/deviation-badge";

interface SummaryTableProps {
  machines: MachineData[];
  greenThreshold?: number;
  yellowThreshold?: number;
  onSelectMachine: (machine: MachineData) => void;
}

type SortKey = "machine" | "hourlyDiff" | "cumPct" | "status";

export function SummaryTable({
  machines,
  greenThreshold = 100,
  yellowThreshold = 80,
  onSelectMachine,
}: SummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...machines].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "machine":
        cmp = a.id.localeCompare(b.id);
        break;
      case "hourlyDiff":
        cmp = a.currentHour.difference - b.currentHour.difference;
        break;
      case "cumPct":
        cmp = a.cumulative.percentage - b.cumulative.percentage;
        break;
      case "status":
        cmp = STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status];
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortButton = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 hover:text-slate-300 transition-colors"
      onClick={() => handleSort(col)}
    >
      {children}
      <ArrowUpDown size={12} className="opacity-50" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              <SortButton col="machine">Machine</SortButton>
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              Hourly Target
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              Hourly Output
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              <SortButton col="hourlyDiff">Diff</SortButton>
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              Hourly %
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              Cum. Target
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              Cum. Output
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              <SortButton col="cumPct">Cum. %</SortButton>
            </TableHead>
            <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
              <SortButton col="status">Status</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((m) => {
            const sc = STATUS_COLORS[m.status];
            const hourlyPct = getPct(m.currentHour.actual, m.currentHour.target);
            const cumSc = STATUS_COLORS[
              getStatus(m.cumulative.actual, m.cumulative.target, greenThreshold, yellowThreshold)
            ];
            const isNegDiff = m.currentHour.difference < 0;

            return (
              <TableRow
                key={m.id}
                className="border-slate-800/50 cursor-pointer hover:bg-white/[0.03] transition-colors"
                style={{
                  background: isNegDiff ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
                }}
                onClick={() => onSelectMachine(m)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectMachine(m); } }}
                role="button"
                tabIndex={0}
              >
                <TableCell className="py-2.5">
                  <div className="font-mono text-[10px] text-slate-500">
                    {m.id}
                  </div>
                  <div className="text-slate-200 font-semibold text-sm">
                    {m.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-slate-400 text-sm">
                  {m.currentHour.target}
                </TableCell>
                <TableCell
                  className="font-mono font-bold text-sm"
                  style={{ color: sc.text }}
                >
                  {m.currentHour.actual}
                </TableCell>
                <TableCell>
                  <DeviationBadge
                    actual={m.currentHour.actual}
                    target={m.currentHour.target}
                  />
                </TableCell>
                <TableCell
                  className="font-mono text-sm"
                  style={{ color: sc.text }}
                >
                  {hourlyPct}%
                </TableCell>
                <TableCell className="font-mono text-slate-400 text-sm">
                  {m.cumulative.target}
                </TableCell>
                <TableCell className="font-mono text-slate-400 text-sm">
                  {m.cumulative.actual}
                </TableCell>
                <TableCell
                  className="font-mono text-sm"
                  style={{ color: cumSc.text }}
                >
                  {m.cumulative.percentage}%
                </TableCell>
                <TableCell>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold"
                    style={{
                      padding: "3px 10px",
                      background: `${sc.border}22`,
                      color: sc.text,
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        background: sc.border,
                      }}
                    />
                    {m.status === "green"
                      ? "On Track"
                      : m.status === "yellow"
                        ? "Minor"
                        : m.status === "orange"
                          ? "Caution"
                          : "Behind"}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
