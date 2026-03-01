import { useState, useCallback, useEffect } from "react";
import type { DashboardSettings } from "@/types/dashboard";
import { DEFAULT_SETTINGS, getLocalToday } from "@/config/constants";

const STORAGE_KEY = "cimco-dashboard-settings";

function loadSettings(): DashboardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        // Validate each field type matches the default
        const result = { ...DEFAULT_SETTINGS };
        for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof DashboardSettings>) {
          if (key in parsed && typeof parsed[key] === typeof DEFAULT_SETTINGS[key]) {
            (result as Record<string, unknown>)[key] = parsed[key];
          }
        }
        return result;
      }
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
    setSettingsState({ ...DEFAULT_SETTINGS, selectedDate: getLocalToday() });
  }, []);

  return { settings, updateSettings, resetSettings };
}
