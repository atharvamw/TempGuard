"use client";

import React from "react";
import { useTelemetry } from "./useTelemetry";
import { TemperatureOverview } from "./TemperatureOverview";
import { TemperatureStats } from "./TemperatureStats";
import { TemperatureChart } from "./TemperatureChart";
import { ThresholdSettings } from "./ThresholdSettings";
import { StatusBadge } from "./StatusBadge";
import { ThermoGuardLogo } from "./ThermoGuardLogo";
import { AlertCircle, RefreshCw, Radio, CheckCircle2 } from "lucide-react";

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
    secondsSinceLastFetch,
    setRange,
    updateThresholds,
    refetch,
  } = useTelemetry(deviceId);

  const status = latest?.freshnessStatus || "awaiting_first_reading";
  const settings = latest?.settings;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Top Navigation / App Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-3.5">
          <ThermoGuardLogo size={46} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                ThermoGuard
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/60">
                {deviceId}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Smart IoT Temperature Monitoring &bull; Cloud Dashboard
            </p>
          </div>
        </div>

        {/* Header Right: Status and Live Auto-Sync Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <StatusBadge status={status} />
          
          <button
            onClick={refetch}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Poll for new temperature data now"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* Non-intrusive error notice (retains data during transient network drops) */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refetch}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-56 rounded-2xl bg-muted/50 border border-border/60" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-28 rounded-2xl bg-muted/40 border border-border/60" />
            <div className="h-28 rounded-2xl bg-muted/40 border border-border/60" />
            <div className="h-28 rounded-2xl bg-muted/40 border border-border/60" />
            <div className="h-28 rounded-2xl bg-muted/40 border border-border/60" />
          </div>
          <div className="h-80 rounded-2xl bg-muted/40 border border-border/60" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Hero Overview */}
          <TemperatureOverview
            data={latest}
            isRefreshing={isRefreshing}
            secondsSinceLastFetch={secondsSinceLastFetch}
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
      <footer className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>Live telemetry active &bull; Auto-syncing every 3s</span>
        </div>
        <div className="flex items-center gap-2">
          {lastSuccessAt && (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Last synced {lastSuccessAt.toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
