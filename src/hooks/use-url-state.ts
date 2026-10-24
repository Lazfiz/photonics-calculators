"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { parseParam, readParam, subscribe, writeParam, type ParamRange } from "@/lib/url-state-store";

/**
 * Number or string state mirrored to the URL query, so shared links reproduce the inputs.
 *
 * - Prerender and hydration use the default; the URL value is applied right after hydration.
 * - Writes go to the URL batched (100 ms) without a Next.js navigation. Setting the default removes
 *   the param. See `src/lib/url-state-store.ts`.
 * - A param that doesn't parse (or isn't finite, for numbers) falls back to the default. A number
 *   outside `range` (pass the field's own min/max) is clamped to it; tighter physics domains stay
 *   the caller's job.
 *
 * Usage: const [wavelength, setWavelength] = useURLState("wavelength", 532, { min: 200, max: 2000 });
 */
export function useURLState(
  key: string,
  defaultValue: number,
  range?: ParamRange
): [number, (value: number | ((prev: number) => number)) => void];
export function useURLState(
  key: string,
  defaultValue: string
): [string, (value: string | ((prev: string) => string)) => void];
export function useURLState<T extends number | string>(
  key: string,
  defaultValue: T,
  range?: ParamRange
): [T, (value: T | ((prev: T) => T)) => void] {
  const pathname = usePathname();
  // Primitives, so a range literal written inline doesn't change the setter on every render.
  const min = range?.min;
  const max = range?.max;

  const value = useSyncExternalStore(
    subscribe,
    () => parseParam(readParam(pathname, key), defaultValue, { min, max }),
    () => defaultValue
  );

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parseParam(readParam(pathname, key), defaultValue, { min, max });
      const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeParam(pathname, key, String(val), String(defaultValue));
    },
    [pathname, key, defaultValue, min, max]
  );

  return [value, update];
}
