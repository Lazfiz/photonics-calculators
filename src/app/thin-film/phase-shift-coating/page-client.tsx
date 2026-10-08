"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function PhaseShiftCoatingPage() {
  const [n1, setN1] = useURLState("n1", 1.0);
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [nSubstrate, setNSubstrate] = useURLState("nSubstrate", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [numLayers, setNumLayers] = useURLState("numLayers", 5);
  const [fractionalThickness, setFractionalThickness] = useURLState("fractionalThickness", 0.5);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // Film of fractional quarter-wave thickness; exact reflectance with all multiple reflections.
    const d = (fractionalThickness * designWl) / (4 * nFilm);
    const stack = { incident: n1, layers: [{ n: nFilm, thickness: d * 1e-9 }], substrate: { n: nSubstrate } };
    const phaseShift = reflectanceSpectrum(stack, wls.map((wl) => wl * 1e-9));
    return [
      { x: wls, y: phaseShift, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
    ];
  }, [n1, nFilm, nSubstrate, designWl, fractionalThickness]);

  const thickness = (fractionalThickness * designWl) / (4 * nFilm);
  const designPhase = (4 * Math.PI * nFilm * thickness) / designWl;
  const r01 = (n1 - nFilm) / (n1 + nFilm);
  const r12 = (nFilm - nSubstrate) / (nFilm + nSubstrate);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Phase Shift Coatings" description="Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (incident medium)" value={n1} onChange={setN1} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (film)" value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSubstrate} onChange={setNSubstrate} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWl} onChange={setDesignWl} step="10" />
        <ValidatedNumberInput label="Fractional Thickness (QW)" value={fractionalThickness} onChange={setFractionalThickness} min={0.05} max={3} step="0.05" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Film Thickness</p>
          <p className="text-xl font-bold text-green-400">{thickness.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase at Design λ</p>
          <p className="text-xl font-bold text-yellow-400">{(designPhase * 180 / Math.PI).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₀₁</p>
          <p className="text-xl font-bold text-red-400">{r01.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₁₂</p>
          <p className="text-xl font-bold text-blue-400">{r12.toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Phase Relations</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>δ = (4π·n·d) / λ</p>
          <p>Quarter-wave: d = λ/(4n) → δ = π</p>
          <p>Half-wave: d = λ/(2n) → δ = 2π</p>
          <p>r = (r₀₁ + r₁₂·e^(−iδ)) / (1 + r₀₁·r₁₂·e^(−iδ))</p>
          <p>R = (r₀₁² + r₁₂² + 2·r₀₁·r₁₂·cos δ) / (1 + r₀₁²·r₁₂² + 2·r₀₁·r₁₂·cos δ)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
