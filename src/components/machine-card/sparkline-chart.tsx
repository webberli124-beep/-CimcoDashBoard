import { memo } from "react";

interface SparklineChartProps {
  data: number[];
  color: string;
  width?: number | string;
  height?: number;
}

export const SparklineChart = memo(function SparklineChart({
  data,
  color,
  width = 140,
  height = 24,
}: SparklineChartProps) {
  if (data.length === 0) return null;

  // Use a fixed viewBox internally for coordinate calculation
  const vw = 200;

  if (data.length === 1) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${vw} ${height}`} preserveAspectRatio="none" className="block">
        <circle cx={vw / 2} cy={height / 2} r="2.5" fill={color} />
      </svg>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * vw},${height - ((v - min) / range) * (height - 4) - 2}`
    )
    .join(" ");

  const lastX = vw;
  const lastY =
    height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vw} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
});
