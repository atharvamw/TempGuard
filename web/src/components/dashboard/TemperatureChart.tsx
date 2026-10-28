"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { SerializedTemperatureReading, HistoryRange } from "@/types/telemetry";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp } from "lucide-react";

interface TemperatureChartProps {
  readings: SerializedTemperatureReading[];
  range: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  isRefreshing?: boolean;
}

export function TemperatureChart({
  readings,
  range,
  onRangeChange,
  minThreshold,
  maxThreshold,
  isRefreshing = false,
}: TemperatureChartProps) {
  // Format chart data for Recharts
  const chartData = useMemo(() => {
    return readings.map((r) => {
      const date = new Date(r.receivedAt);
      return {
        timestamp: date.getTime(),
        temperature: r.temperatureC,
        formattedTime:
          range === "7d"
            ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: range === "1h" ? "2-digit" : undefined }),
        fullDate: date.toLocaleString(),
      };
    });
  }, [readings, range]);

  // Compute nice Y-axis domain bounded by data & thresholds
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [15, 35];
    const temps = chartData.map((d) => d.temperature);
    if (minThreshold !== undefined && minThreshold !== null) temps.push(minThreshold);
    if (maxThreshold !== undefined && maxThreshold !== null) temps.push(maxThreshold);

    const min = Math.floor(Math.min(...temps)) - 2;
    const max = Math.ceil(Math.max(...temps)) + 2;
    return [min, max];
  }, [chartData, minThreshold, maxThreshold]);

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/20 shadow-sm space-y-6">
      {/* Chart Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Historical Temperature Trends
            </h3>
            <p className="text-xs text-muted-foreground">
              Dynamic time-series telemetry in degrees Celsius (°C)
            </p>
          </div>
        </div>

        {/* Range Selector Pill Group */}
        <div className="inline-flex items-center rounded-lg border border-border/80 p-1 bg-secondary/60 text-xs self-start sm:self-auto">
          {(["1h", "24h", "7d"] as HistoryRange[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "px-3.5 py-1.5 rounded-md font-medium transition-all cursor-pointer",
                range === r
                  ? "bg-card text-foreground shadow-xs font-semibold border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === "1h" ? "Last Hour" : r === "24h" ? "24 Hours" : "7 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xl p-8 text-center space-y-2.5">
          <Calendar className="h-8 w-8 text-muted-foreground/50" />
          <div className="text-sm font-medium text-foreground">
            No historical measurements recorded yet
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Telemetry data points will appear continuously on this graph as the ESP32 posts readings.
          </p>
        </div>
      ) : (
        <div className={cn("h-72 w-full transition-opacity", isRefreshing && "opacity-85")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#107c6f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#107c6f" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.4}
              />

              <XAxis
                dataKey="formattedTime"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={35}
              />

              <YAxis
                domain={yDomain}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="°"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg text-xs space-y-1.5 backdrop-blur-md">
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {dataPoint.fullDate}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <span className="font-mono font-bold text-base text-foreground tabular-nums">
                            {dataPoint.temperature.toFixed(2)} °C
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Threshold reference lines if configured */}
              {maxThreshold !== undefined && maxThreshold !== null && (
                <ReferenceLine
                  y={maxThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: `Max Limit (${maxThreshold}°C)`,
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
              )}

              {minThreshold !== undefined && minThreshold !== null && (
                <ReferenceLine
                  y={minThreshold}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: `Min Limit (${minThreshold}°C)`,
                    fill: "#3b82f6",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#107c6f"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
                activeDot={{ r: 6, fill: "#107c6f", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
