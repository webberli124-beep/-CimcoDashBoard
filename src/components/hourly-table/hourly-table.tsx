import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MachineData } from "@/types/dashboard";
import { STATUS_COLORS, getPct, getStatus } from "@/config/constants";

interface HourlyTableProps {
  machine: MachineData;
  greenThreshold?: number;
  yellowThreshold?: number;
  isTV?: boolean;
}

export function HourlyTable({
  machine,
  greenThreshold = 100,
  yellowThreshold = 80,
  isTV = false,
}: HourlyTableProps) {
  const rows = useMemo(() => {
    let cumTarget = 0;
    let cumActual = 0;

    return machine.hourlySlots.map((slot) => {
      cumTarget += slot.target;
      cumActual += slot.actual;
      const cumDifference = cumActual - cumTarget;
      const cumPercentage = cumTarget > 0 ? Math.round((cumActual / cumTarget) * 100) : 0;

      return {
        ...slot,
        cumTarget,
        cumActual,
        cumDifference,
        cumPercentage,
      };
    });
  }, [machine.hourlySlots]);

  const totals = useMemo(() => {
    const totalTarget = rows.reduce((s, r) => s + r.target, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const totalDiff = totalActual - totalTarget;
    const totalPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    return { target: totalTarget, actual: totalActual, diff: totalDiff, pct: totalPct };
  }, [rows]);

  const statusColors = STATUS_COLORS[machine.status];
  const cellPad = isTV ? "py-3 px-3" : "py-1.5 px-2";
  const fontSize = isTV ? "text-base" : "text-sm";
  const headerSize = isTV ? "text-xs" : "text-[10px]";

  function diffColor(diff: number) {
    return diff >= 0 ? STATUS_COLORS.green.text : STATUS_COLORS.red.text;
  }

  function pctColor(actual: number, target: number) {
    const st = getStatus(actual, target, greenThreshold, yellowThreshold);
    return STATUS_COLORS[st].text;
  }

  return (
    <div>
      {/* Machine header */}
      <div className="flex items-center gap-2 mb-2" style={{ padding: isTV ? "0 4px" : "0 2px" }}>
        <div
          className="rounded-full"
          style={{ width: 10, height: 10, background: statusColors.border, flexShrink: 0 }}
        />
        <span className={`font-mono text-slate-500 ${isTV ? "text-sm" : "text-xs"}`}>
          [{machine.id}]
        </span>
        <span className={`font-semibold text-slate-200 ${isTV ? "text-lg" : "text-sm"}`}>
          {machine.name}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              {[
                "Hour",
                "H.Target",
                "H.Output",
                "Diff",
                "%",
                "Cum.Target",
                "Cum.Output",
                "Cum.Diff",
                "Cum.%",
              ].map((label) => (
                <TableHead
                  key={label}
                  className={`text-slate-500 ${headerSize} uppercase tracking-wider font-medium`}
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const hourlyStatus = getStatus(row.actual, row.target, greenThreshold, yellowThreshold);
              const hourlyColor = STATUS_COLORS[hourlyStatus].text;
              const cumStatus = getStatus(row.cumActual, row.cumTarget, greenThreshold, yellowThreshold);
              const cumColor = STATUS_COLORS[cumStatus].text;

              return (
                <TableRow
                  key={row.hour}
                  className="border-slate-800/50 hover:bg-white/[0.03] transition-colors"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <TableCell className={`${cellPad} font-mono text-slate-400 ${fontSize}`}>
                    {row.hour}
                  </TableCell>
                  <TableCell className={`${cellPad} font-mono text-slate-400 ${fontSize}`}>
                    {row.target}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono font-bold ${fontSize}`}
                    style={{ color: hourlyColor }}
                  >
                    {row.actual}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono ${fontSize}`}
                    style={{ color: diffColor(row.difference) }}
                  >
                    {row.difference > 0 ? `+${row.difference}` : row.difference}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono ${fontSize}`}
                    style={{ color: hourlyColor }}
                  >
                    {getPct(row.actual, row.target)}%
                  </TableCell>
                  <TableCell className={`${cellPad} font-mono text-slate-400 ${fontSize}`}>
                    {row.cumTarget}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono font-bold ${fontSize}`}
                    style={{ color: cumColor }}
                  >
                    {row.cumActual}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono ${fontSize}`}
                    style={{ color: diffColor(row.cumDifference) }}
                  >
                    {row.cumDifference > 0 ? `+${row.cumDifference}` : row.cumDifference}
                  </TableCell>
                  <TableCell
                    className={`${cellPad} font-mono ${fontSize}`}
                    style={{ color: cumColor }}
                  >
                    {row.cumPercentage}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-slate-700 hover:bg-transparent" style={{ background: "rgba(255,255,255,0.04)" }}>
              <TableCell className={`${cellPad} font-semibold text-slate-300 ${fontSize}`}>
                TOTAL
              </TableCell>
              <TableCell className={`${cellPad} font-mono font-semibold text-slate-300 ${fontSize}`}>
                {totals.target}
              </TableCell>
              <TableCell
                className={`${cellPad} font-mono font-bold ${fontSize}`}
                style={{ color: pctColor(totals.actual, totals.target) }}
              >
                {totals.actual}
              </TableCell>
              <TableCell
                className={`${cellPad} font-mono font-semibold ${fontSize}`}
                style={{ color: diffColor(totals.diff) }}
              >
                {totals.diff > 0 ? `+${totals.diff}` : totals.diff}
              </TableCell>
              <TableCell
                className={`${cellPad} font-mono font-semibold ${fontSize}`}
                style={{ color: pctColor(totals.actual, totals.target) }}
              >
                {totals.pct}%
              </TableCell>
              {/* Cumulative columns empty for TOTAL row */}
              <TableCell className={cellPad}>—</TableCell>
              <TableCell className={cellPad}>—</TableCell>
              <TableCell className={cellPad}>—</TableCell>
              <TableCell className={cellPad}>—</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
