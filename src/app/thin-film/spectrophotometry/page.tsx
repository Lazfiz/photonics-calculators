"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SpectrophotometryPage() {
  const [nFilm, setNFilm] = useState(1.46);
  const [kFilm, setKFilm] = useState(0.001);
  const [nSub, setNSub] = useState(1.52);
  const [thickness, setThickness] = useState(100);
  const [angleDeg, setAngleDeg] = useState(0);
  const [nInc, setNInc] = useState(1.0);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 1000 / 400);
    const theta = angleDeg * Math.PI / 180;
    const cosTheta0 = Math.cos(theta);

    // Simplified thin-film Fresnel using real-valued approximation
    // Ignores extinction (kFilm≈0) for the phase calculation but includes absorption loss
    const sinTheta2 = nInc * Math.sin(theta) / nFilm;
    const cosTheta2 = Math.sqrt(Math.max(0, 1 - sinTheta2 * sinTheta2));
    const sinTheta3 = nInc * Math.sin(theta) / nSub;
    const cosTheta3 = Math.sqrt(Math.max(0, 1 - sinTheta3 * sinTheta3));

    // Interface Fresnel coefficients (real, s-pol)
    const rs01 = (nInc * cosTheta0 - nFilm * cosTheta2) / (nInc * cosTheta0 + nFilm * cosTheta2);
    const rs12 = (nFilm * cosTheta2 - nSub * cosTheta3) / (nFilm * cosTheta2 + nSub * cosTheta3);
    // p-pol
    const rp01 = (nFilm * cosTheta0 - nInc * cosTheta2) / (nFilm * cosTheta0 + nInc * cosTheta2);
    const rp12 = (nSub * cosTheta2 - nFilm * cosTheta3) / (nSub * cosTheta2 + nFilm * cosTheta3);

    const RsVals = wls.map(wl => {
      const d = thickness * 1e-9;
      const lambda = wl * 1e-9;
      const delta = (2 * Math.PI * nFilm * d * cosTheta2) / lambda;
      // |r_total|² using cos/sin for real part of e^(2iδ)
      const cos2d = Math.cos(2 * delta);
      const sin2d = Math.sin(2 * delta);
      const rs = (rs01 + rs12 * cos2d) / (1 + rs01 * rs12 * cos2d);
      const rsIm = (rs12 * sin2d) / (1 + rs01 * rs12 * cos2d);
      return rs * rs + rsIm * rsIm;
    });

    const RpVals = wls.map(wl => {
      const d = thickness * 1e-9;
      const lambda = wl * 1e-9;
      const delta = (2 * Math.PI * nFilm * d * cosTheta2) / lambda;
      const cos2d = Math.cos(2 * delta);
      const sin2d = Math.sin(2 * delta);
      const rp = (rp01 + rp12 * cos2d) / (1 + rp01 * rp12 * cos2d);
      const rpIm = (rp12 * sin2d) / (1 + rp01 * rp12 * cos2d);
      return rp * rp + rpIm * rpIm;
    });

    const Ravg = wls.map((_, i) => (RsVals[i] + RpVals[i]) / 2);

    // Transmission (simplified: T ≈ 1 - R - A, where A from k)
    const absorptionCoeff = 4 * Math.PI * kFilm / 550 * 1e7; // cm⁻¹ at 550nm reference
    const T = wls.map((_, i) => {
      const d_cm = thickness * 1e-7;
      const T_absorption = Math.exp(-absorptionCoeff * d_cm);
      return Math.min(Math.max((1 - Ravg[i]) * T_absorption, 0), 1);
    });

    const A = wls.map((_, i) => Math.max(0, 1 - Ravg[i] - T[i]));

    return [
      { x: wls, y: RsVals, type: "scatter" as const, mode: "lines" as const, name: "Rs", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: RpVals, type: "scatter" as const, mode: "lines" as const, name: "Rp", line: { color: "#fbbf24", dash: "dash" } },
      { x: wls, y: Ravg, type: "scatter" as const, mode: "lines" as const, name: "R avg", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "T", line: { color: "#60a5fa" } },
      { x: wls, y: A, type: "scatter" as const, mode: "lines" as const, name: "A", line: { color: "#34d399" } },
    ];
  }, [nFilm, kFilm, nSub, thickness, angleDeg, nInc]);

  // Optical thickness info
  const opticalThickness = nFilm * thickness;
  const orderNumber = Math.round(2 * nFilm * thickness / 550);
  const qwoThickness = 550 / (4 * nFilm);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Spectrophotometry</h1>
      <p className="text-gray-400 mb-8">Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>film</sub></span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">k<sub>film</sub> (extinction)</span>
          <input type="number" value={kFilm} onChange={e => setKFilm(+e.target.value)} step="0.001" min="0" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Angle of Incidence (°)</span>
          <input type="number" value={angleDeg} onChange={e => setAngleDeg(+e.target.value)} step="1" min="0" max="90" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Optical Thickness (nd): <span className="text-blue-400 font-mono">{opticalThickness.toFixed(1)} nm</span></p>
        <p className="text-gray-300">QWOT at 550 nm: <span className="text-blue-400 font-mono">{qwoThickness.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Half-wave order at 550 nm: <span className="text-blue-400 font-mono">{orderNumber}</span></p>
        <p className="text-gray-300">Absorption coeff α: <span className="text-blue-400 font-mono">{(4 * Math.PI * kFilm / 550 * 1e7).toFixed(0)} cm⁻¹</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>N = n + ik (complex refractive index)</p>
        <p>r<sub>01</sub> = (n₁cosθ₁ − N₂cosθ₂)/(n₁cosθ₁ + N₂cosθ₂) (s-pol Fresnel)</p>
        <p>r<sub>total</sub> = (r₀₁ + r₁₂·e<sup>2iδ</sup>)/(1 + r₀₁·r₁₂·e<sup>2iδ</sup>) (thin film)</p>
        <p>δ = 2πN₂d·cosθ₂/λ (phase thickness)</p>
        <p>A = 1 − R − T (energy conservation)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} className="w-full" style={{ height: 450 }} />
    </div>
  );
}
