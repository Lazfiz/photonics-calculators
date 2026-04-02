"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RetinalHazardPage() {
  const [power, setPower] = useState(10); // mW
  const [beamDiam, setBeamDiam] = useState(2); // mm
  const [cornealDiam, setCornealDiam] = useState(7); // mm
  const [divergence, setDivergence] = useState(1); // mrad

  const calc = useMemo(() => {
    const P = power * 1e-3; // W
    const w0 = (beamDiam / 2) * 1e-3; // m
    const rCornea = (cornealDiam / 2) * 1e-3; // m
    const theta = divergence * 1e-3; // rad
    const fEye = 17e-3; // m, effective focal length of eye

    // Retinal image diameter (diffraction-limited)
    const dRetinal = 2 * 1.22 * 550e-9 * fEye / (2 * w0); // m (using 550nm as eye peak)
    const wRetinal = dRetinal / 2;

    // Retinal spot area
    const Aretina = Math.PI * wRetinal * wRetinal;

    // Retinal irradiance
    const Iretina = P / Aretina;

    // Corneal irradiance
    const Acornea = Math.PI * rCornea * rCornea;
    const Icornea = P / Acornea;

    // Radiance (W/m²/sr) = P / (π * w0² * π*θ²) for Gaussian
    const L = P / (Math.PI * w0 * w0 * Math.PI * theta * theta);

    return {
      Iretina, Icornea, L, dRetinal: dRetinal * 1e6, // µm
      Aretina: Aretina * 1e12, // µm²
      Acornea: Acornea * 1e6, // mm²
    };
  }, [power, beamDiam, cornealDiam, divergence]);

  const chartData = useMemo(() => {
    const powers = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.5);
    const fEye = 17e-3;
    const w0 = (beamDiam / 2) * 1e-3;
    const theta = divergence * 1e-3;
    const dRet = 2 * 1.22 * 550e-9 * fEye / (2 * w0);
    const Aret = Math.PI * (dRet / 2) * (dRet / 2);

    const retIrr = powers.map(p => (p * 1e-3) / Aret);
    const corIrr = powers.map(p => (p * 1e-3) / (Math.PI * 3.5e-3 * 3.5e-3));

    return [
      { x: powers, y: retIrr, type: "scatter" as const, mode: "lines" as const, name: "Retinal", line: { color: "#f87171" }, yaxis: "y" },
      { x: powers, y: corIrr, type: "scatter" as const, mode: "lines" as const, name: "Corneal", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [beamDiam, divergence]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Retinal Hazard Calculator</h1>
      <p className="text-gray-400 mb-8">Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Corneal Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Diameter (mm)</span>
          <input type="number" value={beamDiam} onChange={e => setBeamDiam(+e.target.value)} min={0.1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Corneal Limiting Aperture (mm)</span>
          <input type="number" value={cornealDiam} onChange={e => setCornealDiam(+e.target.value)} min={1} max={11}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Divergence (mrad)</span>
          <input type="number" value={divergence} onChange={e => setDivergence(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retinal Irradiance</p>
          <p className="text-xl font-bold text-red-400">{calc.Iretina.toExponential(2)} W/m²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Corneal Irradiance</p>
          <p className="text-xl font-bold text-blue-400">{calc.Icornea.toExponential(2)} W/m²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retinal Spot Ø</p>
          <p className="text-xl font-bold text-yellow-400">{calc.dRetinal.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Radiance</p>
          <p className="text-xl font-bold text-green-400">{calc.L.toExponential(2)} W/m²/sr</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Power (mW)", gridcolor: "#374151" },
          yaxis: { title: "Retinal Irradiance (W/m²)", gridcolor: "#374151", color: "#f87171", side: "left" },
          yaxis2: { title: "Corneal Irradiance (W/m²)", gridcolor: "#374151", color: "#60a5fa", overlaying: "y", side: "right" },
          margin: { t: 30, r: 70, b: 50, l: 70 }, legend: { x: 0.02, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
