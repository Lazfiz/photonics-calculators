"use client";

import { useState } from "react";
import Link from "next/link";

interface Material {
  name: string;
  p11: number; // Brewster coefficients
  p12: number;
  p44: number;
  type: string;
  notes: string;
}

const materials: Material[] = [
  { name: "Fused Silica", p11: 0.121, p12: 0.270, p44: -0.075, type: "Glass", notes: "Stress-optic coefficient C = -3.5×10⁻¹² Pa⁻¹" },
  { name: "BK7", p11: 0.113, p12: 0.252, p44: -0.070, type: "Glass", notes: "Borosilicate crown" },
  { name: "SF11", p11: 0.260, p12: 0.290, p44: -0.015, type: "Glass", notes: "High-index flint" },
  { name: "Schott SF6", p11: 0.280, p12: 0.300, p44: -0.010, type: "Glass", notes: "Dense flint" },
  { name: "Si", p11: -0.094, p12: 0.017, p44: -0.051, type: "Semiconductor", notes: "Silicon @ 1.15µm" },
  { name: "Ge", p11: -0.151, p12: -0.083, p44: -0.034, type: "Semiconductor", notes: "Germanium @ 10.6µm" },
  { name: "GaAs", p11: -0.165, p12: -0.140, p44: -0.058, type: "Semiconductor", notes: "@ 1.15µm" },
  { name: "Quartz (SiO₂)", p11: 0.160, p12: 0.270, p44: -0.055, type: "Crystal", notes: "α-quartz" },
  { name: "LiNbO₃", p11: -0.026, p12: 0.090, p44: 0.067, type: "Crystal", notes: "Lithium niobate" },
  { name: "CaF₂", p11: 0.058, p12: 0.230, p44: -0.086, type: "Crystal", notes: "Calcium fluoride" },
  { name: "BaF₂", p11: 0.100, p12: 0.280, p44: -0.090, type: "Crystal", notes: "Barium fluoride" },
  { name: "Diamond", p11: -0.125, p12: 0.325, p44: -0.225, type: "Crystal", notes: "CVD diamond" },
  { name: "ZnSe", p11: 0.028, p12: 0.076, p44: -0.024, type: "II-VI", notes: "Zinc selenide" },
  { name: "Water", p11: 0.320, p12: 0.320, p44: 0.0, type: "Liquid", notes: "Isotropic, p11 = p12" },
];

export default function PhotoelasticPage() {
  const [stress, setStress] = useState(100); // MPa
  const [wavelength, setWavelength] = useState(633); // nm
  const [selected, setSelected] = useState("Fused Silica");

  const m = materials.find(x => x.name === selected)!;
  // Stress-optic coefficient approximation: C ≈ (p11 - p12) / (2n³E) but simpler:
  // Birefringence from stress: Δn = C × σ, where C is stress-optic coefficient
  // For isotropic: Δn = n³/2 × (p11 - p12) × σ/E
  // Let's use typical C values directly or estimate from Brewster coefficients
  // For silica: C ≈ -3.5e-12 Pa⁻¹, for BK7: C ≈ -2.77e-12 Pa⁻¹
  const C_values: Record<string, number> = {
    "Fused Silica": -3.5e-12, "BK7": -2.77e-12, "SF11": -2.0e-12,
    "Schott SF6": -1.8e-12, "Quartz (SiO₂)": -3.0e-12, "LiNbO₃": -4.0e-12,
    "CaF₂": -1.0e-12, "Water": 1.5e-12,
  };
  const C = C_values[selected] ?? -3.0e-12;
  const sigma = stress * 1e6; // Pa
  const dn = C * sigma;
  const phaseShift = 2 * Math.PI * dn / (wavelength * 1e-9); // rad/m

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Photoelastic Constants</h1>
      <p className="text-gray-400 mb-6">Stress-induced birefringence: Δn = C · σ, where C is the stress-optic coefficient</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {materials.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Stress σ (MPa)</label>
          <input type="number" value={stress} onChange={e => setStress(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">C (stress-optic)</p>
          <p className="text-lg font-bold text-blue-400 mt-1">{C.toExponential(1)} Pa⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn (birefringence)</p>
          <p className="text-lg font-bold text-red-400 mt-1">{dn.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase shift (per cm)</p>
          <p className="text-lg font-bold text-green-400 mt-1">{(phaseShift * 0.01).toFixed(2)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardation</p>
          <p className="text-lg font-bold text-amber-400 mt-1">{(phaseShift * 0.01 / (2 * Math.PI) * wavelength).toFixed(1)} nm</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Brewster Photoelastic Coefficients</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2 px-3">Material</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">p₁₁</th>
              <th className="text-right py-2 px-3">p₁₂</th>
              <th className="text-right py-2 px-3">p₄₄</th>
              <th className="text-left py-2 px-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer ${selected === m.name ? "bg-blue-900/20" : ""}`}
                onClick={() => setSelected(m.name)}>
                <td className="py-2 px-3 font-medium">{m.name}</td>
                <td className="py-2 px-3 text-gray-400">{m.type}</td>
                <td className="py-2 px-3 text-right font-mono">{m.p11.toFixed(3)}</td>
                <td className="py-2 px-3 text-right font-mono">{m.p12.toFixed(3)}</td>
                <td className="py-2 px-3 text-right font-mono">{m.p44.toFixed(3)}</td>
                <td className="py-2 px-3 text-gray-500">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
