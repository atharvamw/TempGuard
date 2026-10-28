import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric temperature in Celsius to one decimal place.
 */
export function formatTemperature(temp: number | null | undefined): string {
  if (temp === null || temp === undefined || Number.isNaN(temp)) {
    return "--";
  }
  return `${temp.toFixed(1)}°C`;
}

/**
 * Formats a Date/timestamp into human-readable local time or relative time.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "Never";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString();
  } catch {
    return "Invalid date";
  }
}
