"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BendInsensitivePage() {
  const [radius, setRadius] = useState(7.5); // mm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [trenchDepth, setTrenchDepth] = useState(0.018); // Δ (trench relative index)
  const [trenchWidth, setTrenchWidth] = useState(5); // μm
  const [hasTrench, setHasTrench] = useState(true);

  // Standard SMF parameters
  const n1 = 1.4682; const n2 = 1.4629;
  const a = 4.1; // core radius μm
  const delta = (n1 - n2) / n1;

  const calc = useMemo(() => {
    const R = radius * 1e-3;
    const lam = wavelength * 1e-9;
    const NA = Math.sqrt(n1 * n1 - n2 * n2);

    // Standard SMF bend loss (Marcuse simplified)
    const gamma_std = (2 * delta * n1 * 2 * Math.PI / lam) * 1.75;
    const loss_std = (1.5 / (2 * a * 1e-6)) * Math.exp(-R * gamma_std);
    const loss_std_dB = 10 * Math.log10(Math.exp(1)) * loss_std;

    // Bend-insensitive fiber with trench
    let loss_bi_dB = loss_std_dB;
    if (hasTrench) {
      // Trench reduces bend loss exponentially based on trench parameters
      // Effective improvement factor: exp(2 * Δ_trench * k * w_trench)
      const k = 2 * Math.PI * n2 / lam;
      const improvement = Math.exp(2 * trenchDepth * k * trenchWidth * 1e-6);
      loss_bi_dB = loss_std_dB / improvement;
    }

    // ITU-T G.657 categories
    const ratio = loss_std_dB / Math.max(loss_bi_dB, 1e-30);
    let category = "G.657.A1";
    if (radius <= 5 && loss_bi_dB < 0.1) category = "G.657.B3";
    else if (radius <= 7.5 && loss_bi_dB < 0.5) category = "G.657.B2";
    else if (radius <= 10 && loss_bi_dB < 1.0) category = "G.657.A2";

    return { loss_std_dB, loss_bi_dB, NA, ratio, category };
  }, [radius, wavelength, hasTrench, trenchDepth, trenchWidth]);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 100 }, (_, i) => 3 + i * 0.3);
    const lam = wavelength * 1e-9;
    const gamma_std = (2 * delta * n1 * 2 * Math.PI / lam) * 1.75;

    const stdLosses = radii.map(R => {
      const loss = (1.5 / (2 * a * 1e-6)) * Math.exp(-(R * 1e-3) * gamma_std);
      return 10 * Math.log10(Math.exp(1)) * loss;
    });

    const biLosses = radii.map((R, i) => {
      if (!hasTrench) return stdLosses[i];
      const k = 2 * Math.PI * n2 / lam;
      const improvement = Math.exp(2 * trenchDepth * k * trenchWidth * 1e-6);
      return stdLosses[i] / improvement;
    });

    return [
      { x: radii, y: stdLosses, type: "scatter" as const, mode: "lines" as const, name: "Standard SMF", line: { color: "#f87171", width: 2 } },
      { x: radii, y: biLosses, type: "scatter" as const, mode: "lines" as const, name: "Bend-Insensitive", line: { color: "#34d399", width: 2 } },
      { x: [radius, radius], y: [1e-4, 10], type: "scatter" as const, mode: "lines" as const, name: "Current R", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [radius, wavelength, hasTrench, trenchDepth, trenchWidth]);

  const improvementData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 5 + i * 0.5);
    const lam = wavelength * 1e-9;
    const gamma_std = (2 * delta * n1 * 2 * Math.PI / lam) * 1.75;
    const k = 2 * Math.PI * n2 / lam;

    const depths = [0.01, 0.015, 0.018, 0.025];
    return depths.map(td => ({
      x: radii,
      y: radii.map(R => {
        const loss = (1.5 / (2 * a * 1e-6)) * Math.exp(-(R * 1e-3) * gamma_std);
        const loss_dB = 10 * Math.log10(Math.exp(1)) * loss;
        const imp = Math.exp(2 * td * k * trenchWidth * 1e-6);
        return loss_dB / imp;
      }),
      type: "scatter" as const, mode: "lines" as const,
      name: `Δ=${td}`, line: { width: 1.5 },
    }));
  }, [wavelength, trenchWidth]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Bend-Insensitive Fiber Design</h1>
      <p className="text-gray-400 mb-8">Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Bend Radius (mm)</span>
          <input type="number" value={radius} onChange={e => setRadius(+e.target.value)} min={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={800} max={1700}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm flex items-center gap-2">
            Depressed Trench
            <input type="checkbox" checked={hasTrench} onChange={e => setHasTrench(e.target.checked)} className="rounded" />
          </span>
        </label>
        {hasTrench && (
          <>
            <label className="block">
              <span className="text-gray-300 text-sm">Trench Depth Δ</span>
              <input type="number" value={trenchDepth} onChange={e => setTrenchDepth(+e.target.value)} min={0.001} max={0.05} step="0.001"
                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Trench Width (μm)</span>
              <input type="number" value={trenchWidth} onChange={e => setTrenchWidth(+e.target.value)} min={1} max={20}
                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Std SMF Loss</p>
          <p className="text-xl font-bold text-red-400">{calc.loss_std_dB < 0.001 ? "<0.001" : calc.loss_std_dB.toFixed(3)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">BI Fiber Loss</p>
          <p className="text-xl font-bold text-green-400">{calc.loss_bi_dB < 0.001 ? "<0.001" : calc.loss_bi_dB.toFixed(4)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Improvement</p>
          <p className="text-xl font-bold text-yellow-400">{calc.ratio > 1000 ? ">1000×" : `${calc.ratio.toFixed(0)}×`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ITU-T Category</p>
          <p className="text-xl font-bold text-blue-400">{calc.category}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Bend Loss vs Radius</h3>
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Bend Radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/turn)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} config={{ displayModeBar: false }} />
      </div>

      {hasTrench && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold mb-3">Trench Depth Effect on Bend Loss</h3>
          <Plot data={improvementData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Bend Radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "BI Fiber Loss (dB/turn)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 300,
            legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          }} config={{ displayModeBar: false }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>α_bend ≈ C₁/a · exp(-2Rγ) [Marcuse]</p>
          <p>γ = (2Δn₁k₀)(2.748 - 0.996λ/λ_c)</p>
          <p>Improvement = exp(2Δ_trench · k · w_trench)</p>
          <p>G.657.A: ≤0.75 dB @ R=10mm, G.657.B: ≤0.25 dB @ R=7.5mm</p>
        </div>
      </div>
    </div>
  );
}
