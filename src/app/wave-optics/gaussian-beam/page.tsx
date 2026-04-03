"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function GaussianBeamPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [waist, setWaist] = useState(10); // µm

  const zR = Math.PI * Math.pow(waist, 2) / wavelength * 1000; // mm (waist in µm, λ in nm)
  const divergence = wavelength / (Math.PI * waist) * 1000; // mrad
  const farFieldAngle = divergence;

  const chartData = useMemo(() => {
    const zMax = zR * 4;
    const zs = Array.from({ length: 200 }, (_, i) => -zMax + i * 2 * zMax / 200);
    const w = zs.map(z => waist * Math.sqrt(1 + Math.pow(z / zR, 2)));
    const R = zs.map(z => z === 0 ? Infinity : z * (1 + Math.pow(zR / z, 2)));
    return [
      { x: zs, y: w, type: "scatter" as const, mode: "lines" as const, name: "Beam radius w(z)", line: { color: "#60a5fa" } },
      { x: [0, 0], y: [0, waist], type: "scatter" as const, mode: "lines" as const, name: "Waist", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, waist, zR]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Gaussian Beam Propagation" description="Beam parameter evolution along the propagation axis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Beam Waist w₀ (µm)</span>
          <input type="number" value={waist} onChange={e => setWaist(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range z<sub>R</sub></p>
          <p className="text-xl font-bold text-blue-400">{zR.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Far-field Divergence</p>
          <p className="text-xl font-bold text-green-400">{divergence.toFixed(2)} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Parameter Product</p>
          <p className="text-xl font-bold text-orange-400">{(waist * divergence / 2).toFixed(3)} mm·mrad</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "w(z) (µm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
