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
    const sinTheta0 = Math.sin(theta);

    const R = wls.map(wl => {
      const N2 = nFilm + 1j * kFilm;
      const d = thickness * 1e-9;
      const lambda = wl * 1e-9;

      // Snell's law
      const sinTheta2 = nInc * sinTheta0 / N2;
      const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);
      const sinTheta3 = nInc * sinTheta0 / nSub;
      const cosTheta3 = Math.sqrt(1 - sinTheta3 * sinTheta3);

      // s-polarization
      const rs01 = (nInc * cosTheta0 - N2 * cosTheta2) / (nInc * cosTheta0 + N2 * cosTheta2);
      const rs12 = (N2 * cosTheta2 - nSub * cosTheta3) / (N2 * cosTheta2 + nSub * cosTheta3);
      const delta2 = (2 * Math.PI * N2 * d * cosTheta2) / lambda;
      const phase2 = Math.exp(2j * delta2);
      const rs = (rs01 + rs12 * phase2) / (1 + rs01 * rs12 * phase2);

      // p-polarization
      const rp01 = (N2 * cosTheta0 - nInc * cosTheta2) / (N2 * cosTheta0 + nInc * cosTheta2);
      const rp12 = (nSub * cosTheta2 - N2 * cosTheta3) / (nSub * cosTheta2 + N2 * cosTheta3);
      const rp = (rp01 + rp12 * phase2) / (1 + rp01 * rp12 * phase2);

      const Rs = Math.pow(Math.abs(rs), 2);
      const Rp = Math.pow(Math.abs(rp), 2);
      return { Rs, Rp, Ravg: (Rs + Rp) / 2 };
    });

    const T = wls.map(wl => {
      const N2 = nFilm + 1j * kFilm;
      const d = thickness * 1e-9;
      const lambda = wl * 1e-9;
      const sinTheta2 = nInc * sinTheta0 / N2;
      const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);
      const sinTheta3 = nInc * sinTheta0 / nSub;
      const cosTheta3 = Math.sqrt(1 - sinTheta3 * sinTheta3);

      const ts01 = 2 * nInc * cosTheta0 / (nInc * cosTheta0 + N2 * cosTheta2);
      const ts12 = 2 * N2 * cosTheta2 / (N2 * cosTheta2 + nSub * cosTheta3);
      const delta2 = (2 * Math.PI * N2 * d * cosTheta2) / lambda;
      const phase2 = Math.exp(1j * delta2);
      const ts = ts01 * ts12 * phase2 / (1 + (nInc * cosTheta0 - N2 * cosTheta2) / (nInc * cosTheta0 + N2 * cosTheta2) * (N2 * cosTheta2 - nSub * cosTheta3) / (N2 * cosTheta2 + nSub * cosTheta3) * Math.exp(2j * delta2));

      const Re_N2cos2 = N2.real * cosTheta2.real;
      const Ts = Math.pow(Math.abs(ts), 2) * (nSub * Math.abs(cosTheta3)) / (nInc * cosTheta0);
      return Math.min(Math.max(Ts, 0), 1);
    });

    const A = wls.map((_, i) => Math.max(0, 1 - R[i].Ravg - T[i]));

    return [
      { x: wls, y: R.map(r => r.Rs), type: "scatter" as const, mode: "lines" as const, name: "Rs", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: R.map(r => r.Rp), type: "scatter" as const, mode: "lines" as const, name: "Rp", line: { color: "#fbbf24", dash: "dash" } },
      { x: wls, y: R.map(r => r.Ravg), type: "scatter" as const, mode: "lines" as const, name: "R avg", line: { color: "#f87171" } },
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
