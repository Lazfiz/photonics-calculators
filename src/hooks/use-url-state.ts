"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * URL-synced state that bypasses Next.js's history patching.
 *
 * - Reads from URL on mount (shared links work)
 * - Writes to URL on blur (not every keystroke — no re-render loops)
 * - Uses History.prototype.replaceState.call() to bypass Next.js interception
 * - Falls back gracefully if anything fails
 *
 * Usage: const [wavelength, setWavelength] = useURLState("wavelength", 532);
 */

// Store reference to original (unpatched) replaceState before Next.js patches it.
// Guard for SSR — History doesn't exist during prerendering.
const nativeReplaceState =
  typeof History !== "undefined"
    ? History.prototype.replaceState.bind(history)
    : null;

// Batched URL writes — multiple state changes in one frame = one URL update
let pendingWrites: Record<string, string> = {};
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleURLWrite(key: string, value: string, defaultValue: string) {
  if (value === defaultValue) {
    delete pendingWrites[key];
  } else {
    pendingWrites[key] = value;
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      const params = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(pendingWrites)) {
        params.set(k, v);
      }
      // Remove keys that were reset to default
      const allKeys = Object.keys(pendingWrites);
      for (const k of allKeys) {
        if (!(k in pendingWrites)) {
          params.delete(k);
        }
      }
      pendingWrites = {};
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      // Use native replaceState — bypasses Next.js's patched version
      if (nativeReplaceState) {
        nativeReplaceState(window.history.state, "", url);
      } else {
        window.history.replaceState(window.history.state, "", url);
      }
    } catch {
      // silently fail — URL sync is best-effort
    }
  }, 100); // 100ms debounce — fast enough to feel instant, slow enough to batch
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
  const [value, setValue] = useState<T>(defaultValue);

  // Read from URL on mount only (for shared links)
  const didRead = useRef(false);
  useEffect(() => {
    if (didRead.current) return;
    didRead.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get(key);
      if (raw === null) return;
      if (typeof defaultValue === "number") {
        const n = Number(raw);
        if (!isNaN(n)) setValue(n as T);
      } else {
        setValue(raw as T);
      }
    } catch {
      // ignore
    }
  }, [key, defaultValue]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const val =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        scheduleURLWrite(key, String(val), String(defaultValue));
        return val;
      });
    },
    [key, defaultValue]
  );

  return [value, update];
}
