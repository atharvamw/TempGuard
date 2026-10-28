import React from "react";
import { LatestReadingData } from "@/types/telemetry";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

interface TemperatureOverviewProps {
  data: LatestReadingData | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function TemperatureOverview({
  data,
  isRefreshing,
  onRefresh,
}: TemperatureOverviewProps) {
  const reading = data?.reading;
  const status = data?.freshnessStatus || "awaiting_first_reading";
  const violation = data?.thresholdViolation;
  const settings = data?.settings;

  // First-run state when device has never submitted a reading
  if (!reading || status === "awaiting_first_reading") {
    return (
      <div className="p-8 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Current Temperature
          </span>
          <StatusBadge status="awaiting_first_reading" />
        </div>

        <div className="py-6 space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Waiting for your first reading
          </h3>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Connect your ESP32 sensor and bring the device online. Temperature telemetry
            transmissions will automatically display here once received.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Polling interval: every 10 seconds
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Check now
          </button>
        </div>
      </div>
    );
  }

  // Format reading age in human friendly string
  const ageSeconds = data.ageSeconds ?? 0;
  let ageString = `${ageSeconds}s ago`;
  if (ageSeconds >= 3600) {
    const hours = Math.floor(ageSeconds / 3600);
    ageString = `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (ageSeconds >= 60) {
    const minutes = Math.floor(ageSeconds / 60);
    ageString = `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  return (
    <div className="p-8 rounded-xl border border-border bg-card shadow-sm space-y-6">
      {/* Header row: Device and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
            {reading.deviceId}
          </span>
          {isRefreshing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="h-2.5 w-2.5 animate-spin text-primary" />
              syncing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh telemetry"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Temperature Hero */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground font-mono">
            {reading.temperatureC.toFixed(1)}
          </span>
          <span className="text-2xl font-medium text-muted-foreground">°C</span>
        </div>

        {/* Timestamp & Freshness details */}
        <div className="text-xs text-muted-foreground space-y-0.5 md:text-right">
          <div>Received at {formatDateTime(reading.receivedAt)}</div>
          <div className="font-mono text-[11px]">Updated {ageString}</div>
        </div>
      </div>

      {/* Stale Warning Banner (PRD FR-07) */}
      {status === "stale" && (
        <div className="p-3.5 rounded-lg border border-orange-200 bg-orange-50/70 dark:border-orange-900/50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Device is offline.</span>
            <p className="text-orange-800/90 dark:text-orange-300">
              Last reading was received {ageString}. Displaying the last stored measurement,
              not a live reading.
            </p>
          </div>
        </div>
      )}

      {/* Threshold Violation Notice */}
      {violation && settings && (
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Temperature threshold exceeded:</span>{" "}
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
