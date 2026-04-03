"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function KerrLensPage() {
  const [wavelength, setWavelength] = useState(800); // nm
  const [beamWaist, setBeamWaist] = useState(50); // µm
  const [n2, setN2] = useState(3.2); // ×10⁻¹⁶ cm²/W (Ti:Sapphire)
  const [power, setPower] = useState(1); // W
  const [crystalLength, setCrystalLength] = useState(2); // mm
  const [n0, setN0] = useState(1.76); // refractive index

  const k = 2 * Math.PI / (wavelength * 1e-3); // 1/µm
  const Pcr = 3.77 * Math.pow(wavelength * 1e-3, 2) / (8 * Math.PI * n0 * n2 * 1e-4); // critical power in W (n2 in cm²/W → µm²/W)

  // Effective focal length of Kerr lens
  const fKerr = n0 * Math.PI * Math.pow(beamWaist, 4) / (4 * n2 * 1e-4 * power * crystalLength * 1e3);

  // Beam radius change vs power
  const chartData = useMemo(() => {
    const powers = Array.from({ length: 200 }, (_, i) => 0.01 + i * 5 / 200);
    const wPerturbed = powers.map(P => {
      const fk = n0 * Math.PI * Math.pow(beamWaist, 4) / (4 * n2 * 1e-4 * P * crystalLength * 1e3);
      const lensEffect = 1 / (1 + Math.pow(crystalLength * 1e3 / (2 * fk), 2));
      return beamWaist * (1 - 0.5 * lensEffect * n2 * 1e-4 * P * crystalLength * 1e3 / (n0 * Math.PI * Math.pow(beamWaist, 2)));
    });

    return [
      { x: powers, y: wPerturbed, type: "scatter", mode: "lines", name: "Beam waist w(P)", line: { color: "#60a5fa", width: 2 } },
      { x: [Pcr, Pcr], y: [wPerturbed[0] * 0.95, wPerturbed[wPerturbed.length - 1] * 1.05], type: "scatter", mode: "lines", name: "P_crit", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, beamWaist, n2, crystalLength, n0, Pcr]);

  // GDD from Kerr effect
  const gdd = n2 * 1e-4 * power * crystalLength * 1e3 / (Math.PI * Math.pow(beamWaist, 2) * 3e8); // fs²
  const selfPhase = (2 * Math.PI / (wavelength * 1e-3)) * n2 * 1e-4 * power * crystalLength * 1e3; // rad

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Power (W)", gridcolor: "#374151" },
    yaxis: { title: "Beam waist (µm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Kerr Lens Mode Locking</h1>
      <p className="text-gray-400 mb-8">Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.</p>

      {/* Formulas */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">n(I)</span> = n₀ + n₂ · I</p>
        <p><span className="text-blue-400">P_crit</span> = 3.77 λ² / (8π n₀ n₂)</p>
        <p><span className="text-blue-400">f_Kerr</span> ≈ n₀ π w₀⁴ / (4 n₂ P L)</p>
        <p><span className="text-blue-400">Δφ_NL</span> = k · n₂ · I · L</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Beam Waist w₀ (µm)</span>
          <input type="number" value={beamWaist} onChange={e => setBeamWaist(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n₀ (linear index)</span>
          <input type="number" value={n0} onChange={e => setN0(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n₂ (×10⁻¹⁶ cm²/W)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Power (W)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Crystal Length (mm)</span>
          <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Power P<sub>crit</sub></p>
          <p className="text-xl font-bold text-blue-400">{Pcr.toFixed(2)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Kerr Focal Length</p>
          <p className="text-xl font-bold text-green-400">{fKerr > 1e6 ? "∞" : (fKerr < 1e3 ? fKerr.toFixed(1) + " µm" : (fKerr / 1e3).toFixed(2) + " mm")}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Self-Phase Δφ<sub>NL</sub></p>
          <p className="text-xl font-bold text-orange-400">{selfPhase.toFixed(4)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">P / P<sub>crit</sub></p>
          <p className="text-xl font-bold text-purple-400">{(power / Pcr * 1e6).toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <Plot data={chartData} layout={plotLayout} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
