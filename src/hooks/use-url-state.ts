"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { parseParam, readParam, subscribe, writeParam } from "@/lib/url-state-store";

/**
 * Number or string state mirrored to the URL query, so shared links reproduce the inputs.
 *
 * - Prerender and hydration use the default; the URL value is applied right after hydration.
 * - Writes go to the URL batched (100 ms) without a Next.js navigation. Setting the default removes
 *   the param. See `src/lib/url-state-store.ts`.
 * - A param that doesn't parse (or isn't finite, for numbers) falls back to the default. Range
 *   checks are the caller's job.
 *
 * Usage: const [wavelength, setWavelength] = useURLState("wavelength", 532);
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
  const pathname = usePathname();

  const value = useSyncExternalStore(
    subscribe,
    () => parseParam(readParam(pathname, key), defaultValue),
    () => defaultValue
  );

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parseParam(readParam(pathname, key), defaultValue);
      const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeParam(pathname, key, String(val), String(defaultValue));
    },
    [pathname, key, defaultValue]
  );

  return [value, update];
}
