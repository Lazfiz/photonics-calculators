"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * URL-aware state: reads from URL on mount, writes on explicit share.
 * Does NOT update URL on every change (avoids Next.js re-render loop).
 *
 * Usage:
 *   const [wl, setWl] = useURLState("wavelength", 532);
 *   // setWl(1064) → updates state only, no URL change
 *   // On mount: reads ?wavelength=1064 from URL if present
 */

export function useURLState(
  key: string,
  defaultValue: number
): [number, (value: number | ((prev: number) => number)) => void];
export function useURLState(
  key: string,
  defaultValue: string
): [string, (value: string | ((prev: string) => string)) => void];
export function useURLState<T extends number | string>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Read URL params once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return;
    if (typeof defaultValue === "number") {
      const n = Number(raw);
      if (!isNaN(n)) setValue(n as T);
    } else {
      setValue(raw as T);
    }
  }, [key, defaultValue]);

  return [value, setValue];
}

/**
 * Get current state as URL params string (for share button).
 * Call this from a click handler — reads all input values and builds a URL.
 *
 * Usage:
 *   const wl = ...; const power = ...; const dia = ...;
 *   const url = buildShareURL({ wavelength: wl, power, beamDia: dia });
 *   navigator.clipboard.writeText(url);
 */
export function buildShareURL(params: Record<string, number | string>): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = "";
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}
