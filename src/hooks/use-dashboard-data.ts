import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { MachineData, DashboardSettings, DashboardStats } from "@/types/dashboard";
import { fetchDashboardData, ApiError } from "@/services/api";
import type { ApiErrorDetail } from "@/services/api";
import { getStatus, STATUS_SORT_WEIGHT } from "@/config/constants";

export function useDashboardData(settings: DashboardSettings) {
  const [rawMachines, setRawMachines] = useState<MachineData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDetail | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const dismissError = useCallback(() => setError(null), []);

  const { shiftStart, shiftEnd, greenThreshold, yellowThreshold, refreshInterval, selectedDate } = settings;

  const loadData = useCallback(async (signal?: AbortSignal): Promise<void> => {
    try {
      const data = await fetchDashboardData({
        shiftStart,
        shiftEnd,
        greenThreshold,
        yellowThreshold,
        date: selectedDate,
        signal,
      });

      if (signal?.aborted) return;
      setRawMachines(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
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
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [shiftStart, shiftEnd, greenThreshold, yellowThreshold, selectedDate]);

  // Fetch on mount and when relevant settings change; abort stale requests
  useEffect(() => {
    const ac = new AbortController();
    loadData(ac.signal).catch(() => {});
    return () => ac.abort();
  }, [loadData]);

  // Auto-refresh interval — use ref so interval only resets when refreshInterval changes
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => { loadDataRef.current().catch(() => {}); }, refreshInterval * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval]);

  // Re-compute status and sort when thresholds change (instant, no refetch)
  const machines = useMemo(() => {
    const data = rawMachines.map((m) => ({
      ...m,
      status: getStatus(
        m.currentHour.actual,
        m.currentHour.target,
        greenThreshold,
        yellowThreshold
      ),
    }));
    data.sort((a, b) => STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status]);
    return data;
  }, [rawMachines, greenThreshold, yellowThreshold]);

  // Compute stats in a single pass
  const stats: DashboardStats = useMemo(() => {
    let onTrack = 0, warning = 0, behind = 0, totalGap = 0;
    for (const m of machines) {
      if (m.status === "green") onTrack++;
      else if (m.status === "yellow") warning++;
      else behind++;
      totalGap += m.currentHour.difference;
    }
    return { total: machines.length, onTrack, warning, behind, totalGap };
  }, [machines]);

  // Manual refresh (no signal — not cancelled by settings changes)
  const refresh = useCallback(() => loadData(), [loadData]);

  return { machines, stats, lastUpdated, loading, error, dismissError, refresh };
}
