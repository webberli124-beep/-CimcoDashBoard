import { useState, useMemo, useEffect } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useSettings } from "@/hooks/use-settings";
import { fetchConfig } from "@/services/api";
import type { AppConfig } from "@/services/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusBar } from "@/components/status-bar/status-bar";
import { MachineGrid } from "@/components/machine-grid/machine-grid";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { SummaryTable } from "@/components/summary-table/summary-table";
import { SettingsPanel } from "@/components/settings-panel/settings-panel";
import { ErrorBanner } from "@/components/error-banner/error-banner";

export default function DashboardPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { machines, stats, lastUpdated, loading, error, dismissError, refresh } = useDashboardData(settings);

  const [view, setView] = useState<"cards" | "table">("cards");
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  // Always derive selectedMachine from latest machines data to avoid stale state
  const selectedMachine = useMemo(
    () => (selectedMachineId ? machines.find((m) => m.id === selectedMachineId) ?? null : null),
    [selectedMachineId, machines]
  );

  const shiftTime = `${settings.shiftStart} – ${settings.shiftEnd}`;

  return (
    <DashboardLayout>
      {/* MODULE 1: Status Bar */}
      <StatusBar
        stats={stats}
        shiftName={settings.shiftName}
        shiftTime={shiftTime}
        lastUpdated={lastUpdated}
        refreshInterval={settings.refreshInterval}
        isTV={settings.tvMode}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Error Banner */}
      {error && <ErrorBanner error={error} onDismiss={dismissError} />}

      {/* View Toggle */}
      <div
        style={{ padding: settings.tvMode ? "0 32px 8px" : "0 16px 6px" }}
        className="flex gap-0.5"
      >
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: "#1E293B" }}>
          {[
            { key: "cards" as const, label: "Grid Cards" },
            { key: "table" as const, label: "Table View" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className="transition-colors font-semibold"
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                background: view === key ? "#334155" : "transparent",
                color: view === key ? "#E2E8F0" : "#64748B",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* MODULE 2/4: Main Content */}
      <div style={{ padding: settings.tvMode ? "8px 32px 32px" : "6px 16px 16px" }}>
        {loading && machines.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: "200px", color: "#64748B", fontSize: "14px" }}
          >
            Loading dashboard data...
          </div>
        ) : !loading && machines.length === 0 && !error ? (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: "200px", color: "#64748B", fontSize: "14px" }}
          >
            No machine data available for the current shift.
          </div>
        ) : view === "cards" ? (
          <MachineGrid
            machines={machines}
            isTV={settings.tvMode}
            yellowThreshold={settings.yellowThreshold}
            greenThreshold={settings.greenThreshold}
            onSelectMachine={(m) => setSelectedMachineId(m.id)}
          />
        ) : (
          <SummaryTable
            machines={machines}
            greenThreshold={settings.greenThreshold}
            yellowThreshold={settings.yellowThreshold}
            onSelectMachine={(m) => setSelectedMachineId(m.id)}
          />
        )}
      </div>

      {/* MODULE 3: Detail Panel */}
      <DetailPanel
        machine={selectedMachine}
        greenThreshold={settings.greenThreshold}
        yellowThreshold={settings.yellowThreshold}
        onClose={() => setSelectedMachineId(null)}
      />

      {/* MODULE 5: Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
        onRefresh={refresh}
        shifts={config?.shifts ?? []}
        networkUrl={config?.lanIp ? `http://${config.lanIp}:${config.port}` : ""}
      />
    </DashboardLayout>
  );
}
