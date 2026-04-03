"use client";

import { useState } from "react";
import Link from "next/link";

interface Material {
  name: string;
  n2_cm2_W: number; // nonlinear index in cm²/W
  type: string;
  notes: string;
}

const materials: Material[] = [
  { name: "Fused Silica", n2_cm2_W: 2.6e-16, type: "Glass", notes: "Most common fiber material" },
  { name: "BK7", n2_cm2_W: 3.4e-16, type: "Glass", notes: "Borosilicate crown glass" },
  { name: "SF11", n2_cm2_W: 4.1e-16, type: "Glass", notes: "High-index flint glass" },
  { name: "SF57", n2_cm2_W: 4.7e-16, type: "Glass", notes: "Very high n₂ glass" },
  { name: "BBO", n2_cm2_W: 3.4e-16, type: "Crystal", notes: "Beta-barium borate" },
  { name: "LiNbO₃", n2_cm2_W: 1.4e-15, type: "Crystal", notes: "Lithium niobate, high n₂" },
  { name: "KDP", n2_cm2_W: 1.7e-16, type: "Crystal", notes: "Potassium dihydrogen phosphate" },
  { name: "Si (1.55µm)", n2_cm2_W: 4.5e-14, type: "Semiconductor", notes: "Silicon at telecom, very high" },
  { name: "GaAs", n2_cm2_W: 1.0e-13, type: "Semiconductor", notes: "Gallium arsenide" },
  { name: "AlGaAs", n2_cm2_W: 1.2e-13, type: "Semiconductor", notes: "Aluminum gallium arsenide" },
  { name: "CS₂", n2_cm2_W: 3.2e-15, type: "Liquid", notes: "Carbon disulfide, reference liquid" },
  { name: "Water", n2_cm2_W: 6.7e-16, type: "Liquid", notes: "D₂O, reference" },
  { name: "Air (1 atm)", n2_cm2_W: 3.2e-19, type: "Gas", notes: "Atmospheric pressure" },
  { name: "Chalcogenide", n2_cm2_W: 2.0e-13, type: "Glass", notes: "As₂S₃ type IR glass" },
  { name: "Diamond", n2_cm2_W: 1.3e-15, type: "Crystal", notes: "CVD diamond" },
];

export default function NonlinearIndexPage() {
  const [n2, setN2] = useState(2.6e-16);
  const [intensity, setIntensity] = useState(1e12); // W/cm²
  const [wavelength, setWavelength] = useState(1550);

  const dn = n2 * intensity;
  const gamma = (2 * Math.PI * n2) / (wavelength * 1e-9 * 1e-4); // convert nm to m, cm²/W to m²/W → 1/(W·m)
  // Actually: γ = n₂ω/c = n₂·2π/(λ·c) in units of 1/(W·m) when n₂ in m²/W
  // Let's keep it simple: show Δn and self-phase modulation

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Nonlinear Refractive Index (n₂)</h1>
      <p className="text-gray-400 mb-6">Kerr effect: Δn = n₂ · I, where I is the optical intensity</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">n₂ (cm²/W)</label>
          <input type="text" value={n2.toExponential(2)} onChange={e => setN2(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Intensity I (W/cm²)</label>
          <input type="text" value={intensity.toExponential(2)} onChange={e => setIntensity(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn = n₂ · I</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{dn.toExponential(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SPM phase (per cm)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{(2 * Math.PI * dn / (wavelength * 1e-7)).toFixed(2)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">γ (nonlinear coeff.)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{(n2 * 1e-4 * 2 * Math.PI / (wavelength * 1e-9)).toExponential(2)} W⁻¹m⁻¹</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Reference Values (n₂ in cm²/W)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2 px-3">Material</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">n₂ (cm²/W)</th>
              <th className="text-left py-2 px-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {materials.sort((a, b) => b.n2_cm2_W - a.n2_cm2_W).map((m, i) => (
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer ${n2 === m.n2_cm2_W ? "bg-blue-900/20" : ""}`}
                onClick={() => { setN2(m.n2_cm2_W); }}>
                <td className="py-2 px-3 font-medium">{m.name}</td>
                <td className="py-2 px-3 text-gray-400">{m.type}</td>
                <td className="py-2 px-3 text-right font-mono text-blue-400">{m.n2_cm2_W.toExponential(1)}</td>
                <td className="py-2 px-3 text-gray-500">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
