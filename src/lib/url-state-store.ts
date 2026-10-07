/**
 * Page-level store behind `useURLState`. The query string is the source of truth, plus an overlay
 * of writes that haven't been flushed to the URL yet.
 *
 * - Writes are batched with a 100 ms debounce: browsers throttle History API calls, and a slider
 *   drag fires dozens of changes.
 * - A value equal to its default removes the param, so a reset leaves a clean link. Other params
 *   (utm_*, …) are kept.
 * - The URL is written with the unpatched `History.prototype.replaceState`, which bypasses Next.js's
 *   router (no re-render, no navigation).
 *
 * `window` is only read inside functions, so the module is safe to import during prerendering.
 */

const FLUSH_DELAY_MS = 100;

/** Writes not yet in the URL, for page `pendingPath`. `null` means "delete the param". */
const pending = new Map<string, string | null>();
let pendingPath: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

let cachedSearch: string | null = null;
let cachedParams = new URLSearchParams();

/** Parses a raw query value. Anything that isn't valid for the default's type gives the default. */
export function parseParam<T extends number | string>(
  raw: string | null | undefined,
  defaultValue: T
): T {
  if (raw == null) return defaultValue;
  if (typeof defaultValue !== "number") return raw as T;
  if (raw.trim() === "") return defaultValue;
  const n = Number(raw);
  return (Number.isFinite(n) ? n : defaultValue) as T;
}

/** Applies writes to a query string (`null` deletes the param). Returns the query without "?". */
export function applyParamWrites(
  search: string,
  writes: ReadonlyMap<string, string | null>
): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of writes) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  return params.toString();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function currentParams(): URLSearchParams {
  const search = window.location.search;
  if (search !== cachedSearch) {
    cachedSearch = search;
    cachedParams = new URLSearchParams(search);
  }
  return cachedParams;
}

/**
 * Raw value of `key` on page `pathname`, or `null` when it's unset. During a client-side navigation
 * the next page renders while the browser still shows the previous URL; it gets `null`, not the
 * previous page's value.
 */
export function readParam(pathname: string, key: string): string | null {
  if (window.location.pathname !== pathname) return null;
  if (pendingPath === pathname && pending.has(key)) return pending.get(key) ?? null;
  return currentParams().get(key);
}

/**
 * The query string (without "?") of page `pathname` as a shared link should carry it: the URL plus
 * unflushed writes. Empty when there are no params, or when the browser shows another page.
 */
export function currentQuery(pathname: string): string {
  if (window.location.pathname !== pathname) return "";
  if (pendingPath !== pathname) return currentParams().toString();
  return applyParamWrites(window.location.search, pending);
}

export function writeParam(
  pathname: string,
  key: string,
  value: string,
  defaultValue: string
): void {
  if (pendingPath !== pathname) {
    pending.clear();
    pendingPath = pathname;
  }
  pending.set(key, value === defaultValue ? null : value);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  for (const listener of listeners) listener();
}

function flush(): void {
  flushTimer = null;
  try {
    // If the user navigated away first, drop the writes: they belong to the previous page.
    if (pendingPath !== null && window.location.pathname === pendingPath) {
      const qs = applyParamWrites(window.location.search, pending);
      const url = `${pendingPath}${qs ? `?${qs}` : ""}${window.location.hash}`;
      const state: unknown = window.history.state;
      if (typeof History !== "undefined") {
        History.prototype.replaceState.call(window.history, state, "", url);
      } else {
        window.history.replaceState(state, "", url);
      }
    }
    pending.clear();
    pendingPath = null;
  } catch {
    // URL sync is best-effort (e.g. Safari throws when it throttles History calls). Keep the
    // overlay so the inputs keep their values; the next write retries.
  }
}
