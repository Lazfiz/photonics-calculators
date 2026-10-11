"use client";

import { useId } from "react";

const SIZE = 160;
const C = SIZE / 2;
const R = 56;

/** Point at azimuth ψ (counter-clockwise from +x on the page); SVG y points down. */
const pt = (psi: number, r: number) => ({ x: C + r * Math.cos(psi), y: C - r * Math.sin(psi) });

/** Azimuth of a line is defined modulo 180°, so draw it as a diameter. */
function Diameter({ psi, dash, color }: { psi: number; dash?: string; color: string }) {
  const a = pt(psi, R), b = pt(psi + Math.PI, R);
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={3} strokeDasharray={dash} strokeLinecap="round" />;
}

/**
 * Plane of polarization before (solid) and after (dashed) an optically active sample, seen looking toward the
 * source. Angles counter-clockwise from +x; a dextrorotatory sample (α > 0) turns the plane clockwise, so the output
 * azimuth is θ_in − α. The arc shows α reduced to ±180°.
 */
export default function RotationDiagram({ thetaIn, alpha }: { thetaIn: number; alpha: number }) {
  const id = useId().replace(/:/g, "");
  const shown = Number.isFinite(alpha) ? Math.atan2(Math.sin(alpha), Math.cos(alpha)) : NaN;
  const thetaOut = thetaIn - shown;
  const from = pt(thetaIn, 40), to = pt(thetaOut, 40);
  const showArc = Number.isFinite(shown) && Math.abs(shown) > 1e-3;
  // SVG sweep-flag 1 runs clockwise on the page, which is the direction of a dextrorotatory turn (α > 0).
  // |shown| ≤ π, so the arc is never the large one.
  const arc = `M ${from.x} ${from.y} A 40 40 0 0 ${shown > 0 ? 1 : 0} ${to.x} ${to.y}`;
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img"
      aria-label="Plane of polarization before (solid) and after (dashed) the sample, seen looking toward the source; angles counter-clockwise from the +x axis">
      <defs>
        <marker id={`${id}-head`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
        </marker>
      </defs>
      <circle cx={C} cy={C} r={R + 4} fill="none" stroke="#4b5563" strokeWidth={1} />
      <line x1={C - R - 4} y1={C} x2={C + R + 4} y2={C} stroke="#4b5563" strokeWidth={1} />
      <text x={C + R + 5} y={C - 4} fontSize={11} fill="#9ca3af" textAnchor="end">+x</text>
      <Diameter psi={thetaIn} color="#60a5fa" />
      {Number.isFinite(thetaOut) && <Diameter psi={thetaOut} color="#fb923c" dash="6 4" />}
      {showArc && <path d={arc} fill="none" stroke="#facc15" strokeWidth={2} markerEnd={`url(#${id}-head)`} />}
    </svg>
  );
}
