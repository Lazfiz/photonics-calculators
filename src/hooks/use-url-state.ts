"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * URL-synced state for calculator inputs.
 *
 * Uses window.history.replaceState (not router.replace) to avoid
 * triggering Next.js re-renders on URL changes.
 *
 * - Reads initial value from URL search params on mount
 * - Writes to URL on change (defaults omitted for clean URLs)
 * - Multiple calls batch into a single replaceState via microtask
 *
 * Usage: const [wavelength, setWavelength] = useURLState("wavelength", 532);
 */

let batchedParams: URLSearchParams | null = null;
let batchScheduled = false;

function scheduleFlush() {
  if (batchScheduled) return;
  batchScheduled = true;
  queueMicrotask(() => {
    batchScheduled = false;
    if (typeof window === "undefined" || !batchedParams) return;
    try {
      const qs = batchedParams.toString();
      const url = qs
        ? window.location.pathname + "?" + qs
        : window.location.pathname;
      window.history.replaceState(null, "", url);
    } catch {
      // ignore
    }
  });
}

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
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    if (typeof defaultValue === "number") {
      const n = Number(raw);
      return isNaN(n) ? defaultValue : (n as T);
    }
    return raw as T;
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const val =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (typeof window !== "undefined") {
          if (!batchedParams)
            batchedParams = new URLSearchParams(window.location.search);
          if (val === defaultValue) batchedParams.delete(key);
          else batchedParams.set(key, String(val));
          scheduleFlush();
        }
        return val;
      });
    },
    [key, defaultValue]
  );

  return [value, update];
}
