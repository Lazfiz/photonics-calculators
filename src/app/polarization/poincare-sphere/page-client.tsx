"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { poincareWireframeTraces } from "../../../components/poincare-wireframe";
import { CONVENTION_NOTE, fix, stateLabel } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { scale, type Complex } from "../../../physics/complex";
import { ellipticalState, type JonesVector } from "../../../physics/polarization/jones";
import { degreeOfPolarization, stokesFromEllipse } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function cfmt(c: Complex): string {
  const im = fix(c.im, 3);
  return `${fix(c.re, 3)}${im.startsWith("-") ? "" : "+"}${im}i`;
}

export default function PoincareSpherePage() {
  const [thetaDeg, setThetaDeg] = useURLState("thetaDeg", 45, { min: 0, max: 180 });
  const [chiDeg, setChiDeg] = useURLState("chiDeg", 15);
  const [amplitude, setAmplitude] = useURLState("amplitude", 1);

  // Clamp before use: the URL isn't clamped.
  const chiShown = clamp(chiDeg, -45, 45);
  const amplitudeShown = clamp(amplitude, 0.01, 5);

  const psi = thetaDeg * DEG;
  const chi = chiShown * DEG;

  const stokes = useMemo(() => {
    const S = stokesFromEllipse(amplitudeShown * amplitudeShown, psi, chi);
    const [I, Q, U, V] = S;
    return { S, I, Q, U, V, s1: Q / I, s2: U / I, s3: V / I };
  }, [psi, chi, amplitudeShown]);

  const tracePath = useMemo(() => {
    // Great circle path from H-polarized to current state
    const n = 50;
    const s1 = stokes.s1, s2 = stokes.s2, s3 = stokes.s3;
    const sweep = Math.acos(clamp(s1, -1, 1)); // angle from (1,0,0)
    const x: number[] = [], y: number[] = [], z: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * sweep;
      x.push(Math.cos(t));
      y.push(s2 / Math.sqrt(s2 * s2 + s3 * s3 + 1e-12) * Math.sin(t));
      z.push(s3 / Math.sqrt(s2 * s2 + s3 * s3 + 1e-12) * Math.sin(t));
    }
    return { x, y, z };
  }, [stokes]);

  const wireframe = useMemo(() => poincareWireframeTraces(), []);

  // Jones vector of amplitude A
  const jones = useMemo<JonesVector>(() => {
    const E = ellipticalState(psi, chi);
    return [scale(E[0], amplitudeShown), scale(E[1], amplitudeShown)];
  }, [psi, chi, amplitudeShown]);

  // Polarization ellipse Re{E e^{iωt}} over one period
  const ellipseTrace = useMemo(() => {
    const t = Array.from({ length: 101 }, (_, i) => (2 * Math.PI * i) / 100);
    return {
      x: t.map((ti) => jones[0].re * Math.cos(ti) - jones[0].im * Math.sin(ti)),
      y: t.map((ti) => jones[1].re * Math.cos(ti) - jones[1].im * Math.sin(ti)),
    };
  }, [jones]);

  const dop = degreeOfPolarization(stokes.S);
  const handednessLabel = stateLabel(stokes.S);

  return (
    <>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Parameters</h2>
          {[
            { label: "Orientation angle θ (°)", val: thetaDeg, set: setThetaDeg, min: 0, max: 180, step: "1" },
            { label: "Ellipticity angle χ (°)", val: chiShown, set: setChiDeg, min: -45, max: 45, step: "1" },
            { label: "Amplitude", val: amplitudeShown, set: setAmplitude, min: 0.01, max: 5, step: "0.01" },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label} className="mb-3">
              <ValidatedNumberInput label={label} value={val} onChange={set} min={min} max={max} step={step} />
              <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))}
                aria-label={label} className="w-full mt-1" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Vector</h2>
          <div className="space-y-3">
            <ResultRow label="I" value={fix(stokes.I, 4)} />
            <ResultRow label="Q (S₁)" value={fix(stokes.Q, 4)} />
            <ResultRow label="U (S₂)" value={fix(stokes.U, 4)} />
            <ResultRow label="V (S₃)" value={fix(stokes.V, 4)} />
            <ResultRow label="DOP" value={fix(dop, 4)} />
            <ResultRow label="Handedness" value={handednessLabel} />
            <ResultRow label="Jones Ex" value={cfmt(jones[0])} />
            <ResultRow label="Jones Ey" value={cfmt(jones[1])} />
          </div>
          <p className="mt-4 text-xs text-gray-500">{CONVENTION_NOTE}</p>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Poincaré Sphere</h2>
          <ChartPanel data={[
              ...wireframe,
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [1], y: [0], z: [0], text: ["H"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [-1], y: [0], z: [0], text: ["V"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [1], z: [0], text: ["45°"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [-1], z: [0], text: ["135°"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [0], z: [1], text: ["RCP"], textposition: "top center", marker: { size: 4, color: "#22c55e" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [0], z: [-1], text: ["LCP"], textposition: "top center", marker: { size: 4, color: "#ef4444" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "lines" as const, x: tracePath.x, y: tracePath.y, z: tracePath.z, line: { color: "#3b82f6", width: 2 }, name: "Path from H", showlegend: true },
              { type: "scatter3d" as const, mode: "markers" as const, x: [stokes.s1], y: [stokes.s2], z: [stokes.s3], marker: { size: 12, color: "#3b82f6", symbol: "circle" }, name: "Current state" },
            ]}
            layout={{
              scene: { xaxis: { title: "S₁/Q", range: [-1.3, 1.3], color: "#9ca3af" }, yaxis: { title: "S₂/U", range: [-1.3, 1.3], color: "#9ca3af" }, zaxis: { title: "S₃/V", range: [-1.3, 1.3], color: "#9ca3af" }, bgcolor: "#111827" },
              margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: "#111827", font: { color: "#d1d5db" },
              showlegend: true, legend: { x: 0, y: 1, bgcolor: "rgba(0,0,0,0)" },
            }}


          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Ellipse</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: ellipseTrace.x, y: ellipseTrace.y, line: { color: "#3b82f6", width: 2 } }]}
            layout={{
              xaxis: { title: "Ex", range: [-amplitudeShown * 1.2, amplitudeShown * 1.2], color: "#9ca3af", gridcolor: "#374151", zerolinecolor: "#4b5563" },
              yaxis: { title: "Ey", range: [-amplitudeShown * 1.2, amplitudeShown * 1.2], color: "#9ca3af", gridcolor: "#374151", zerolinecolor: "#4b5563", scaleanchor: "x" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}


          />
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
