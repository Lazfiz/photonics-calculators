"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DShapedFiberPage() {
  const [cladDia, setCladDia] = useState(125); // μm
  const [coreDia, setCoreDia] = useState(9); // μm
  const [flatDepth, setFlatDepth] = useState(65); // μm from center to flat
  const [wavelength, setWavelength] = useState(1550); // nm
  const [n_core, setN_core] = useState(1.4682);
  const [n_clad, setN_clad] = useState(1.4629);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // μm
    const NA = Math.sqrt(n_core * n_core - n_clad * n_clad);
    const V = (2 * Math.PI / lambda) * (coreDia / 2) * NA;

    // Distance from core center to flat surface
    const distToFlat = flatDepth - cladDia / 2; // positive = flat above core center
    const cladRemaining = cladDia / 2 - flatDepth; // remaining cladding above core

    // Mode field radius
    const w = (coreDia / 2) * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));

    // Asymmetry parameter: ratio of distances above and below core
    const d_above = Math.max(cladRemaining, 0.1);
    const d_below = cladDia - flatDepth;
    const asymmetry = d_below / d_above;

    // Birefringence induced by asymmetric cladding
    // Δn ≈ (NA²/n) × (1 - R²)/(1 + R²) × correction
    const R = Math.min(asymmetry, 5);
    const birefringence = 0.5 * Math.pow(NA, 2) / n_core * Math.abs(1 - R * R) / (1 + R * R) * 0.1;

    // Evanescent field at flat surface
    const gamma = Math.sqrt(2 * Math.PI * NA / (lambda * w));
    const evanescentFraction = Math.exp(-2 * gamma * Math.max(d_above, 0.01));

    // Polarization extinction ratio
    const PER = birefringence > 0 ? 10 * Math.log10(1 + birefringence * 1e6 * lambda) : 0;

    // Effective area
    const A_eff = Math.PI * w * w;

    // Sensitivity to external refractive index
    const RI_sensitivity = evanescentFraction * 50; // nm/RIU simplified

    return { NA, V, w, distToFlat, cladRemaining, asymmetry, birefringence, evanescentFraction, PER, A_eff, RI_sensitivity, d_above, d_below };
  }, [cladDia, coreDia, flatDepth, wavelength, n_core, n_clad]);

  const chartData = useMemo(() => {
    const depths = Array.from({ length: 100 }, (_, i) => cladDia * 0.4 + i * (cladDia * 0.3 / 100));
    const birefs = depths.map(d => {
      const rem = cladDia / 2 - d;
      const below = cladDia - d;
      const above = Math.max(rem, 0.1);
      const R = Math.min(below / above, 5);
      return 0.5 * Math.pow(calc.NA, 2) / n_core * Math.abs(1 - R * R) / (1 + R * R) * 0.1;
    });
    const efs = depths.map(d => {
      const rem = cladDia / 2 - d;
      const V = (2 * Math.PI / (wavelength * 1e-3)) * (coreDia / 2) * calc.NA;
      const w = (coreDia / 2) * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
      const gamma = Math.sqrt(2 * Math.PI * calc.NA / (wavelength * 1e-3 * w));
      return Math.exp(-2 * gamma * Math.max(rem, 0.01));
    });

    return [
      { x: depths, y: birefs.map(b => b * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Birefringence (×10⁻⁶)", line: { color: "#f87171" }, yaxis: "y" },
      { x: depths, y: efs.map(e => e * 100), type: "scatter" as const, mode: "lines" as const, name: "Evanescent (%)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [cladDia, coreDia, flatDepth, wavelength, n_core, n_clad]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="D-Shaped Fiber" description="Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Cladding Ø (μm)</span>
          <input type="number" value={cladDia} onChange={e => setCladDia(+e.target.value)} min={10}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Core Ø (μm)</span>
          <input type="number" value={coreDia} onChange={e => setCoreDia(+e.target.value)} min={0.1} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Flat Depth from Center (μm)</span>
          <input type="number" value={flatDepth} onChange={e => setFlatDepth(+e.target.value)} min={1} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Birefringence</p>
          <p className="text-xl font-bold text-red-400">{(calc.birefringence * 1e6).toFixed(2)}×10⁻⁶</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Evanescent @ Flat</p>
          <p className="text-xl font-bold text-blue-400">{(calc.evanescentFraction * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Asymmetry Ratio</p>
          <p className="text-xl font-bold text-green-400">{calc.asymmetry.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{calc.d_above.toFixed(0)} / {calc.d_below.toFixed(0)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">RI Sensitivity</p>
          <p className="text-xl font-bold text-yellow-400">{calc.RI_sensitivity.toFixed(1)} nm/RIU</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Asymmetry: R = d_below / d_above</p>
          <p>Birefringence: Δn ≈ (NA²/2n) × |1-R²|/(1+R²)</p>
          <p>Evanescent: η = exp(-2γ d_remaining)</p>
          <p>γ = √(2π NA / (λ w₀))</p>
          <p>RI sensitivity: S ∝ η × λ × ∂n_eff/∂n_ext</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Flat Depth (μm)", gridcolor: "#374151" },
        yaxis: { title: "Birefringence (×10⁻⁶)", gridcolor: "#374151" },
        yaxis2: { title: "Evanescent (%)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30, r: 60 },
      }} />
    </CalculatorShell>
  );
}
