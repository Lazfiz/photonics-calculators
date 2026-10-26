"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An element's width in whole px, kept current with a ResizeObserver. Null on the server and until the first
 * observation, so the server render and the hydration render match; the charts lay out at this width, 1 SVG unit
 * = 1 px, so their text renders at its nominal size on any screen. Attach `ref` to an element without padding.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
