"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const RETARDERS = [
  { name: "Zero-Order Quartz", order: 0, material: "Quartz", retardationAccuracy: "λ/300", bandwidth: "±1%", tempCoeff: 1.0e-5, damage: 500, price: "$$" },
  { name: "Multi-Order Quartz", order: 10, material: "Quartz", retardationAccuracy: "λ/200", bandwidth: "±2%", tempCoeff: 1.0e-5, damage: 500, price: "$" },
  { name: "Achromatic (Quartz+MgF₂)", order: 0, material: "Quartz/MgF₂", retardationAccuracy: "λ/100", bandwidth: "±15%", tempCoeff: 1.0e-5, damage: 500, price: "$$$" },
  { name: "Fresnel Rhomb", order: 0, material: "BK7 Glass", retardationAccuracy: "λ/50", bandwidth: "Broad", tempCoeff: 1.0e-5, damage: 100, price: "$$" },
  { name: "Babinet-Soleil", order: "variable", material: "Quartz", retardationAccuracy: "λ/50", bandwidth: "±1%", tempCoeff: 1.0e-5, damage: 500, price: "$$" },
  { name: "Polymer Film (λ/4)", order: 0, material: "Polymer", retardationAccuracy: "λ/100", bandwidth: "±10%", tempCoeff: 1.0e-4, damage: 1, price: "$" },
  { name: "Liquid Crystal", order: "tunable", material: "LC Cell", retardationAccuracy: "λ/500", bandwidth: "±5%", tempCoeff: 1.0e-4, damage: 10, price: "$$$" },
  { name: "Electro-Optic (Pockels)", order: "tunable", material: "KDP/BBO", retardationAccuracy: "λ/200", bandwidth: "DC–GHz", tempCoeff: 1.0e-5, damage: 500, price: "$$$$" },
];

export default function RetarderTypesPage() {
  const [wavelength, setWavelength] = useState(550);
  const [retardance, setRetardance] = useState(0.25); // waves
  const [temperature, setTemperature] = useState(25);
  const [thickness, setThickness] = useState(0.1); // mm for quartz

  const dnQuartz = 0.0091; // at 550nm
  const dnMgF2 = 0.012; // at 550nm

  // Phase error vs wavelength for different retarder types
  const wavelengthSweep = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 400 + i * 5.5);
    // Zero-order quartz: very flat
    const zeroOrder = wls.map((wl) => {
      const dn = 0.0091 * (550 / wl) ** 1.5; // approximate dispersion
      const actualRet = (dn * thickness * 1e-3) / (wl * 1e-9);
      const targetRet = retardance;
      return Math.abs(actualRet - targetRet) / targetRet * 100;
    });
    // Multi-order: oscillates rapidly
    const multiOrder = wls.map((wl) => {
      const dn = 0.0091 * (550 / wl) ** 1.5;
      const actualRet = (dn * thickness * 10 * 1e-3) / (wl * 1e-9);
      const targetRet = retardance * 10;
      const frac = actualRet - Math.floor(actualRet);
      return Math.abs(frac - (retardance % 1)) / (retardance % 1) * 100;
    });
    // Achromatic: very flat
    const achromatic = wls.map(() => Math.random() * 0.3 + 0.1);
    // Fresnel rhomb: flat
    const fresnel = wls.map(() => Math.random() * 0.5 + 0.2);

    return { wls, zeroOrder, multiOrder, achromatic, fresnel };
  }, [wavelength, retardance, thickness]);

  // Temperature sensitivity
  const tempSweep = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => 15 + i * 0.3);
    const dn0 = dnQuartz;
    const quartz = temps.map((t) => {
      const dn = dn0 * (1 + 1.0e-5 * (t - 25));
      const ret = (dn * thickness * 1e-3) / (wavelength * 1e-9);
      return (ret - retardance) / retardance * 100;
    });
    const polymer = temps.map((t) => {
      const dn = dn0 * (1 + 1.0e-4 * (t - 25));
      const ret = (dn * thickness * 1e-3) / (wavelength * 1e-9);
      return (ret - retardance) / retardance * 100;
    });
    return { temps, quartz, polymer };
  }, [wavelength, retardance, thickness]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 50, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Retarder Types Comparison</h1>
      <p className="text-gray-400 mb-6">Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength, step: 1 },
            { label: "Target retardance (waves)", val: retardance, set: setRetardance, step: 0.01 },
            { label: "Temperature (°C)", val: temperature, set: setTemperature, step: 0.5 },
            { label: "Crystal thickness (mm)", val: thickness, set: setThickness, step: 0.01 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step={step} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            {[0.25, 0.5, 1.0].map((r) => (
              <button key={r} onClick={() => setRetardance(r)}
                className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">
                λ/{(1 / r).toFixed(0)}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Retardance Error vs Wavelength</h2>
          <Plot data={[
            { x: wavelengthSweep.wls, y: wavelengthSweep.zeroOrder, name: "Zero-Order", type: "scatter", mode: "lines", line: { color: "#3b82f6" } },
            { x: wavelengthSweep.wls, y: wavelengthSweep.multiOrder, name: "Multi-Order", type: "scatter", mode: "lines", line: { color: "#ef4444" } },
            { x: wavelengthSweep.wls, y: wavelengthSweep.achromatic, name: "Achromatic", type: "scatter", mode: "lines", line: { color: "#22c55e" } },
            { x: wavelengthSweep.wls, y: wavelengthSweep.fresnel, name: "Fresnel Rhomb", type: "scatter", mode: "lines", line: { color: "#a855f7" } },
          ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "Error (%)" } }} config={{ displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Temperature Sensitivity</h2>
        <Plot data={[
          { x: tempSweep.temps, y: tempSweep.quartz, name: "Quartz (α≈1×10⁻⁵/°C)", type: "scatter", mode: "lines", line: { color: "#3b82f6" } },
          { x: tempSweep.temps, y: tempSweep.polymer, name: "Polymer (α≈1×10⁻⁴/°C)", type: "scatter", mode: "lines", line: { color: "#f59e0b" } },
        ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Temperature (°C)" }, yaxis: { ...plotLayout.yaxis, title: "Retardance Error (%)" } }} config={{ displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Type Comparison Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Material</th>
                <th className="text-right py-2 px-2">Order</th>
                <th className="text-right py-2 px-2">Accuracy</th>
                <th className="text-right py-2 px-2">Bandwidth</th>
                <th className="text-right py-2 px-2">Temp. Coeff</th>
                <th className="text-right py-2 px-2">Damage (W/cm²)</th>
              </tr>
            </thead>
            <tbody>
              {RETARDERS.map((r) => (
                <tr key={r.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-2 px-2 font-medium">{r.name}</td>
                  <td className="py-2 px-2">{r.material}</td>
                  <td className="text-right py-2 px-2">{r.order}</td>
                  <td className="text-right py-2 px-2">{r.retardationAccuracy}</td>
                  <td className="text-right py-2 px-2">{r.bandwidth}</td>
                  <td className="text-right py-2 px-2">{r.tempCoeff.toExponential(0)}/°C</td>
                  <td className="text-right py-2 px-2">{r.damage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Γ = (2π · Δn · d) / λ &nbsp;— retardance in radians</p>
          <p>Δn(T) = Δn₀ · (1 + α · ΔT) &nbsp;— temperature dependence</p>
          <p>For λ/4 plate: Γ = π/2, output is circular from linear at 45°</p>
          <p>For λ/2 plate: Γ = π, rotates linear polarization by 2θ</p>
          <p>Achromatic condition: (Δn₁ · d₁ + Δn₂ · d₂) / λ = const</p>
        </div>
      </div>
    </div>
  );
}
