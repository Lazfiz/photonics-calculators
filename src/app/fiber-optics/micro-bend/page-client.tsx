"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function MicroBendPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [period, setPeriod] = useURLState("period", 1); // mm
  const [amplitude, setAmplitude] = useURLState("amplitude", 1); // µm
  const [length, setLength] = useURLState("length", 100); // m
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1); // µm
  const [na, setNa] = useURLState("na", 0.12);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // µm
    const Lambda = period * 1e3; // µm
    const amp = amplitude; // µm
    const L = length * 1e6; // µm
    const a = coreRadius; // µm

    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - na * na);
    const delta = (n1 * n1 - n2 * n2) / (2 * n1 * n2);
    const k = 2 * Math.PI / lambda;

    // Cladding decay constant: γ = k × √(n1² - n2²)
    const gamma = k * na;

    // Critical coupling period (Marcuse): Λ_c = 2π / γ
    const Lambda_c = 2 * Math.PI / gamma; // µm

    // V-number and mode field radius (Marcuse)
    const V = k * a * na;
    const w = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));

    // Number of perturbation cycles
    const N_cycles = L / Lambda;

    // Microbend loss per unit length (Marcuse simplified model)
    // α ∝ (amp/w)² × (1/Λ)² × resonance_factor × NA⁴
    // Resonance peaks when Λ ≈ Λ_c, modeled as Lorentzian
    const resonanceFactor = Math.pow(Lambda_c, 2) / (Math.pow(Lambda - Lambda_c, 2) + Math.pow(Lambda_c, 2));

    // Calibrated to give ~0.05 dB for SMF-28 at typical conditions
    const C = 0.8;
    const alpha_per_um = C * Math.pow(amp / w, 2) * Math.pow(na, 4) / Math.pow(Lambda, 2) * 1e4 * resonanceFactor;

    const loss = alpha_per_um * L; // total loss in nepers
    const lossDb = loss * 4.343; // convert to dB

    return { lossDb, Lambda_c, V, w, resonanceFactor, N_cycles, n1, n2 };
  }, [wavelength, period, amplitude, length, coreRadius, na]);

  const chartData = useMemo(() => {
    const periods = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.05);
    const lambda = wavelength * 1e-3;
    const a = coreRadius;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - na * na);
    const k = 2 * Math.PI / lambda;
    const gamma = k * na;
    const Lambda_c = 2 * Math.PI / gamma;
    const V = k * a * na;
    const w = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
    const L = length * 1e6;
    const C = 0.8;

    const lossCurve = periods.map(p => {
      const Lambda = p * 1e3;
      const N_cycles = L / Lambda;
      const resonanceFactor = Math.pow(Lambda_c, 2) / (Math.pow(Lambda - Lambda_c, 2) + Math.pow(Lambda_c, 2));
      const alpha = C * Math.pow(amplitude / w, 2) * Math.pow(na, 4) / Math.pow(Lambda, 2) * 1e4 * resonanceFactor;
      return alpha * L * 4.343;
    });

    return [
      { x: periods, y: lossCurve, type: "scatter" as const, mode: "lines" as const, name: "Microbend Loss", line: { color: "#a78bfa" } },
      { x: [period], y: [calc.lossDb], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [periods[0], periods[periods.length - 1]], y: [calc.Lambda_c * 1e-3, calc.Lambda_c * 1e-3], type: "scatter" as const, mode: "lines" as const, name: `Λ_c = ${(calc.Lambda_c * 1e-3).toFixed(2)} mm`, line: { color: "#fbbf24", dash: "dash", width: 1 } },
    ];
  }, [wavelength, amplitude, length, period, coreRadius, na, calc]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Micro Bend Loss" description="Calculate microbending loss from periodic perturbations using Marcuse mode coupling theory.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={2000} />
        <ValidatedNumberInput label="Perturbation Period (mm)" value={period} onChange={setPeriod} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Amplitude (µm)" value={amplitude} onChange={setAmplitude} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Affected Length (m)" value={length} onChange={setLength} min={1} max={1000} />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} step="0.1" />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Microbend Loss</p>
          <p className="text-2xl font-bold text-purple-400">{calc.lossDb.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Loss/km</p>
          <p className="text-2xl font-bold text-blue-400">{(calc.lossDb * 1000 / length).toFixed(3)} dB/km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Period Λ_c</p>
          <p className="text-2xl font-bold text-yellow-400">{(calc.Lambda_c * 1e-3).toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Severity</p>
          <p className={`text-2xl font-bold ${calc.lossDb < 0.01 ? "text-green-400" : calc.lossDb < 0.1 ? "text-yellow-400" : "text-red-400"}`}>{calc.lossDb < 0.01 ? "Low" : calc.lossDb < 0.1 ? "Medium" : "High"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>γ = k · NA (cladding decay constant)</p>
          <p>Λ_c = 2π / γ (critical coupling period)</p>
          <p>α ∝ (amp/w)² · NA⁴ / Λ² · resonance(Λ, Λ_c)</p>
          <p>Resonance: Lorentzian peak at Λ = Λ_c</p>
          <p>MFR w: Marcuse V-parameterized approximation</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Perturbation Period (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
