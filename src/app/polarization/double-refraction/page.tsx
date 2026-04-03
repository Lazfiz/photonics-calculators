"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DoubleRefractionPage() {
  const [wavelength, setWavelength] = useState(589);
  const [nO, setNO] = useState(1.658);
  const [nE, setNE] = useState(1.486);
  const [thickness, setThickness] = useState(10); // mm
  const [angleOfIncidence, setAngleOfIncidence] = useState(0);

  const dn = nO - nE;
  const d = thickness; // mm

  // Snell's law for o-ray and e-ray
  const thetaI = angleOfIncidence * Math.PI / 180;

  // Ordinary ray: isotropic, Snell's law normal
  const sinThetaO = Math.sin(thetaI) / nO;
  const thetaO = Math.asin(Math.abs(sinThetaO) <= 1 ? sinThetaO : 0);

  // Extraordinary ray: direction-dependent index
  // n_e(θ) = (n_o · n_e) / √(n_o² sin²θ + n_e² cos²θ) for uniaxial
  // Walk-off angle ρ between Poynting vector and wave normal
  const cosThetaE = thetaI === 0 ? 1 : Math.cos(thetaI);
  const sinThetaE = thetaI === 0 ? 0 : Math.sin(thetaI);
  const neEffective = thetaI === 0 ? nE :
    (nO * nE) / Math.sqrt(nO ** 2 * sinThetaE ** 2 + nE ** 2 * cosThetaE ** 2);

  // Walk-off angle
  const rho = thetaI === 0 ? 0 : Math.atan(
    (Math.sin(thetaI) * Math.cos(thetaI) * (nO ** 2 - nE ** 2)) /
    (nO ** 2 * Math.cos(thetaI) ** 2 + nE ** 2 * Math.sin(thetaI) ** 2)
  );

  // Lateral separation of o and e rays at exit
  const lateralSep = d * Math.tan(Math.abs(rho));

  // Optical path difference
  const opdO = nO * d;
  const opdE = neEffective * d;
  const opd = opdO - opdE;

  // Phase retardation
  const lambdaMm = wavelength * 1e-6;
  const delta = (2 * Math.PI * Math.abs(opd)) / lambdaMm;

  // Angular scan
  const angularData = useMemo(() => {
    const angles = Array.from({ length: 300 }, (_, i) => (i / 300) * 80);
    const neff = angles.map(a => {
      const t = a * Math.PI / 180;
      if (a === 0) return nE;
      return (nO * nE) / Math.sqrt(nO ** 2 * Math.sin(t) ** 2 + nE ** 2 * Math.cos(t) ** 2);
    });
    const walkoff = angles.map(a => {
      const t = a * Math.PI / 180;
      if (a === 0) return 0;
      return Math.atan(
        (Math.sin(t) * Math.cos(t) * (nO ** 2 - nE ** 2)) /
        (nO ** 2 * Math.cos(t) ** 2 + nE ** 2 * Math.sin(t) ** 2)
      ) * 180 / Math.PI;
    });
    return [
      { x: angles, y: neff, type: "scatter" as const, mode: "lines" as const, name: "n_eff(θ)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: walkoff, type: "scatter" as const, mode: "lines" as const, name: "Walk-off (°)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [nO, nE]);

  const thicknessData = useMemo(() => {
    const ths = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 200) * 30);
    const sep = ths.map(t => t * Math.tan(Math.abs(rho)));
    const ret = ths.map(t => (2 * Math.PI * Math.abs(nO - neEffective) * t) / lambdaMm);
    return [
      { x: ths, y: sep, type: "scatter" as const, mode: "lines" as const, name: "Lateral sep (mm)", line: { color: "#fbbf24", width: 2 } },
      { x: ths, y: ret, type: "scatter" as const, mode: "lines" as const, name: "Retardation (rad)", line: { color: "#a78bfa", width: 2 }, yaxis: "y2" },
    ];
  }, [nO, neEffective, rho, lambdaMm]);

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + (i / 300) * 1500);
    const opds = wls.map(w => Math.abs(opd));
    const rets = wls.map(w => (2 * Math.PI * Math.abs(opd)) / (w * 1e-6));
    return [
      { x: wls, y: rets.map(r => r / Math.PI), type: "scatter" as const, mode: "lines" as const, name: "Retardation (waves)", line: { color: "#34d399", width: 2 } },
    ];
  }, [opd]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Double Refraction (Birefringence)</h1>
      <p className="text-gray-400 mb-8">Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">n<sub>eff</sub>(θ) = n<sub>o</sub>n<sub>e</sub>/√(n<sub>o</sub>²sin²θ + n<sub>e</sub>²cos²θ)</p>
        <p className="text-gray-300 text-sm font-mono">ρ = arctan(sinθ·cosθ·(n<sub>o</sub>²-n<sub>e</sub>²)/(n<sub>o</sub>²cos²θ+n<sub>e</sub>²sin²θ))</p>
        <p className="text-gray-300 text-sm font-mono">OPD = (n<sub>o</sub> - n<sub>eff</sub>)·d, δ = 2π·OPD/λ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10" min="300" max="1800"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">n<sub>o</sub></span>
          <input type="number" value={nO} onChange={e => setNO(+e.target.value)} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">n<sub>e</sub></span>
          <input type="number" value={nE} onChange={e => setNE(+e.target.value)} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Thickness (mm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="1" min="0.5" max="50"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Angle of Incidence (°)</span>
          <input type="number" value={angleOfIncidence} onChange={e => setAngleOfIncidence(+e.target.value)} step="1" min="0" max="80"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.658); setNE(1.486); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNO(1.973); setNE(2.165); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Rutile</button>
        <button onClick={() => { setNO(2.3); setNE(2.1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">LiNbO₃</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>eff</sub></p>
          <p className="text-2xl font-bold text-blue-400">{neEffective.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Walk-off Angle</p>
          <p className="text-2xl font-bold text-yellow-400">{(rho * 180 / Math.PI).toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Separation</p>
          <p className="text-2xl font-bold text-green-400">{lateralSep.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardation</p>
          <p className="text-2xl font-bold text-purple-400">{(delta / Math.PI).toFixed(2)}π rad</p>
          <p className="text-xs text-gray-500">OPD = {opd.toFixed(3)} mm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">n<sub>eff</sub> & Walk-off vs Angle</h3>
          <Plot data={angularData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "n_eff", gridcolor: "#374151" },
            yaxis2: { title: "Walk-off (°)", overlaying: "y", side: "right", gridcolor: "transparent" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 300,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Separation & Retardation vs Thickness</h3>
          <Plot data={thicknessData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Thickness (mm)", gridcolor: "#374151" },
            yaxis: { title: "Separation (mm)", gridcolor: "#374151" },
            yaxis2: { title: "Retardation (rad)", overlaying: "y", side: "right", gridcolor: "transparent" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 300,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Retardation vs Wavelength</h3>
        <Plot data={spectralData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Retardation (waves of λ)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 50 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
