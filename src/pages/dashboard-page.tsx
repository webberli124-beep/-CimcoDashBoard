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
import { HourlyTable } from "@/components/hourly-table/hourly-table";
import { ActionBar } from "@/components/action-bar/action-bar";
import type { ViewMode } from "@/components/action-bar/action-bar";

export default function DashboardPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { machines, stats, lastUpdated, loading, error, dismissError, refresh } = useDashboardData(settings);

  const [view, setView] = useState<ViewMode>("hourly");
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [detailMachineId, setDetailMachineId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchConfig().then((cfg) => { if (!cancelled) setConfig(cfg); });
    return () => { cancelled = true; };
  }, []);

  // Machine for the hourly table selector
  const selectedMachine = useMemo(
    () => (selectedMachineId ? machines.find((m) => m.id === selectedMachineId) ?? null : null),
    [selectedMachineId, machines]
  );

  // Machine for the detail panel (cards/table click)
  const detailMachine = useMemo(
    () => (detailMachineId ? machines.find((m) => m.id === detailMachineId) ?? null : null),
    [detailMachineId, machines]
  );

  return (
    <DashboardLayout>
      {/* MODULE 1: Status Bar */}
      <StatusBar
        stats={stats}
        selectedDate={settings.selectedDate}
        lastUpdated={lastUpdated}
        refreshInterval={settings.refreshInterval}
        isTV={settings.tvMode}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Error Banner */}
      {error && <ErrorBanner error={error} onDismiss={dismissError} />}

      {/* ACTION BAR: Machine selector + Date + View toggle + Shift */}
      <ActionBar
        view={view}
        onViewChange={setView}
        machines={machines}
        selectedMachineId={selectedMachineId}
        onMachineChange={setSelectedMachineId}
        selectedDate={settings.selectedDate}
        onDateChange={(date) => updateSettings({ selectedDate: date })}
        onRefresh={refresh}
        isTV={settings.tvMode}
        shiftName={settings.shiftName}
        shiftStart={settings.shiftStart}
        shiftEnd={settings.shiftEnd}
      />

      {/* MAIN CONTENT: 3-way view routing */}
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
        ) : view === "hourly" ? (
          selectedMachine ? (
            <HourlyTable
              machine={selectedMachine}
              greenThreshold={settings.greenThreshold}
              yellowThreshold={settings.yellowThreshold}
              isTV={settings.tvMode}
            />
          ) : (
            <div className="space-y-6">
              {machines.map((m) => (
                <HourlyTable
                  key={m.id}
                  machine={m}
                  greenThreshold={settings.greenThreshold}
                  yellowThreshold={settings.yellowThreshold}
                  isTV={settings.tvMode}
                />
              ))}
            </div>
          )
        ) : view === "cards" ? (
          <MachineGrid
            machines={machines}
            isTV={settings.tvMode}
            yellowThreshold={settings.yellowThreshold}
            greenThreshold={settings.greenThreshold}
            onSelectMachine={(m) => setDetailMachineId(m.id)}
          />
        ) : (
          <SummaryTable
            machines={machines}
            greenThreshold={settings.greenThreshold}
            yellowThreshold={settings.yellowThreshold}
            onSelectMachine={(m) => setDetailMachineId(m.id)}
          />
        )}
      </div>

      {/* Detail Panel (for cards/table views) */}
      <DetailPanel
        machine={detailMachine}
        greenThreshold={settings.greenThreshold}
        yellowThreshold={settings.yellowThreshold}
        onClose={() => setDetailMachineId(null)}
      />

      {/* Settings Panel */}
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
