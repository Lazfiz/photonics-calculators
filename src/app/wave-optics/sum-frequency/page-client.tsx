"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SumFrequencyPage() {
  const [lambda1, setLambda1] = useURLState("lambda1", 1064); // nm
  const [lambda2, setLambda2] = useURLState("lambda2", 1550); // nm
  const [deff, setDeff] = useURLState("deff", 2.0); // pm/V (KTP)
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 10); // mm
  const [power1, setPower1] = useURLState("power1", 100); // mW
  const [power2, setPower2] = useURLState("power2", 50); // mW
  const [beamWaist, setBeamWaist] = useURLState("beamWaist", 30); // µm

  // Sum frequency: 1/λ_sum = 1/λ1 + 1/λ2
  const lambdaSum = 1 / (1 / lambda1 + 1 / lambda2);
  const omegaSum = 2 * Math.PI * 3e8 / (lambdaSum * 1e-9);

  // Conversion efficiency (Boyd-Kleinman)
  const n = 1.8;
  const area = Math.PI * (beamWaist * 1e-6) ** 2;
  const L = crystalLength * 1e-3;
  const d = deff * 1e-12;
  const epsilon0 = 8.854e-12;
  const c = 3e8;

  // η ≈ (8π² d² L²) / (ε₀ c n³ λ²) × P/A — simplified plane-wave
  const eta = (8 * Math.PI ** 2 * d ** 2 * L ** 2) / (epsilon0 * c * n ** 3 * (lambdaSum * 1e-9) ** 2 * area) * (power1 * 1e-3 / area);
  const pSum = power1 * 1e-3 * eta * power2 * 1e-3;

  // Conversion efficiency vs crystal length
  const lengthData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 30 / 200);
    const effs = lengths.map(l => {
      return (8 * Math.PI ** 2 * d ** 2 * (l * 1e-3) ** 2) / (epsilon0 * c * n ** 3 * (lambdaSum * 1e-9) ** 2 * area) * (power1 * 1e-3 / area) * 100;
    });
    return [
      { x: lengths, y: effs, type: "scatter", mode: "lines", name: "η vs L", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [lambda1, lambda2, deff, power1, power2, beamWaist]);

  // SFG wavelength vs λ2
  const tuningData = useMemo(() => {
    const l2s = Array.from({ length: 200 }, (_, i) => 800 + i * 1500 / 200);
    const lSums = l2s.map(l2 => {
      const ls = 1 / (1 / lambda1 + 1 / l2);
      return ls > 0 ? ls : NaN;
    });
    return [
      { x: l2s, y: lSums, type: "scatter", mode: "lines", name: "λ_SFG", line: { color: "#f472b6", width: 2 } },
    ];
  }, [lambda1]);

  const lengthLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Crystal length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Conversion efficiency (%)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const tuningLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "λ₂ (nm)", gridcolor: "#374151" },
    yaxis: { title: "SFG wavelength (nm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Sum Frequency Generation (SFG)" description="Upconversion via χ⁽²⁾: ω1 + ω2 → ω3 with phase matching.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Energy:</span> 1/λ<sub>3</sub> = 1/λ<sub>1</sub> + 1/λ<sub>2</sub></p>
        <p><span className="text-blue-400">Phase match:</span> Δk = k<sub>3</sub> − k<sub>1</sub> − k<sub>2</sub> = 0</p>
        <p><span className="text-blue-400">η</span> = (8π² d<sub>eff</sub>² L²) / (ε₀ c n³ λ₃² A) × (P₁/A)</p>
        <p><span className="text-blue-400">P<sub>3</sub></span> = η · P₁ · P₂</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="λ₁ (nm)" value={lambda1} onChange={setLambda1} />
        <ValidatedNumberInput label="λ₂ (nm)" value={lambda2} onChange={setLambda2} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">d<sub>eff</sub> (pm/V)</span>
          <input type="number" value={deff} onChange={e => setDeff(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Crystal Length (mm)" value={crystalLength} onChange={setCrystalLength} />
        <ValidatedNumberInput label="P₁ (mW)" value={power1} onChange={setPower1} />
        <ValidatedNumberInput label="P₂ (mW)" value={power2} onChange={setPower2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SFG Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{lambdaSum.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Conversion Efficiency</p>
          <p className="text-xl font-bold text-green-400">{(eta * 100).toExponential(2)} %</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SFG Power</p>
          <p className="text-xl font-bold text-orange-400">{(pSum * 1e6).toExponential(2)} µW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ω<sub>3</sub></p>
          <p className="text-xl font-bold text-purple-400">{(omegaSum / 1e15).toFixed(2)} PHz</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={lengthData} layout={lengthLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={tuningData} layout={tuningLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
