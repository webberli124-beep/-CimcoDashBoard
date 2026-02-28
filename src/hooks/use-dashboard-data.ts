import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { MachineData, DashboardSettings, DashboardStats } from "@/types/dashboard";
import { fetchDashboardData, ApiError } from "@/services/api";
import type { ApiErrorDetail } from "@/services/api";
import { getStatus, STATUS_SORT_WEIGHT } from "@/config/constants";

export function useDashboardData(settings: DashboardSettings) {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDetail | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const dismissError = useCallback(() => setError(null), []);

  // Only depend on the settings fields that actually affect data fetching / status computation
  const { shiftStart, shiftEnd, greenThreshold, yellowThreshold, refreshInterval } = settings;

  const loadData = useCallback(async (): Promise<void> => {
    try {
      let data = await fetchDashboardData({
        shiftStart,
        shiftEnd,
        greenThreshold,
        yellowThreshold,
      });

      // Re-compute status based on current settings thresholds
      data = data.map((m) => ({
        ...m,
        status: getStatus(
          m.currentHour.actual,
          m.currentHour.target,
          greenThreshold,
          yellowThreshold
        ),
      }));

      // Sort: red → yellow → green
      data.sort(
        (a, b) => STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status]
      );

      setMachines(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError({
          code: "UNKNOWN_ERROR",
          message: (err as Error).message || "An unexpected error occurred",
          suggestion: "Try refreshing the page. If the problem persists, check the server logs.",
        });
      }
      console.error("Failed to load dashboard data:", err);
      throw err; // Re-throw so callers (e.g. manual refresh button) can detect failure
    } finally {
      setLoading(false);
    }
  }, [shiftStart, shiftEnd, greenThreshold, yellowThreshold]);

  // Fetch on mount and when relevant settings change
  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  // Auto-refresh interval — separate effect so refreshInterval changes only reset the timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => { loadData().catch(() => {}); }, refreshInterval * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData, refreshInterval]);

  const stats: DashboardStats = useMemo(() => ({
    total: machines.length,
    onTrack: machines.filter((m) => m.status === "green").length,
    warning: machines.filter((m) => m.status === "yellow").length,
    behind: machines.filter((m) => m.status === "red").length,
    totalGap: machines.reduce((sum, m) => sum + m.currentHour.difference, 0),
  }), [machines]);

  return { machines, stats, lastUpdated, loading, error, dismissError, refresh: loadData };
}
