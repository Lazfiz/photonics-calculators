"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BeamQualityPage() {
  const [wavelength, setWavelength] = useState(1064); // nm
  const [m2, setM2] = useState(1.0);
  const [w0meas, setW0meas] = useState(50); // µm measured waist
  const [zRmeas, setZRmeas] = useState(7.4); // mm measured Rayleigh range

  const calc = useMemo(() => {
    // From measured data
    const lambdaMm = wavelength * 1e-6; // mm
    const w0real = Math.sqrt(m2) * Math.sqrt(lambdaMm * zRmeas / Math.PI); // µm
    const zRreal = zRmeas / m2; // mm for M²=1 equivalent
    const divergenceReal = wavelength / (Math.PI * w0real) * 1000; // mrad
    const divergenceMeas = m2 * divergenceReal;
    const bpp = w0real * divergenceReal / 2; // mm·mrad
    const bppMeas = w0meas * divergenceMeas / 2;
    const strehl = m2 <= 1 ? 1 : 1 / (m2 * m2);

    // Beam propagation w(z) for measured and ideal
    const zMax = zRmeas * 4;
    const N = 200;
    const zs = Array.from({ length: N }, (_, i) => -zMax + (2 * zMax * i) / (N - 1));
    const wIdeal = zs.map(z => w0real * Math.sqrt(1 + Math.pow(z / (zRmeas / m2), 2)));
    const wMeas = zs.map(z => w0meas * Math.sqrt(1 + Math.pow(z / zRmeas, 2)));

    return { w0real, zRreal, divergenceReal, divergenceMeas, bpp, bppMeas, strehl, zs, wIdeal, wMeas, zMax };
  }, [wavelength, m2, w0meas, zRmeas]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Beam Quality M² Measurement</h1>
      <p className="text-gray-400 mb-8">Detailed beam quality analysis from measured parameters.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">M² factor</span>
          <input type="number" value={m2} onChange={e => setM2(Math.max(1, +e.target.value))} step="0.01" min={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Measured waist (µm)</span>
          <input type="number" value={w0meas} onChange={e => setW0meas(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Measured Rayleigh range (mm)</span>
          <input type="number" value={zRmeas} onChange={e => setZRmeas(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Embedded Gaussian w₀</p>
          <p className="text-xl font-bold text-blue-400">{calc.w0real.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Real Divergence</p>
          <p className="text-xl font-bold text-green-400">{calc.divergenceReal.toFixed(2)} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">BPP (measured)</p>
          <p className="text-xl font-bold text-orange-400">{calc.bppMeas.toFixed(3)} mm·mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl Ratio (approx)</p>
          <p className="text-xl font-bold text-purple-400">{calc.strehl.toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          M² = π·w₀·θ / λ  |  BPP = w₀·θ = M²·λ/π  |  Strehl ≈ 1/M⁴
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={[
          { x: calc.zs, y: calc.wMeas, type: "scatter" as const, mode: "lines" as const, name: `Measured (M²=${m2})`, line: { color: "#f87171" } },
          { x: calc.zs, y: calc.wIdeal, type: "scatter" as const, mode: "lines" as const, name: "Embedded Gaussian (M²=1)", line: { color: "#60a5fa", dash: "dash" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "w(z) (µm)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
