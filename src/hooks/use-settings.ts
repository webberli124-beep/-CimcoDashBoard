import { useState, useCallback, useEffect } from "react";
import type { DashboardSettings } from "@/types/dashboard";
import { DEFAULT_SETTINGS } from "@/config/constants";

const STORAGE_KEY = "cimco-dashboard-settings";

function loadSettings(): DashboardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

export function useSettings() {
  const [settings, setSettingsState] = useState<DashboardSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<DashboardSettings>) => {
      setSettingsState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSettings, resetSettings };
}
