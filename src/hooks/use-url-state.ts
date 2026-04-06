"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * URL-synced state for calculator inputs.
 *
 * - Reads initial value from URL search params on mount
 * - Writes to URL on change (defaults omitted for clean URLs)
 * - Multiple calls batch into a single router.replace via microtask
 *
 * Usage: const [wavelength, setWavelength] = useURLState("wavelength", 532);
 */

// Module-level shared state for batching across hook instances
let sharedParams: URLSearchParams | null = null;
let sharedPathname = "";
let sharedRouter: ReturnType<typeof useRouter> | null = null;
let flushScheduled = false;

function flush() {
  if (flushScheduled || !sharedRouter || !sharedParams) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    try {
      const qs = sharedParams!.toString();
      sharedRouter!.replace(qs ? `${sharedPathname}?${qs}` : sharedPathname, { scroll: false });
    } catch {
      // router not ready during SSR
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
  const r = useRouter();
  const p = usePathname();
  const [value, setValue] = useState(defaultValue);
  const didInit = useRef(false);

  // Reset shared state on navigation
  if (sharedPathname !== p) {
    sharedPathname = p;
    sharedRouter = r;
    if (typeof window !== "undefined") {
      sharedParams = new URLSearchParams(window.location.search);
    }
    flushScheduled = false;
  }

  // Read URL on mount (client-only, avoids hydration mismatch)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (typeof window === "undefined") return;
    if (!sharedParams) sharedParams = new URLSearchParams(window.location.search);
    const raw = sharedParams.get(key);
    if (raw !== null) {
      if (typeof defaultValue === "number") {
        const n = Number(raw);
        if (!isNaN(n)) setValue(n as T);
      } else {
        setValue(raw as T);
      }
    }
  }, [key, defaultValue]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (typeof window !== "undefined") {
          if (!sharedParams) sharedParams = new URLSearchParams(window.location.search);
          if (val === defaultValue) sharedParams.delete(key);
          else sharedParams.set(key, String(val));
          flush();
        }
        return val;
      });
    },
    [key, defaultValue]
  );

  return [value, update];
}
