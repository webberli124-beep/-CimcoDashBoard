import { memo } from "react";

interface ProgressRingProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing = memo(function ProgressRing({
  percentage,
  color,
  size = 58,
  strokeWidth = 5,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const offset = circ - (clamped / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
});
