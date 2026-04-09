"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function MultiCoreFiberCalculator() {
  const [numCores, setNumCores] = useURLState("numCores", 7);
  const [corePitch, setCorePitch] = useURLState("corePitch", 45); // μm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km

  const na = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  const vNumber = (2 * Math.PI * coreRadius * na) / wavelength;

  // Inter-core coupling coefficient
  const couplingCoeff = useMemo(() => {
    // Approximate coupling between adjacent cores
    const lambda = wavelength * 1e-3; // to μm
    const k0 = 2 * Math.PI / lambda;
    const u = Math.sqrt(coreIndex ** 2 * k0 ** 2 - (vNumber / (2 * coreRadius)) ** 2);
    const w = Math.sqrt((vNumber / (2 * coreRadius)) ** 2 - claddingIndex ** 2 * k0 ** 2);
    const K0 = (x: number) => Math.exp(-Math.abs(x)) / Math.sqrt(Math.abs(x) + 1);
    const K1 = (x: number) => Math.exp(-Math.abs(x)) / Math.sqrt(Math.abs(x) + 1) * (1 + 1 / (Math.abs(x) + 1));
    const kappa = (w * K0(w) * K1(w) * u) / (coreRadius * K0(u) ** 2);
    return Math.abs(kappa) * 1e-3; // scale to reasonable μm⁻¹
  }, [coreRadius, coreIndex, claddingIndex, wavelength, vNumber]);

  // Crosstalk between adjacent cores (dB)
  const crosstalk = useMemo(() => {
    const L = fiberLength * 1e6; // km to μm
    const xt = 10 * Math.log10(Math.sinh(couplingCoeff * L) ** 2);
    return xt;
  }, [couplingCoeff, fiberLength]);

  // Spatial channel capacity multiplier
  const capacityMultiplier = numCores;

  // Total throughput (assuming 1 Tbps per core base)
  const baseRatePerCore = 1; // Tbps
  const totalThroughput = baseRatePerCore * numCores;

  // Core packing density
  const claddingRadius = useMemo(() => {
    if (numCores === 1) return coreRadius * 3;
    if (numCores <= 7) return corePitch * 1.5 + coreRadius * 2;
    if (numCores <= 19) return corePitch * 3 + coreRadius * 2;
    return corePitch * 4 + coreRadius * 2;
  }, [numCores, corePitch, coreRadius]);

  const packingDensity = (numCores * Math.PI * coreRadius ** 2) / (Math.PI * claddingRadius ** 2);

  // Plot: crosstalk vs core pitch
  const plotData = useMemo(() => {
    const pitches: number[] = [];
    const crosstalks: number[] = [];

    for (let p = 20; p <= 100; p += 1) {
      pitches.push(p);
      // Crosstalk decreases with pitch
      const k = couplingCoeff * Math.exp(-(p - corePitch) / 20);
      const L = fiberLength * 1e6;
      const xt = 10 * Math.log10(Math.max(1e-20, Math.sinh(Math.abs(k) * L) ** 2));
      crosstalks.push(xt);
    }

    return [
      {
        x: pitches, y: crosstalks, type: "scatter" as const, mode: "lines" as const,
        name: "Crosstalk", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: [corePitch], y: [crosstalk], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 },
      },
      {
        x: [20, 100], y: [-50, -50], type: "scatter" as const, mode: "lines" as const,
        name: "Target (< -50 dB)", line: { color: "#ef4444", width: 1, dash: "dash" as const },
      },
    ];
  }, [corePitch, couplingCoeff, fiberLength, crosstalk]);

  const layout = {
    title: "Inter-Core Crosstalk vs Core Pitch",
    xaxis: { title: "Core Pitch (μm)", gridcolor: "#374151" },
    yaxis: { title: "Crosstalk (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Cores</label>
              <select value={numCores} onChange={(e) => setNumCores(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={7}>7</option>
                <option value={12}>12</option>
                <option value={19}>19</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Pitch (μm)</label>
              <ValidatedNumberInput label="Core Pitch (μm)" value={corePitch} onChange={setCorePitch} min={10} step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Radius (μm)</label>
              <ValidatedNumberInput label="Core Radius (μm)" value={coreRadius} onChange={setCoreRadius} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core / Cladding Index</label>
              <div className="grid grid-cols-2 gap-2">
                <ValidatedNumberInput label="Core / Cladding Index" value={coreIndex} onChange={setCoreIndex} step="0.0001" />
                <ValidatedNumberInput label="claddingIndex" value={claddingIndex} onChange={setCladdingIndex} step="0.0001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (km)</label>
              <ValidatedNumberInput label="Fiber Length (km)" value={fiberLength} onChange={setFiberLength} step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">NA:</span><span className="font-mono">{na.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">V-number:</span><span className="font-mono">{vNumber.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupling coeff:</span><span className="font-mono">{couplingCoeff.toExponential(2)} μm⁻¹</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Inter-core XT:</span><span className={`font-mono text-lg ${crosstalk < -50 ? "text-green-400" : "text-red-400"}`}>{crosstalk.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Capacity:</span><span className="font-mono text-blue-400">{capacityMultiplier}× SDM</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total throughput:</span><span className="font-mono">{totalThroughput} Tbps</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Packing density:</span><span className="font-mono">{(packingDensity * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Cladding radius:</span><span className="font-mono">{claddingRadius.toFixed(0)} μm</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">XT = 10·log₁₀(sinh²(κ·L))</p>
              <p className="font-mono text-sm mt-1">Capacity = N_cores × base_rate</p>
              <p className="font-mono text-sm mt-1">κ ∝ exp(-Δβ · Λ)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
