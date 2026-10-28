"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LatestReadingData,
  HistoryResponseData,
  HistoryRange,
} from "@/types/telemetry";

// Fast polling interval: every 3 seconds for near-instant updates
const POLL_INTERVAL_MS = 3_000;

interface TelemetryState {
  latest: LatestReadingData | null;
  history: HistoryResponseData | null;
  selectedRange: HistoryRange;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastSuccessAt: Date | null;
  secondsSinceLastFetch: number;
}

export function useTelemetry(deviceId: string = "thermoguard-01") {
  const [state, setState] = useState<TelemetryState>({
    latest: null,
    history: null,
    selectedRange: "24h",
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastSuccessAt: null,
    secondsSinceLastFetch: 0,
  });

  const isRequestInFlight = useRef(false);
  const selectedRangeRef = useRef<HistoryRange>("24h");
  selectedRangeRef.current = state.selectedRange;

  /**
   * Fetches latest reading and history in parallel with cache-busting.
   */
  const fetchData = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isRequestInFlight.current) {
        return;
      }

      isRequestInFlight.current = true;
      if (isBackgroundRefresh) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      // 8-second timeout so slow networks never freeze the polling cycle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const currentRange = selectedRangeRef.current;
        const cacheBuster = Date.now();

        const [latestRes, historyRes] = await Promise.all([
          fetch(
            `/api/telemetry/latest?deviceId=${encodeURIComponent(deviceId)}&_t=${cacheBuster}`,
            {
              cache: "no-store",
              headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
              signal: controller.signal,
            }
          ),
          fetch(
            `/api/telemetry/history?deviceId=${encodeURIComponent(deviceId)}&range=${currentRange}&_t=${cacheBuster}`,
            {
              cache: "no-store",
              headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
              signal: controller.signal,
            }
          ),
        ]);

        clearTimeout(timeoutId);

        let latestData = null;
        let historyData = null;

        if (latestRes.ok) {
          const latestJson = await latestRes.json();
          latestData = latestJson.data;
        }

        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          historyData = historyJson.data;
        }

        if (!latestRes.ok && !historyRes.ok) {
          throw new Error("Unable to sync telemetry data right now.");
        }

        setState((prev) => ({
          ...prev,
          latest: latestData ?? prev.latest,
          history: historyData ?? prev.history,
          isLoading: false,
          isRefreshing: false,
          error: null,
          lastSuccessAt: new Date(),
          secondsSinceLastFetch: 0,
        }));
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMsg =
          err instanceof Error && err.name === "AbortError"
            ? "Sync timed out"
            : err instanceof Error
            ? err.message
            : "Temporary sync issue";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: errMsg,
        }));
      } finally {
        isRequestInFlight.current = false;
      }
    },
    [deviceId]
  );

  /**
   * Switch chart time range
   */
  const setRange = useCallback(
    (range: HistoryRange) => {
      selectedRangeRef.current = range;
      setState((prev) => ({ ...prev, selectedRange: range, isRefreshing: true }));

      const cacheBuster = Date.now();
      fetch(
        `/api/telemetry/history?deviceId=${encodeURIComponent(deviceId)}&range=${range}&_t=${cacheBuster}`,
        { cache: "no-store" }
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.data) {
            setState((prev) => ({
              ...prev,
              history: json.data,
              isRefreshing: false,
            }));
          }
        })
        .catch(() => {
          setState((prev) => ({ ...prev, isRefreshing: false }));
        });
    },
    [deviceId]
  );

  /**
   * Update device threshold settings
   */
  const updateThresholds = useCallback(
    async (minTemperatureC: number, maxTemperatureC: number) => {
      try {
        const res = await fetch(`/api/settings?deviceId=${encodeURIComponent(deviceId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minTemperatureC, maxTemperatureC }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to update thresholds");
        }

        // Trigger immediate fetch to apply changes
        fetchData(true);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update thresholds";
        return { success: false, error: message };
      }
    },
    [deviceId, fetchData]
  );

  // 1-second live ticker for smooth client timestamp counting
  useEffect(() => {
    const ticker = setInterval(() => {
      setState((prev) => ({
        ...prev,
        secondsSinceLastFetch: prev.secondsSinceLastFetch + 1,
      }));
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Main automatic polling effect
  useEffect(() => {
    // Initial fetch
    fetchData(false);

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          fetchData(true);
        }, POLL_INTERVAL_MS);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediate sync upon returning to tab
        fetchData(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  return {
    ...state,
    setRange,
    updateThresholds,
    refetch: () => fetchData(true),
  };
}
