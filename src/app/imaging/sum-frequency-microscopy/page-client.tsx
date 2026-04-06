"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function SumFrequencyMicroscopyPage() {
  const [lambda1, setLambda1] = useURLState("lambda1", 1040);
  const [lambda2, setLambda2] = useURLState("lambda2", 800);
  const [na, setNa] = useURLState("na", 0.8);
  const [power1, setPower1] = useURLState("power1", 100);
  const [power2, setPower2] = useURLState("power2", 50);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 150);

  // SFG wavelength: 1/λ_SFG = 1/λ1 + 1/λ2
  const lambdaSFG = (lambda1 * lambda2) / (lambda1 + lambda2);
  const wavenumber1 = 1e7 / lambda1;
  const wavenumber2 = 1e7 / lambda2;
  const wavenumberSFG = wavenumber1 + wavenumber2;

  const energy1 = 1240 / lambda1;
  const energy2 = 1240 / lambda2;
  const energySFG = energy1 + energy2;

  // Beam waists
  const w0_1 = 0.61 * lambda1 / na;
  const w0_2 = 0.61 * lambda2 / na;

  const chartData = useMemo(() => {
    const lams2 = Array.from({ length: 100 }, (_, i) => 600 + i * 10);
    return [
      { x: lams2, y: lams2.map(l => (lambda1 * l) / (lambda1 + l)), type: "scatter", mode: "lines", name: "SFG λ", line: { color: "#f472b6" } },
      { x: [lambda2], y: [lambdaSFG], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lambda1, lambda2, lambdaSFG]);

  const energyChart = useMemo(() => {
    const lams2 = Array.from({ length: 100 }, (_, i) => 600 + i * 10);
    return [
      { x: lams2, y: lams2.map(l => 1240 / l), type: "scatter", mode: "lines", name: "ω₂ Photon Energy", line: { color: "#60a5fa" } },
      { x: lams2, y: lams2.map(l => 1240 / lambda1 + 1240 / l), type: "scatter", mode: "lines", name: "SFG Photon Energy", line: { color: "#f472b6" } },
      { x: [lambda2], y: [energySFG], type: "scatter", mode: "markers", name: "Current SFG", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lambda1, lambda2, energySFG]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Sum-Frequency Generation Microscopy Calculator" description="Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Beam 1 λ (nm)" value={lambda1} onChange={setLambda1} min={400} max={1600} />
        <ValidatedNumberInput label="Beam 2 λ (nm)" value={lambda2} onChange={setLambda2} min={400} max={1600} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Beam 1 Power (mW)" value={power1} onChange={setPower1} min={1} max={1000} />
        <ValidatedNumberInput label="Beam 2 Power (mW)" value={power2} onChange={setPower2} min={1} max={1000} />
        <ValidatedNumberInput label="Pulse Width (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SFG Wavelength</p>
          <p className="text-2xl font-bold text-pink-400">{lambdaSFG.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SFG Energy</p>
          <p className="text-2xl font-bold text-blue-400">{energySFG.toFixed(3)} eV</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam 1 w₀</p>
          <p className="text-2xl font-bold text-green-400">{w0_1.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam 2 w₀</p>
          <p className="text-2xl font-bold text-yellow-400">{w0_2.toFixed(2)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>1/λ_SFG = 1/λ₁ + 1/λ₂ → λ_SFG = λ₁λ₂/(λ₁+λ₂)</p>
          <p>ω_SFG = ω₁ + ω₂</p>
          <p>E_SFG = E₁ + E₂ = hc/λ₁ + hc/λ₂</p>
          <p>w₀ = 0.61λ/NA (diffraction-limited spot)</p>
          <p>I_SFG ∝ χ⁽²⁾² × I₁ × I₂ × L² (non-centrosymmetric media)</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "SFG λ vs Beam 2 λ", font: { size: 13 } }, xaxis: { title: "Beam 2 λ (nm)", gridcolor: "#374151" }, yaxis: { title: "SFG λ (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={energyChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Photon Energy vs Beam 2 λ", font: { size: 13 } }, xaxis: { title: "Beam 2 λ (nm)", gridcolor: "#374151" }, yaxis: { title: "Energy (eV)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
