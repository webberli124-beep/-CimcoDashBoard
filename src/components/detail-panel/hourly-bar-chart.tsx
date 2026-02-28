import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { HourlySlot } from "@/types/dashboard";

interface HourlyBarChartProps {
  slots: HourlySlot[];
  greenThreshold?: number;
  yellowThreshold?: number;
}

export function HourlyBarChart({
  slots,
  greenThreshold = 100,
  yellowThreshold = 80,
}: HourlyBarChartProps) {
  const option = useMemo(() => {
    const hours = slots.map((s) => s.hour);
    const targets = slots.map((s) => s.target);
    const actuals = slots.map((s) => s.actual);

    // Color actual bars by status using configured thresholds
    const actualColors = slots.map((s) => {
      const pct = s.target > 0 ? (s.actual / s.target) * 100 : 100;
      if (pct >= greenThreshold) return "#10B981";
      if (pct >= yellowThreshold) return "#F59E0B";
      return "#EF4444";
    });

    // Diff labels on top of actual bars
    const diffLabels = slots.map((s) => {
      const diff = s.actual - s.target;
      return {
        value: diff,
        label: diff >= 0 ? `+${diff}` : `${diff}`,
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#1E293B",
        borderColor: "#334155",
        textStyle: { color: "#E2E8F0", fontSize: 12, fontFamily: "JetBrains Mono, monospace" },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string }>) => {
          const hour = params[0].axisValue;
          const target = params[0].value;
          const actual = params[1]?.value ?? 0;
          const diff = actual - target;
          const diffColor = diff >= 0 ? "#10B981" : "#EF4444";
          return `<b>${hour}</b><br/>
            Target: ${target}<br/>
            Actual: ${actual}<br/>
            <span style="color:${diffColor}">Diff: ${diff >= 0 ? "+" : ""}${diff}</span>`;
        },
      },
      grid: {
        left: 40,
        right: 20,
        top: 30,
        bottom: 30,
      },
      xAxis: {
        type: "category" as const,
        data: hours,
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#1E293B" } },
        axisLabel: { color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
      },
      series: [
        {
          name: "Target",
          type: "bar" as const,
          data: targets,
          barWidth: "30%",
          itemStyle: { color: "rgba(148,163,184,0.2)", borderRadius: [3, 3, 0, 0] },
        },
        {
          name: "Actual",
          type: "bar" as const,
          data: actuals.map((v, i) => ({
            value: v,
            itemStyle: { color: actualColors[i], opacity: 0.9 },
          })),
          barWidth: "30%",
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          label: {
            show: true,
            position: "top" as const,
            fontSize: 10,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: "bold" as const,
            formatter: (_params: { dataIndex: number }) => {
              const idx = _params.dataIndex;
              return diffLabels[idx].label;
            },
            color: (_params: { dataIndex: number }) => {
              const idx = _params.dataIndex;
              return diffLabels[idx].value >= 0 ? "#10B981" : "#EF4444";
            },
          },
        },
      ],
    };
  }, [slots, greenThreshold, yellowThreshold]);

  return (
    <ReactECharts
      option={option}
      style={{ height: 200, width: "100%" }}
      opts={{ renderer: "svg" }}
    />
  );
}
