"use client";

import React from "react";
import { useTelemetry } from "./useTelemetry";
import { TemperatureOverview } from "./TemperatureOverview";
import { TemperatureStats } from "./TemperatureStats";
import { TemperatureChart } from "./TemperatureChart";
import { ThresholdSettings } from "./ThresholdSettings";
import { StatusBadge } from "./StatusBadge";
import { AlertCircle, RefreshCw, Wifi } from "lucide-react";

interface DashboardProps {
  deviceId?: string;
}

export function Dashboard({ deviceId = "thermoguard-01" }: DashboardProps) {
  const {
    latest,
    history,
    selectedRange,
    isLoading,
    isRefreshing,
    error,
    lastSuccessAt,
    setRange,
    updateThresholds,
    refetch,
  } = useTelemetry(deviceId);

  const status = latest?.freshnessStatus || "awaiting_first_reading";
  const settings = latest?.settings;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Top Navigation / App Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
            θ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                ThermoGuard
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {deviceId}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Smart IoT Temperature Monitoring
            </p>
          </div>
        </div>

        {/* Header Right: Status and Manual Sync */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            onClick={refetch}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            title="Poll for new temperature data now"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* Non-intrusive error banner (retains old data on temporary network glitch) */}
      {error && (
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refetch}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-48 rounded-xl bg-muted/60 border border-border" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 rounded-xl bg-muted/50 border border-border" />
            <div className="h-24 rounded-xl bg-muted/50 border border-border" />
            <div className="h-24 rounded-xl bg-muted/50 border border-border" />
            <div className="h-24 rounded-xl bg-muted/50 border border-border" />
          </div>
          <div className="h-72 rounded-xl bg-muted/40 border border-border" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Hero Overview */}
          <TemperatureOverview
            data={latest}
            isRefreshing={isRefreshing}
            onRefresh={refetch}
          />

          {/* Section 2: Period Summary Statistics */}
          <TemperatureStats
            stats={history?.stats}
            range={selectedRange}
          />

          {/* Section 3: Historical Interactive Chart */}
          <TemperatureChart
            readings={history?.readings || []}
            range={selectedRange}
            onRangeChange={setRange}
            minThreshold={settings?.minTemperatureC}
            maxThreshold={settings?.maxTemperatureC}
            isRefreshing={isRefreshing}
          />

          {/* Section 4: Configurable Thresholds */}
          <ThresholdSettings
            initialMin={settings?.minTemperatureC}
            initialMax={settings?.maxTemperatureC}
            onSave={async (min, max) => {
              const res = await updateThresholds(min, max);
              return res;
            }}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5 text-primary" />
          <span>Auto-refresh active (10s) with visibility awareness</span>
        </div>
        <div>
          {lastSuccessAt && (
            <span>Last synced: {lastSuccessAt.toLocaleTimeString()}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
