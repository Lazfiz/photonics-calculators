"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function OpticalWaveguidePage() {
  const [nCore, setNCore] = useURLState("nCore", 1.5);
  const [nClad, setNClad] = useURLState("nClad", 1.45);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [coreWidth, setCoreWidth] = useURLState("coreWidth", 10); // µm

  const NA = Math.sqrt(nCore * nCore - nClad * nClad);
  const vNumber = Math.PI * coreWidth * NA / wavelength;
  const acceptanceAngle = Math.asin(NA) * 180 / Math.PI;
  const criticalAngle = Math.asin(nClad / nCore) * 180 / Math.PI;

  // Number of modes (symmetric slab)
  const M = Math.floor(2 * vNumber / Math.PI) + 1;

  const chartData = useMemo(() => {
    const betaMax = 2 * Math.PI * nCore / wavelength;
    const betaMin = 2 * Math.PI * nClad / wavelength;
    const vs = Array.from({ length: 200 }, (_, i) => i / 200 * vNumber * 1.5 + 0.01);
    // Effective index vs V number (approximate for slab)
    const bParams = vs.map(v => {
      if (v < 0.1) return 0;
      return Math.pow(1 - Math.pow(1.1428 / (v + 0.996), 2), 0.5) * (v > 1 ? 1 : v / 1);
    });
    const neff = bParams.map(b => nClad + b * (nCore - nClad));
    const betaArr = neff.map(n => 2 * Math.PI * n / wavelength);

    // Mode profiles for fundamental
    const x = Array.from({ length: 200 }, (_, i) => (i / 200 - 0.5) * coreWidth * 3);
    const w = coreWidth / 2;
    const kappa = Math.sqrt(Math.max(0.001, (2 * Math.PI * nCore / wavelength) ** 2 - (2 * Math.PI * (nCore + nClad) / 2 / wavelength) ** 2));
    const gamma = Math.sqrt(Math.max(0.001, (2 * Math.PI * (nCore + nClad) / 2 / wavelength) ** 2 - (2 * Math.PI * nClad / wavelength) ** 2));
    const mode0 = x.map(xi => {
      if (Math.abs(xi) <= w) return Math.cos(kappa * xi);
      return Math.cos(kappa * w) * Math.exp(-gamma * (Math.abs(xi) - w));
    });
    const maxMode = Math.max(...mode0);

    return [
      { x: vs, y: neff.map(n => n.toFixed(6) as unknown as number), type: "scatter" as const, mode: "lines" as const, name: "Fundamental n_eff", line: { color: "#60a5fa", width: 2 } },
      { x: [0, vNumber * 1.5], y: Array(2).fill(nCore), type: "scatter" as const, mode: "lines" as const, name: "n_core", line: { color: "#f87171", dash: "dash" } },
      { x: [0, vNumber * 1.5], y: Array(2).fill(nClad), type: "scatter" as const, mode: "lines" as const, name: "n_clad", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [nCore, nClad, wavelength, coreWidth, vNumber]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Optical Waveguide Modes" description="Slab waveguide mode analysis: V-number, NA, and effective index.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Core Index n₁" value={nCore} onChange={setNCore} step="any" />
        <ValidatedNumberInput label="Cladding Index n₂" value={nClad} onChange={setNClad} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Core Width (µm)" value={coreWidth} onChange={setCoreWidth} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Numerical Aperture</p>
          <p className="text-xl font-bold text-blue-400">{NA.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-Number</p>
          <p className="text-xl font-bold text-green-400">{vNumber.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Approx. Mode Count (TE)</p>
          <p className="text-xl font-bold text-orange-400">{M}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Angle θ<sub>c</sub></p>
          <p className="text-xl font-bold text-purple-400">{criticalAngle.toFixed(2)}°</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">V = (πd/λ)√(n₁²-n₂²) &nbsp;|&nbsp; NA = √(n₁²-n₂²) &nbsp;|&nbsp; M ≈ 2V/π (slab)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "V-Number", gridcolor: "#374151" },
          yaxis: { title: "Effective Index n_eff", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
