"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { pseudoOpticalConstants } from "../../../physics/thin-film/ellipsometry";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function EllipsometryMeasurementPage() {
  const [psiDeg, setPsiDeg] = useURLState("psiDeg", 45);
  const [deltaDeg, setDeltaDeg] = useURLState("deltaDeg", 120);
  const [aoiDeg, setAoiDeg] = useURLState("aoiDeg", 70);
  const [nSubstrate, setNSubstrate] = useURLState("nSubstrate", 1.52);

  const results = useMemo(() => {
    const theta = aoiDeg * Math.PI / 180;
    const pseudo = pseudoOpticalConstants(psiDeg * Math.PI / 180, deltaDeg * Math.PI / 180, theta);
    // Reflectances of the bare pseudo-substrate at the measurement angle (NaN if ⟨k⟩ < 0).
    const bare = { incident: 1, layers: [], substrate: { n: pseudo.n, k: pseudo.k } };
    const Rs = stackResponse(bare, 633e-9, theta, "s").R;
    const Rp = stackResponse(bare, 633e-9, theta, "p").R;
    const brewsterAngle = Math.atan(nSubstrate) * 180 / Math.PI;
    return { ...pseudo, Rs, Rp, Ravg: (Rs + Rp) / 2, brewsterAngle };
  }, [psiDeg, deltaDeg, aoiDeg, nSubstrate]);

  const psiDeltaMap = useMemo(() => {
    const theta = aoiDeg * Math.PI / 180;
    const psis = Array.from({ length: 50 }, (_, i) => i * 90 / 50);
    const deltas = Array.from({ length: 50 }, (_, j) => j * 360 / 50);
    const z = deltas.map(d => psis.map(p => pseudoOpticalConstants(p * Math.PI / 180, d * Math.PI / 180, theta).n));
    return [
      { x: psis, y: deltas, z, zmin: 0, zmax: 5, type: "heatmap" as const, colorscale: "Viridis", showscale: true, colorbar: { title: { text: "⟨n⟩", font: { color: "#9ca3af" } }, tickfont: { color: "#9ca3af" } } },
      { x: [psiDeg], y: [deltaDeg], type: "scatter" as const, mode: "markers" as const, name: "Measurement", marker: { color: "#f87171", size: 10, symbol: "x" } },
    ];
  }, [aoiDeg, psiDeg, deltaDeg]);

  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "—");

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Ψ (degrees)" value={psiDeg} onChange={setPsiDeg} min={0} max={90} step="0.1" />
        <ValidatedNumberInput label="Δ (degrees)" value={deltaDeg} onChange={setDeltaDeg} min={0} max={360} step="0.1" />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={aoiDeg} onChange={setAoiDeg} min={0} max={90} step="0.5" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSubstrate} onChange={setNSubstrate} step="0.01" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Pseudo-refractive index ⟨n⟩: <span className="text-blue-400 font-mono">{fmt(results.n)}</span></p>
        <p className="text-gray-300">Pseudo-extinction coeff ⟨k⟩: <span className="text-blue-400 font-mono">{fmt(results.k)}</span></p>
        <p className="text-gray-300">⟨ε₁⟩: <span className="text-blue-400 font-mono">{fmt(results.eps1)}</span></p>
        <p className="text-gray-300">⟨ε₂⟩: <span className="text-blue-400 font-mono">{fmt(results.eps2)}</span></p>
        <p className="text-gray-300">R<sub>p</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Rp)}</span></p>
        <p className="text-gray-300">R<sub>s</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Rs)}</span></p>
        <p className="text-gray-300">R<sub>avg</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Ravg)}</span></p>
        <p className="text-gray-300">Brewster angle of n<sub>substrate</sub>: <span className="text-blue-400 font-mono">{results.brewsterAngle.toFixed(2)}°</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>ρ = r<sub>p</sub>/r<sub>s</sub> = tan(Ψ)·e<sup>iΔ</sup></p>
        <p>⟨ε⟩ = sin²θ [1 + tan²θ·((1−ρ)/(1+ρ))²] (pseudo-dielectric function)</p>
        <p>⟨N⟩ = √⟨ε⟩ = ⟨n⟩ − i⟨k⟩, ⟨ε⟩ = ⟨ε₁⟩ − i⟨ε₂⟩ (Nebraska convention: Δ = 180° at normal incidence)</p>
        <p>Exact for a bare substrate; with a film on top these are “pseudo” values, not material constants.</p>
        <p>Brewster angle θ<sub>B</sub> = arctan(n<sub>sub</sub>)</p>
      </div>

      <ChartPanel data={psiDeltaMap} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Ψ (°)", gridcolor: "#374151" },
        yaxis: { title: "Δ (°)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
      <p className="text-gray-500 text-xs mt-2 text-center">⟨n⟩ over the Ψ-Δ plane at the current angle of incidence. The red × is the measurement.</p>
    </>
  );
}
