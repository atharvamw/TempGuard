"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { SerializedTemperatureReading, HistoryRange } from "@/types/telemetry";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

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
    if (chartData.length === 0) return [10, 35];
    const temps = chartData.map((d) => d.temperature);
    if (minThreshold !== undefined && minThreshold !== null) temps.push(minThreshold);
    if (maxThreshold !== undefined && maxThreshold !== null) temps.push(maxThreshold);

    const min = Math.floor(Math.min(...temps)) - 2;
    const max = Math.ceil(Math.max(...temps)) + 2;
    return [min, max];
  }, [chartData, minThreshold, maxThreshold]);

  return (
    <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm space-y-6">
      {/* Chart Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Historical Temperature
          </h3>
          <p className="text-xs text-muted-foreground">
            Measured in degrees Celsius (°C)
          </p>
        </div>

        {/* Range Selector Pill Group */}
        <div className="inline-flex items-center rounded-lg border border-border p-1 bg-secondary/50 text-xs">
          {(["1h", "24h", "7d"] as HistoryRange[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "px-3 py-1 rounded-md font-medium transition-colors",
                range === r
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-8 text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground/60" />
          <div className="text-sm font-medium text-foreground">
            No historical measurements for this period
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Telemetry data points will appear continuously on this graph as the ESP32 posts readings.
          </p>
        </div>
      ) : (
        <div className={cn("h-72 w-full transition-opacity", isRefreshing && "opacity-80")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.6}
              />

              <XAxis
                dataKey="formattedTime"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
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
                      <div className="p-3 rounded-lg border border-border bg-popover text-popover-foreground shadow-md text-xs space-y-1">
                        <div className="text-muted-foreground">{dataPoint.fullDate}</div>
                        <div className="font-mono font-semibold text-sm text-primary">
                          {dataPoint.temperature.toFixed(1)} °C
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Threshold indicator lines if configured */}
              {maxThreshold !== undefined && maxThreshold !== null && (
                <ReferenceLine
                  y={maxThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: `Max ${maxThreshold}°C`,
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
                    value: `Min ${minThreshold}°C`,
                    fill: "#3b82f6",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#107c6f"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#107c6f", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
