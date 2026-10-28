"use client";

import React from "react";
import { LatestReadingData } from "@/types/telemetry";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, Clock, RefreshCw, Thermometer, ShieldAlert } from "lucide-react";

interface TemperatureOverviewProps {
  data: LatestReadingData | null;
  isRefreshing: boolean;
  secondsSinceLastFetch?: number;
  onRefresh: () => void;
}

export function TemperatureOverview({
  data,
  isRefreshing,
  secondsSinceLastFetch = 0,
  onRefresh,
}: TemperatureOverviewProps) {
  const reading = data?.reading;
  const status = data?.freshnessStatus || "awaiting_first_reading";
  const violation = data?.thresholdViolation;
  const settings = data?.settings;

  // First-run state when device has never submitted a reading
  if (!reading || status === "awaiting_first_reading") {
    return (
      <div className="relative overflow-hidden p-8 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Sensor Telemetry
            </span>
          </div>
          <StatusBadge status="awaiting_first_reading" />
        </div>

        <div className="py-6 space-y-2">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">
            Waiting for your first reading
          </h3>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Connect your ESP32 sensor and bring the device online. Temperature telemetry
            transmissions will automatically display here once received.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-mono">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Polling every 3 seconds
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Check now
          </button>
        </div>
      </div>
    );
  }

  // Calculate live human-friendly reading age
  const baseAge = data.ageSeconds ?? 0;
  const totalAge = baseAge + secondsSinceLastFetch;

  let ageString = `${totalAge}s ago`;
  if (totalAge >= 3600) {
    const hours = Math.floor(totalAge / 3600);
    ageString = `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (totalAge >= 60) {
    const minutes = Math.floor(totalAge / 60);
    ageString = `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  // Threshold gauge calculation (percentage for horizontal bar)
  const minThresh = settings?.minTemperatureC ?? 18;
  const maxThresh = settings?.maxTemperatureC ?? 28;
  const currentTemp = reading.temperatureC;

  // Scale gauge between (min - 5) and (max + 5)
  const gaugeMin = minThresh - 5;
  const gaugeMax = maxThresh + 5;
  const gaugePercent = Math.min(100, Math.max(0, ((currentTemp - gaugeMin) / (gaugeMax - gaugeMin)) * 100));

  return (
    <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-secondary/20 shadow-sm space-y-6">
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Header row: Device ID, Sync indicator, and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-secondary text-primary border border-border/60">
            <Thermometer className="h-4 w-4" />
          </div>
          <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground">
            {reading.deviceId}
          </span>
          {isRefreshing && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary animate-pulse">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
              syncing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <StatusBadge status={status} />
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh telemetry"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Poll for new reading now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Temperature Display */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl md:text-7xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {reading.temperatureC.toFixed(1)}
          </span>
          <span className="text-2xl md:text-3xl font-medium text-muted-foreground">
            °C
          </span>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 sm:text-right">
          <div className="font-mono text-foreground/90 font-medium">
            Updated {ageString}
          </div>
          <div className="text-[11px]">
            Server received: {formatDateTime(reading.receivedAt)}
          </div>
        </div>
      </div>

      {/* Visual Temperature Range Gauge */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span className="text-blue-500">Min: {minThresh.toFixed(1)}°C</span>
          <span className="text-emerald-500 font-medium">Optimal Range</span>
          <span className="text-rose-500">Max: {maxThresh.toFixed(1)}°C</span>
        </div>

        {/* Gauge Track */}
        <div className="relative h-2 w-full rounded-full bg-secondary/80 overflow-hidden border border-border/40">
          {/* Target normal band in middle */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20"
            style={{
              left: `${((minThresh - gaugeMin) / (gaugeMax - gaugeMin)) * 100}%`,
              right: `${100 - ((maxThresh - gaugeMin) / (gaugeMax - gaugeMin)) * 100}%`,
            }}
          />
          {/* Active temperature fill */}
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              violation === "high"
                ? "bg-rose-500"
                : violation === "low"
                ? "bg-blue-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${gaugePercent}%` }}
          />
        </div>
      </div>

      {/* Offline Alert Banner */}
      {status === "stale" && (
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 text-xs flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Device is offline.</span>
            <p className="text-muted-foreground leading-relaxed">
              Last reading was received {ageString}. Displaying the last stored measurement, not a live reading.
            </p>
          </div>
        </div>
      )}

      {/* Threshold Violation Notice */}
      {violation && settings && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Temperature threshold exceeded:</span>{" "}
            {violation === "high" ? (
              <span>
                Current value ({reading.temperatureC.toFixed(1)}°C) is above the configured maximum
                threshold of {settings.maxTemperatureC.toFixed(1)}°C.
              </span>
            ) : (
              <span>
                Current value ({reading.temperatureC.toFixed(1)}°C) is below the configured minimum
                threshold of {settings.minTemperatureC.toFixed(1)}°C.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
