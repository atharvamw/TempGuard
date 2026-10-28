"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Check, AlertCircle, RefreshCw } from "lucide-react";

interface ThresholdSettingsProps {
  initialMin?: number | null;
  initialMax?: number | null;
  onSave: (min: number, max: number) => Promise<{ success: boolean; error?: string }>;
}

export function ThresholdSettings({
  initialMin = 18,
  initialMax = 28,
  onSave,
}: ThresholdSettingsProps) {
  const [minVal, setMinVal] = useState<string>(initialMin?.toString() ?? "18");
  const [maxVal, setMaxVal] = useState<string>(initialMax?.toString() ?? "28");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync with prop updates
  useEffect(() => {
    if (initialMin !== null && initialMin !== undefined) setMinVal(initialMin.toString());
    if (initialMax !== null && initialMax !== undefined) setMaxVal(initialMax.toString());
  }, [initialMin, initialMax]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const minNum = parseFloat(minVal);
    const maxNum = parseFloat(maxVal);

    if (Number.isNaN(minNum) || Number.isNaN(maxNum)) {
      setStatusMessage({ type: "error", text: "Please enter valid numeric temperatures." });
      return;
    }

    if (minNum >= maxNum) {
      setStatusMessage({ type: "error", text: "Minimum threshold must be strictly less than maximum." });
      return;
    }

    if (minNum < -50 || maxNum > 100) {
      setStatusMessage({ type: "error", text: "Thresholds must be within -50°C and 100°C." });
      return;
    }

    setIsSaving(true);
    const result = await onSave(minNum, maxNum);
    setIsSaving(false);

    if (result.success) {
      setStatusMessage({ type: "success", text: "Thresholds successfully saved." });
      setTimeout(() => {
        setStatusMessage(null);
      }, 3500);
    } else {
      setStatusMessage({ type: "error", text: result.error || "Failed to update thresholds." });
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Temperature Thresholds
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {isOpen ? "Close Settings" : "Configure Thresholds"}
        </button>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-4">
        <div>
          Low alert: <span className="font-mono font-medium text-foreground">{minVal}°C</span>
        </div>
        <span className="text-border">&bull;</span>
        <div>
          High alert: <span className="font-mono font-medium text-foreground">{maxVal}°C</span>
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="pt-4 border-t border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minTemp"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Minimum Threshold (°C)
              </label>
              <input
                id="minTemp"
                type="number"
                step="0.5"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 18.0"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Triggers an alert if temperature drops below this value.
              </p>
            </div>

            <div>
              <label
                htmlFor="maxTemp"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Maximum Threshold (°C)
              </label>
              <input
                id="maxTemp"
                type="number"
                step="0.5"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 28.0"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Triggers an alert if temperature exceeds this value.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
              Save Thresholds
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
