"use client";

import { useId } from "react";

type Point = { x: number; y: number | null };
type Series = {
  name: string;
  color: string;
  points: Point[];
  dashed?: boolean;
  showPoints?: boolean;
};

type AxisScale = "linear" | "log";

function safeLog10(v: number) {
  return Math.log10(Math.max(v, 1e-12));
}

function toScaled(value: number, scale: AxisScale) {
  return scale === "log" ? safeLog10(value) : value;
}

function fmt(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1000 || Math.abs(v) < 0.01) return v.toExponential(2);
  return v.toFixed(2);
}

export default function SimpleLineChart({
  title,
  xLabel,
  yLabel,
  series,
  xScale = "linear",
  yScale = "linear",
  height = 320,
}: {
  title?: string;
  xLabel: string;
  yLabel: string;
  series: Series[];
  xScale?: AxisScale;
  yScale?: AxisScale;
  height?: number;
}) {
  const id = useId();
  const width = 900;
  const margin = { top: 24, right: 24, bottom: 56, left: 72 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allPoints = series.flatMap((s) => s.points).filter((p): p is { x: number; y: number } => p.y !== null && Number.isFinite(p.x) && Number.isFinite(p.y));
  const xVals = allPoints.map((p) => toScaled(p.x, xScale));
  const yVals = allPoints.map((p) => toScaled(p.y, yScale));

  const xMin = Math.min(...xVals);
  const xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);

  const xAt = (x: number) => margin.left + ((toScaled(x, xScale) - xMin) / Math.max(xMax - xMin, 1e-12)) * innerW;
  const yAt = (y: number) => margin.top + innerH - ((toScaled(y, yScale) - yMin) / Math.max(yMax - yMin, 1e-12)) * innerH;

  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (i / 4) * (xMax - xMin)).map((v) => (xScale === "log" ? Math.pow(10, v) : v));
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin)).map((v) => (yScale === "log" ? Math.pow(10, v) : v));

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
      {title && <p className="mb-3 text-sm font-medium text-gray-200">{title}</p>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" role="img" aria-label={title || `${yLabel} versus ${xLabel}`}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={margin.left} y={margin.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={margin.left} x2={width - margin.right} y1={yAt(tick)} y2={yAt(tick)} stroke="#374151" strokeWidth="1" />
            <text x={margin.left - 10} y={yAt(tick) + 4} textAnchor="end" fill="#9ca3af" fontSize="12">{fmt(tick)}</text>
          </g>
        ))}
        {xTicks.map((tick, i) => (
          <g key={`x-${i}`}>
            <line x1={xAt(tick)} x2={xAt(tick)} y1={margin.top} y2={height - margin.bottom} stroke="#374151" strokeWidth="1" />
            <text x={xAt(tick)} y={height - margin.bottom + 18} textAnchor="middle" fill="#9ca3af" fontSize="12">{fmt(tick)}</text>
          </g>
        ))}

        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#9ca3af" />
        <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#9ca3af" />

        <g clipPath={`url(#${id}-clip)`}>
          {series.map((s) => {
            const pts = s.points.filter((p): p is { x: number; y: number } => p.y !== null && Number.isFinite(p.x) && Number.isFinite(p.y));
            const d = pts
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xAt(p.x)} ${yAt(p.y)}`)
              .join(" ");
            return (
              <g key={s.name}>
                {pts.length >= 2 && <path d={d} fill="none" stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed ? "8 6" : undefined} />}
                {(s.showPoints || pts.length === 1) && pts.map((p, idx) => <circle key={idx} cx={xAt(p.x)} cy={yAt(p.y)} r="4.5" fill={s.color} />)}
              </g>
            );
          })}
        </g>

        <text x={width / 2} y={height - 12} textAnchor="middle" fill="#cbd5e1" fontSize="13">{xLabel}</text>
        <text x={18} y={height / 2} textAnchor="middle" fill="#cbd5e1" fontSize="13" transform={`rotate(-90 18 ${height / 2})`}>{yLabel}</text>
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-300">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
