import { memo } from "react";
import { TrendingUp, TrendingDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviationBadgeProps {
  actual: number;
  target: number;
  yellowThreshold?: number;
  size?: "sm" | "md";
}

export const DeviationBadge = memo(function DeviationBadge({
  actual,
  target,
  yellowThreshold = 80,
  size = "sm",
}: DeviationBadgeProps) {
  const diff = actual - target;
  const pct = target > 0 ? (actual / target) * 100 : 100;

  const iconSize = size === "sm" ? 12 : 14;
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  if (diff === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono font-semibold",
          "bg-emerald-500/10 text-emerald-300",
          textClass
        )}
      >
        <Check size={iconSize} />
      </span>
    );
  }

  if (diff > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-semibold",
          "bg-emerald-500/10 text-emerald-300",
          textClass
        )}
      >
        <TrendingUp size={iconSize} />
        +{diff}
      </span>
    );
  }

  // diff < 0
  const severe = pct < yellowThreshold;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-semibold",
        severe
          ? "bg-red-500/20 text-red-200 animate-pulse border-2 border-red-500/40 text-sm"
          : "bg-red-500/10 text-red-300",
        !severe && textClass
      )}
    >
      <TrendingDown size={severe ? 16 : iconSize} />
      {diff}
    </span>
  );
});
