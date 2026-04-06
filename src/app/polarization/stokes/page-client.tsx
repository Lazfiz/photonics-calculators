"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";

type Preset = "linear-h" | "linear-v" | "linear-45" | "linear-135" | "rcp" | "lcp" | "elliptical";

const presets: Record<Preset, { I: number; Q: number; U: number; V: number; label: string }> = {
  "linear-h": { I: 1, Q: 1, U: 0, V: 0, label: "Linear Horizontal" },
  "linear-v": { I: 1, Q: -1, U: 0, V: 0, label: "Linear Vertical" },
  "linear-45": { I: 1, Q: 0, U: 1, V: 0, label: "Linear 45°" },
  "linear-135": { I: 1, Q: 0, U: -1, V: 0, label: "Linear 135°" },
  rcp: { I: 1, Q: 0, U: 0, V: 1, label: "Right Circular" },
  lcp: { I: 1, Q: 0, U: 0, V: -1, label: "Left Circular" },
  elliptical: { I: 1, Q: 0.5, U: 0.5, V: 0.5, label: "Elliptical" },
};

const currentHref = "/polarization/stokes";

export default function StokesPage() {
  const [I, setI] = useURLState("I", 1);
  const [Q, setQ] = useURLState("Q", 0.5);
  const [U, setU] = useURLState("U", 0.3);
  const [V, setV] = useURLState("V", 0.2);

  const results = useMemo(() => {
    if (I <= 0) return null;
    const dop = Math.sqrt(Q * Q + U * U + V * V) / I;
    const dolp = Math.sqrt(Q * Q + U * U) / I;
    const docp = Math.abs(V) / I;
    const psi = 0.5 * Math.atan2(U, Q);
    const ratioArg = dop === 0 ? 0 : V / (I * dop);
    const chi = 0.5 * Math.asin(Math.min(1, Math.max(-1, ratioArg)));
    const ar = Math.tan(Math.abs(chi));
    return { dop, dolp, docp, psi: (psi * 180) / Math.PI, chi: (chi * 180) / Math.PI, ar, handedness: V > 0 ? "Right-handed" : V < 0 ? "Left-handed" : "Linear" };
  }, [I, Q, U, V]);

  const applyPreset = (p: Preset) => {
    const v = presets[p];
    setI(v.I);
    setQ(v.Q);
    setU(v.U);
    setV(v.V);
  };

  const poincareTrace = useMemo(() => {
    const phi = Array.from({ length: 37 }, (_, i) => (i * 10 * Math.PI) / 180);
    const theta = Array.from({ length: 19 }, (_, i) => (i * 10 * Math.PI) / 180);
    return {
      lonLines: theta.map((t) => ({ x: phi.map((p) => Math.cos(t) * Math.cos(p)), y: phi.map((p) => Math.cos(t) * Math.sin(p)), z: phi.map((p) => Math.sin(t)) })),
      latLines: phi.filter((_, i) => i % 3 === 0).map((p) => ({ x: theta.map((t) => Math.cos(t) * Math.cos(p)), y: theta.map((t) => Math.cos(t) * Math.sin(p)), z: theta.map((t) => Math.sin(t)) })),
    };
  }, []);

  const statePoint = I > 0 ? { x: [Q / I], y: [U / I], z: [V / I] } : { x: [0], y: [0], z: [0] };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Stokes Parameters" description="Analyze polarization state from Stokes vector components with sliders, presets, and Poincaré sphere visualization.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Vector Input</h2>
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(presets) as Preset[]).map((p) => (
                <button key={p} onClick={() => applyPreset(p)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500 transition">
                  {presets[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <InputSlider label="I (Intensity)" value={I} onChange={setI} min={0.1} max={2} step={0.01} />
            <InputSlider label="Q" value={Q} onChange={setQ} min={-1} max={1} step={0.01} />
            <InputSlider label="U" value={U} onChange={setU} min={-1} max={1} step={0.01} />
            <InputSlider label="V" value={V} onChange={setV} min={-1} max={1} step={0.01} />
          </div>

          <div className="mt-4 text-sm text-gray-500">S = [{I.toFixed(2)}, {Q.toFixed(2)}, {U.toFixed(2)}, {V.toFixed(2)}]</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Analysis</h2>
          {!results ? (
            <p className="text-red-400">I must be positive</p>
          ) : (
            <div className="space-y-3">
              <ResultRow label="Degree of Polarization (DOP)" value={results.dop.toFixed(4)} />
              <ResultRow label="Degree of Linear Polarization (DOLP)" value={results.dolp.toFixed(4)} />
              <ResultRow label="Degree of Circular Polarization (DOCP)" value={results.docp.toFixed(4)} />
              <ResultRow label="Orientation angle ψ" value={`${results.psi.toFixed(2)}°`} />
              <ResultRow label="Ellipticity angle χ" value={`${results.chi.toFixed(2)}°`} />
              <ResultRow label="Axis ratio b/a" value={results.ar.toFixed(4)} />
              <ResultRow label="Handedness" value={results.handedness} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Poincaré Sphere</h2>
          <ChartPanel
            data={[
              ...poincareTrace.lonLines.map((l) => ({ type: "scatter3d" as const, mode: "lines" as const, x: l.x, y: l.y, z: l.z, line: { color: "#374151", width: 1 }, showlegend: false, hoverinfo: "skip" })),
              ...poincareTrace.latLines.map((l) => ({ type: "scatter3d" as const, mode: "lines" as const, x: l.x, y: l.y, z: l.z, line: { color: "#374151", width: 1 }, showlegend: false, hoverinfo: "skip" })),
              { type: "scatter3d" as const, mode: "markers" as const, x: statePoint.x, y: statePoint.y, z: statePoint.z, marker: { size: 10, color: "#3b82f6", symbol: "circle" }, name: "Polarization state" },
            ]}
            layout={{
              scene: { xaxis: { title: "S₁/Q", range: [-1.2, 1.2], color: "#9ca3af" }, yaxis: { title: "S₂/U", range: [-1.2, 1.2], color: "#9ca3af" }, zaxis: { title: "S₃/V", range: [-1.2, 1.2], color: "#9ca3af" }, bgcolor: "#111827" },
              margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: "#111827", font: { color: "#d1d5db" },
              showlegend: true, legend: { x: 0, y: 1, bgcolor: "rgba(0,0,0,0)" },
            }}
          />
        </div>
      </div>

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
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
