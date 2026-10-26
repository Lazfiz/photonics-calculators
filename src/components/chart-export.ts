/**
 * Chart downloads, loaded on the first click (`import("./chart-export")`) so they stay out of the pages' initial JS.
 * Browser-only: call from event handlers.
 */

import type { LegendItem } from "./chart-legend";

const BACKGROUND = "#111827"; // gray-900, the chart cards' background
const TEXT = "#d1d5db";
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
/** PNG pixels per CSS px: sharp on high-density screens and in documents. */
const SCALE = 2;

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV text as a UTF-8 file with a BOM, so spreadsheet programs read µ, λ and ° correctly. */
export function downloadCsv(csv: string, fileName: string) {
  save(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }), fileName);
}

/** Legend rows as the HTML legend wraps them: [item, x] per row, within `width` px. */
function legendRows(ctx: CanvasRenderingContext2D, items: readonly LegendItem[], width: number) {
  const rows: { item: LegendItem; x: number }[][] = [];
  let row: { item: LegendItem; x: number }[] = [];
  let x = 0;
  for (const item of items) {
    const w = 26 + ctx.measureText(item.name).width;
    if (row.length > 0 && x + w > width) { rows.push(row); row = []; x = 0; }
    row.push({ item, x });
    x += w + 16;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/**
 * The chart's SVG as a PNG on the dark card background, with the title above and the legend below (the legend is
 * HTML on the page, so it's drawn here). `svg` is the chart's own `<svg>`; elements marked `data-export="skip"` (the
 * hover crosshair) are left out.
 */
export async function downloadPng(svg: SVGSVGElement, { fileName, title, legend }: { fileName: string; title?: string; legend: readonly LegendItem[] }) {
  const { width: w, height: h } = svg.viewBox.baseVal;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('[data-export="skip"]').forEach((el) => el.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.setAttribute("font-family", FONT);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("chart SVG failed to load as an image"));
      img.src = url;
    });

    const pad = 16;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = `12px ${FONT}`;
    const rows = legendRows(ctx, legend, w);
    const titleH = title ? 28 : 0;
    const legendH = rows.length > 0 ? 12 + rows.length * 20 : 0;
    canvas.width = (w + 2 * pad) * SCALE;
    canvas.height = (pad + titleH + h + legendH + pad) * SCALE;

    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w + 2 * pad, canvas.height / SCALE);
    ctx.textBaseline = "middle";
    if (title) {
      ctx.font = `600 15px ${FONT}`;
      ctx.fillStyle = TEXT;
      ctx.fillText(title, pad, pad + 10);
    }
    ctx.drawImage(img, pad, pad + titleH, w, h);

    ctx.font = `12px ${FONT}`;
    rows.forEach((row, r) => {
      const y = pad + titleH + h + 12 + r * 20 + 10;
      for (const { item, x } of row) {
        const x0 = pad + x;
        ctx.fillStyle = item.color;
        ctx.strokeStyle = item.color;
        if (item.kind === "line") {
          ctx.lineWidth = 2.5;
          ctx.setLineDash(item.dash ? item.dash.split(/[ ,]+/).map(Number) : []);
          ctx.beginPath();
          ctx.moveTo(x0 + 1, y);
          ctx.lineTo(x0 + 19, y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (item.kind === "marker") {
          ctx.beginPath();
          ctx.arc(x0 + 10, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.fillRect(x0 + 5, y - 5, 10, 10);
        }
        ctx.fillStyle = TEXT;
        ctx.fillText(item.name, x0 + 26, y);
      }
    });

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (png) save(png, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
}
