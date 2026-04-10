"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";

export default function MultiCoreFiberCalculator() {
  const [numCores, setNumCores] = useURLState("numCores", 7);
  const [corePitch, setCorePitch] = useURLState("corePitch", 45); // μm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km
  const [deltaBeta, setDeltaBeta] = useURLState("deltaBeta", 5000); // rad/m propagation constant mismatch

  const lambda_um = wavelength * 1e-3; // nm → μm
  const na = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  const vNumber = (2 * Math.PI * coreRadius * na) / lambda_um;

  // Coupling coefficient (simplified coupled-mode theory)
  // For homogeneous MCF, κ decays exponentially with pitch
  // κ ≈ κ₀ · exp(-γ · Λ) where γ = cladding decay constant, Λ = pitch
  const calc = useMemo(() => {
    const k0 = 2 * Math.PI / lambda_um; // 1/μm
    const gamma = k0 * Math.sqrt(coreIndex ** 2 - claddingIndex ** 2); // cladding decay constant (1/μm)

    // Mode field radius (Marcuse)
    const w = coreRadius * (0.65 + 1.619 / Math.pow(vNumber, 1.5) + 2.879 / Math.pow(vNumber, 6));

    // Coupling coefficient: κ ∝ K₀(γ·Λ) · K₁(γ·Λ) / K₁(w/a)²
    // Using asymptotic approximation valid for γ·Λ >> 1
    const gammaPitch = gamma * corePitch;
    // Modified Bessel K₀, K₁ asymptotic approximation (valid for x > 2)
    const K0_asympt = (x: number) => Math.sqrt(Math.PI / (2 * x)) * Math.exp(-x);
    const K1_asympt = (x: number) => Math.sqrt(Math.PI / (2 * x)) * Math.exp(-x) * (1 + 0.5 / x);
    const u_param = coreRadius * Math.sqrt(coreIndex ** 2 * k0 ** 2 - (vNumber / (2 * coreRadius)) ** 2);
    const w_param = coreRadius * Math.sqrt((vNumber / (2 * coreRadius)) ** 2 - claddingIndex ** 2 * k0 ** 2);

    const K0_val = gammaPitch > 1 ? K0_asympt(gammaPitch) : 0.5; // fallback for small x
    const K1_val = gammaPitch > 1 ? K1_asympt(gammaPitch) : 0.6;
    const K1_w = w_param > 1 ? K1_asympt(w_param) : 0.8;

    // κ in 1/μm, convert to 1/m
    const kappa_per_um = Math.abs(w * K0_val * K1_val * u_param / (coreRadius * K1_w ** 2));
    const kappa = kappa_per_um * 1e6; // 1/m

    // Heterogeneous MCF: crosstalk with propagation constant mismatch
    // XT = 10·log₁₀(sinh²(h·L)) where h = κ²/(κ² + δβ²) (power coupling coefficient)
    const h = kappa ** 2 / (kappa ** 2 + deltaBeta ** 2);
    const L = fiberLength * 1000; // km → m
    const xt = 10 * Math.log10(Math.max(1e-30, Math.sinh(h * L) ** 2));

    // Cladding radius (hexagonal packing)
    const claddingRadius = corePitch + coreRadius + 10; // pitch + core + buffer

    // Packing density
    const packingDensity = (numCores * Math.PI * coreRadius ** 2) / (Math.PI * claddingRadius ** 2);

    return { kappa, h, xt, vNumber, claddingRadius, packingDensity, w };
  }, [coreRadius, coreIndex, claddingIndex, wavelength, vNumber, corePitch, deltaBeta, fiberLength, lambda_um]);

  // Plot: crosstalk vs core pitch
  const plotData = useMemo(() => {
    const pitches: number[] = [];
    const crosstalks: number[] = [];

    const k0 = 2 * Math.PI / lambda_um;
    const gamma = k0 * Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);

    for (let p = 20; p <= 100; p += 1) {
      pitches.push(p);
      const gammaPitch = gamma * p;
      const K0_asympt = (x: number) => Math.sqrt(Math.PI / (2 * x)) * Math.exp(-x);
      const K1_asympt = (x: number) => Math.sqrt(Math.PI / (2 * x)) * Math.exp(-x) * (1 + 0.5 / x);
      const u_param = coreRadius * Math.sqrt(coreIndex ** 2 * k0 ** 2 - (vNumber / (2 * coreRadius)) ** 2);
      const w_param = coreRadius * Math.sqrt((vNumber / (2 * coreRadius)) ** 2 - claddingIndex ** 2 * k0 ** 2);

      const K0_val = gammaPitch > 1 ? K0_asympt(gammaPitch) : 0.5;
      const K1_val = gammaPitch > 1 ? K1_asympt(gammaPitch) : 0.6;
      const K1_w = w_param > 1 ? K1_asympt(w_param) : 0.8;

      const kappa_p = Math.abs(calc.w * K0_val * K1_val * u_param / (coreRadius * K1_w ** 2)) * 1e6;
      const h_p = kappa_p ** 2 / (kappa_p ** 2 + deltaBeta ** 2);
      const L = fiberLength * 1000;
      const xt_p = 10 * Math.log10(Math.max(1e-30, Math.sinh(h_p * L) ** 2));
      crosstalks.push(xt_p);
    }

    return [
      {
        x: pitches, y: crosstalks, type: "scatter" as const, mode: "lines" as const,
        name: "Crosstalk", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: [corePitch], y: [calc.xt], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 },
      },
      {
        x: [20, 100], y: [-50, -50], type: "scatter" as const, mode: "lines" as const,
        name: "Target (< -50 dB)", line: { color: "#ef4444", width: 1, dash: "dash" as const },
      },
    ];
  }, [corePitch, coreIndex, claddingIndex, wavelength, vNumber, coreRadius, deltaBeta, fiberLength, lambda_um, calc.w, calc.xt]);

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
                <ValidatedNumberInput label="n_core" value={coreIndex} onChange={setCoreIndex} step="0.0001" />
                <ValidatedNumberInput label="n_clad" value={claddingIndex} onChange={setCladdingIndex} step="0.0001" />
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
            <div>
              <label className="block text-sm font-medium mb-2">Core Mismatch Δβ (rad/m)</label>
              <ValidatedNumberInput label="Δβ (rad/m)" value={deltaBeta} onChange={setDeltaBeta} min={0} step="100" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">NA:</span><span className="font-mono">{na.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">V-number:</span><span className="font-mono">{calc.vNumber.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupling coeff κ:</span><span className="font-mono">{calc.kappa.toExponential(2)} m⁻¹</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Power coupling h:</span><span className="font-mono">{calc.h.toExponential(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Inter-core XT:</span><span className={`font-mono text-lg ${calc.xt < -50 ? "text-green-400" : calc.xt < -30 ? "text-yellow-400" : "text-red-400"}`}>{calc.xt.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Capacity:</span><span className="font-mono text-blue-400">{numCores}× SDM</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Packing density:</span><span className="font-mono">{(calc.packingDensity * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Cladding radius:</span><span className="font-mono">{calc.claddingRadius.toFixed(0)} μm</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">κ ∝ K₀(γΛ)·K₁(γΛ) / K₁(w/a)²</p>
              <p className="font-mono text-sm mt-1">h = κ² / (κ² + Δβ²)</p>
              <p className="font-mono text-sm mt-1">XT = 10·log₁₀(sinh²(h·L))</p>
              <p className="font-mono text-sm mt-1">γ = k₀·√(n₁² - n₂²)</p>
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
