"use client";

import { useEffect, useRef } from "react";

/** An N×N RGBA image (row 0 at the top) drawn on a canvas and scaled with CSS. */
export default function RgbaCanvas({ rgba, size, label, stale }: { rgba: Uint8ClampedArray; size: number; label: string; stale?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(size, size);
    image.data.set(rgba);
    ctx.putImageData(image, 0, 0);
  }, [rgba, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`w-full max-w-[360px] aspect-square rounded-lg border border-gray-800 bg-gray-950 ${stale ? "opacity-60" : ""}`}
    />
  );
}
