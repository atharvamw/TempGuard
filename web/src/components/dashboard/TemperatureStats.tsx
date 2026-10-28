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

  const rangeLabels: Record<string, string> = {
    "1h": "last hour",
    "24h": "last 24 hours",
    "7d": "last 7 days",
  };
  const readableRange = rangeLabels[range] || range;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Min Temperature */}
      <div className="p-5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/15 shadow-sm space-y-2 hover:border-border transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-mono uppercase tracking-wider">Minimum</span>
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight font-mono text-foreground tabular-nums">
          {min}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Lowest in {readableRange}
        </div>
      </div>

      {/* Average Temperature */}
      <div className="p-5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/15 shadow-sm space-y-2 hover:border-border transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-mono uppercase tracking-wider">Average</span>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
            <Activity className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight font-mono text-foreground tabular-nums">
          {avg}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Mean over {readableRange}
        </div>
      </div>

      {/* Max Temperature */}
      <div className="p-5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/15 shadow-sm space-y-2 hover:border-border transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-mono uppercase tracking-wider">Maximum</span>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500">
            <ArrowUp className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight font-mono text-foreground tabular-nums">
          {max}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Highest in {readableRange}
        </div>
      </div>

      {/* Sample Count */}
      <div className="p-5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/15 shadow-sm space-y-2 hover:border-border transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-mono uppercase tracking-wider">Readings</span>
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight font-mono text-foreground tabular-nums">
          {count.toLocaleString()}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Telemetry points stored
        </div>
      </div>
    </div>
  );
}
