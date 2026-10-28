"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LatestReadingData,
  HistoryResponseData,
  HistoryRange,
} from "@/types/telemetry";

const POLL_INTERVAL_MS = 10_000;

interface TelemetryState {
  latest: LatestReadingData | null;
  history: HistoryResponseData | null;
  selectedRange: HistoryRange;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastSuccessAt: Date | null;
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
  });

  const isRequestInFlight = useRef(false);
  const selectedRangeRef = useRef<HistoryRange>("24h");
  selectedRangeRef.current = state.selectedRange;

  /**
   * Fetches the latest reading and history in parallel.
   */
  const fetchData = useCallback(
    async (isBackgroundRefresh = false) => {
      // Prevent overlapping requests
      if (isRequestInFlight.current) {
        return;
      }

      isRequestInFlight.current = true;
      if (isBackgroundRefresh) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        const currentRange = selectedRangeRef.current;
        const [latestRes, historyRes] = await Promise.all([
          fetch(`/api/telemetry/latest?deviceId=${encodeURIComponent(deviceId)}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/telemetry/history?deviceId=${encodeURIComponent(deviceId)}&range=${currentRange}`,
            { cache: "no-store" }
          ),
        ]);

        if (!latestRes.ok && !historyRes.ok) {
          throw new Error("Failed to communicate with temperature telemetry service.");
        }

        const latestJson = latestRes.ok ? await latestRes.json() : null;
        const historyJson = historyRes.ok ? await historyRes.json() : null;

        setState((prev) => ({
          ...prev,
          latest: latestJson ? latestJson.data : prev.latest,
          history: historyJson ? historyJson.data : prev.history,
          isLoading: false,
          isRefreshing: false,
          error: null,
          lastSuccessAt: new Date(),
        }));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Temporary telemetry connection issue";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          // Preserve previously fetched data and only display a non-intrusive error notice
          error: errMsg,
        }));
      } finally {
        isRequestInFlight.current = false;
      }
    },
    [deviceId]
  );

  /**
   * Update time range for historical charts
   */
  const setRange = useCallback(
    (range: HistoryRange) => {
      selectedRangeRef.current = range;
      setState((prev) => ({ ...prev, selectedRange: range, isRefreshing: true }));
      // Fetch immediately for the new range
      fetch(
        `/api/telemetry/history?deviceId=${encodeURIComponent(deviceId)}&range=${range}`,
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
   * Updates threshold settings on the server
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
          throw new Error(json.error?.message || "Failed to update settings");
        }

        // Refresh latest to re-evaluate threshold violation
        fetchData(true);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update thresholds";
        return { success: false, error: message };
      }
    },
    [deviceId, fetchData]
  );

  // Set up polling with document visibility awareness
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
        // Immediately fetch fresh data when user tabs back, then resume polling
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
