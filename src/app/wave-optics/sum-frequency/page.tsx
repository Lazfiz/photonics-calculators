"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SumFrequencyPage() {
  const [lambda1, setLambda1] = useState(1064); // nm
  const [lambda2, setLambda2] = useState(1550); // nm
  const [deff, setDeff] = useState(2.0); // pm/V (KTP)
  const [crystalLength, setCrystalLength] = useState(10); // mm
  const [power1, setPower1] = useState(100); // mW
  const [power2, setPower2] = useState(50); // mW
  const [beamWaist, setBeamWaist] = useState(30); // µm

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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Sum Frequency Generation (SFG)</h1>
      <p className="text-gray-400 mb-8">Upconversion via χ⁽²⁾: ω<sub>1</sub> + ω<sub>2</sub> → ω<sub>3</sub> with phase matching.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Energy:</span> 1/λ<sub>3</sub> = 1/λ<sub>1</sub> + 1/λ<sub>2</sub></p>
        <p><span className="text-blue-400">Phase match:</span> Δk = k<sub>3</sub> − k<sub>1</sub> − k<sub>2</sub> = 0</p>
        <p><span className="text-blue-400">η</span> = (8π² d<sub>eff</sub>² L²) / (ε₀ c n³ λ₃² A) × (P₁/A)</p>
        <p><span className="text-blue-400">P<sub>3</sub></span> = η · P₁ · P₂</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">λ₁ (nm)</span>
          <input type="number" value={lambda1} onChange={e => setLambda1(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">λ₂ (nm)</span>
          <input type="number" value={lambda2} onChange={e => setLambda2(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">d<sub>eff</sub> (pm/V)</span>
          <input type="number" value={deff} onChange={e => setDeff(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Crystal Length (mm)</span>
          <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">P₁ (mW)</span>
          <input type="number" value={power1} onChange={e => setPower1(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">P₂ (mW)</span>
          <input type="number" value={power2} onChange={e => setPower2(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
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
          <Plot data={lengthData} layout={lengthLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={tuningData} layout={tuningLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
