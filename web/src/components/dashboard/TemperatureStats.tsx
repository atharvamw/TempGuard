import React from "react";
import { TemperatureStats as StatsType } from "@/types/telemetry";
import { ArrowDown, ArrowUp, BarChart2, Activity } from "lucide-react";

interface TemperatureStatsProps {
  stats: StatsType | null | undefined;
  range: string;
}

export function TemperatureStats({ stats, range }: TemperatureStatsProps) {
  const min = stats?.min !== null && stats?.min !== undefined ? `${stats.min.toFixed(1)}°C` : "--";
  const max = stats?.max !== null && stats?.max !== undefined ? `${stats.max.toFixed(1)}°C` : "--";
  const avg = stats?.avg !== null && stats?.avg !== undefined ? `${stats.avg.toFixed(1)}°C` : "--";
  const count = stats?.count ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Min Temperature */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Minimum</span>
          <ArrowDown className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-2xl font-semibold tracking-tight font-mono text-foreground">
          {min}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Lowest in {range}
        </div>
      </div>

      {/* Average Temperature */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Average</span>
          <Activity className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-semibold tracking-tight font-mono text-foreground">
          {avg}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Mean over {range}
        </div>
      </div>

      {/* Max Temperature */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Maximum</span>
          <ArrowUp className="h-4 w-4 text-rose-500" />
        </div>
        <div className="text-2xl font-semibold tracking-tight font-mono text-foreground">
          {max}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Highest in {range}
        </div>
      </div>

      {/* Sample Count */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Readings</span>
          <BarChart2 className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-semibold tracking-tight font-mono text-foreground">
          {count.toLocaleString()}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Data points in {range}
        </div>
      </div>
    </div>
  );
}
