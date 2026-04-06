"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function AmplitudeSplittingPage() {
  const [n1, setN1] = useState(1.0);
  const [nFilm, setNFilm] = useState(1.38);
  const [n2, setN2] = useState(1.52);
  const [thickness, setThickness] = useState(200);
  const [wavelength, setWavelength] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    const r01 = (n1 - nFilm) / (n1 + nFilm);
    const r12 = (nFilm - n2) / (nFilm + n2);
    const t01 = 2 * n1 / (n1 + nFilm);
    const t10 = 2 * nFilm / (n1 + nFilm);

    // Sum multiple reflected beams (amplitude splitting)
    const reflected = wls.map(wl => {
      const delta = (4 * Math.PI * nFilm * thickness) / wl;
      // Sum N internal reflections
      const N = 20;
      let re = r01;
      let im = 0;
      for (let m = 1; m <= N; m++) {
        const phase = -m * delta;
        const amp = Math.pow(t01 * t10 * r12, m) * Math.pow(r12, m - 1);
        re += amp * Math.cos(phase);
        im += amp * Math.sin(phase);
      }
      return re * re + im * im;
    });
    const transmitted = wls.map(wl => {
      const delta = (4 * Math.PI * nFilm * thickness) / wl;
      const t01 = 2 * n1 / (n1 + nFilm);
      const t12 = 2 * nFilm / (nFilm + n2);
      // Multiple beam transmission
      let re = 0, im = 0;
      for (let m = 0; m < 20; m++) {
        const phase = -m * delta;
        const amp = t01 * t12 * Math.pow(r01 * r12, m);
        re += amp * Math.cos(phase);
        im += amp * Math.sin(phase);
      }
      return re * re + im * im;
    });
    return [
      { x: wls, y: reflected, type: "scatter" as const, mode: "lines" as const, name: "Reflected", line: { color: "#f87171" } },
      { x: wls, y: transmitted, type: "scatter" as const, mode: "lines" as const, name: "Transmitted", line: { color: "#60a5fa" } },
    ];
  }, [n1, nFilm, n2, thickness]);

  const r01 = (n1 - nFilm) / (n1 + nFilm);
  const r12 = (nFilm - n2) / (nFilm + n2);
  const F = 4 * r01 * r12 / ((1 - r01 * r12) ** 2);
  const finesse = Math.PI * Math.sqrt(Math.max(F, 0)) / 2;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Amplitude Splitting" description="Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₁ (incident)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (film)</span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₂ (substrate)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="10" min="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₀₁</p>
          <p className="text-xl font-bold text-green-400">{r01.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₁₂</p>
          <p className="text-xl font-bold text-blue-400">{r12.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coefficient F</p>
          <p className="text-xl font-bold text-yellow-400">{F.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-xl font-bold text-red-400">{finesse.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Amplitude Splitting Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Eᵣ = r₀₁ + t₀₁t₁₀r₁₂e^(−iδ) + t₀₁t₁₀r₁₂²r₁₀e^(−2iδ) + ...</p>
          <p>Airy function: R = F·sin²(δ/2) / (1 + F·sin²(δ/2))</p>
          <p>F = 4R₁R₂ / (1 − R₁R₂)²</p>
          <p>Finesse ℱ = π√F / 2</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (normalized)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
