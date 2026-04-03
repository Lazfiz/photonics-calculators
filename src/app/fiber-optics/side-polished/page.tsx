"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SidePolishedPage() {
  const [remainingClad, setRemainingClad] = useState(2); // μm from core
  const [coreDia, setCoreDia] = useState(8.2); // μm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [n_core, setN_core] = useState(1.4682);
  const [n_clad, setN_clad] = useState(1.4629);
  const [n_overlay, setN_overlay] = useState(1.46); // overlay refractive index
  const [polishLength, setPolishLength] = useState(10); // mm

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // μm
    const NA = Math.sqrt(n_core * n_core - n_clad * n_clad);
    const V = (2 * Math.PI / lambda) * (coreDia / 2) * NA;

    // Mode field radius (Marcuse)
    const w = (coreDia / 2) * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));

    // Evanescent field at the polished surface
    // Fraction of power outside core
    const gamma = Math.sqrt(2 * Math.PI * NA / (lambda * w));
    const powerFraction = Math.exp(-2 * gamma * remainingClad);

    // Phase matching condition for side-polished fiber with overlay
    const n_eff = n_core - (0.5 * NA * NA / n_core);
    const delta_n = n_overlay - n_clad;
    const isResonant = Math.abs(delta_n) < 0.005;

    // Interaction length for complete coupling
    const kappa = (Math.PI / lambda) * (NA / n_core) * powerFraction;
    const L_c = Math.PI / (2 * kappa);

    // Spectral response: resonance wavelength depends on overlay thickness
    // Simplified model for wavelength-dependent transmission
    const resonanceShift = delta_n * 1e4; // nm shift per 0.001 RIU change

    // Insertion loss from polishing
    const scatteringLoss = remainingClad < 0.5 ? 2 * (0.5 - remainingClad) : 0;

    return { NA, V, w, gamma, powerFraction, n_eff, delta_n, isResonant, kappa, L_c, resonanceShift, scatteringLoss };
  }, [remainingClad, coreDia, wavelength, n_core, n_clad, n_overlay, polishLength]);

  const chartData = useMemo(() => {
    const remainings = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.15);
    const powers = remainings.map(r => {
      const V = (2 * Math.PI / (wavelength * 1e-3)) * (coreDia / 2) * calc.NA;
      const w = (coreDia / 2) * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
      const gamma = Math.sqrt(2 * Math.PI * calc.NA / (wavelength * 1e-3 * w));
      return Math.exp(-2 * gamma * r);
    });
    const losses = remainings.map(r => r < 0.5 ? 2 * (0.5 - r) : 0);

    return [
      { x: remainings, y: powers.map(p => p * 100), type: "scatter" as const, mode: "lines" as const, name: "Evanescent Power (%)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: remainings, y: losses, type: "scatter" as const, mode: "lines" as const, name: "Scattering Loss (dB)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [remainingClad, coreDia, wavelength, n_core, n_clad]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Side-Polished Fiber</h1>
      <p className="text-gray-400 mb-8">Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Remaining Cladding (μm)</span>
          <input type="number" value={remainingClad} onChange={e => setRemainingClad(+e.target.value)} min={0} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Polish Length (mm)</span>
          <input type="number" value={polishLength} onChange={e => setPolishLength(+e.target.value)} min={0.1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Overlay Index</span>
          <input type="number" value={n_overlay} onChange={e => setN_overlay(+e.target.value)} min={1} step="0.0001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Evanescent Power</p>
          <p className="text-xl font-bold text-blue-400">{(calc.powerFraction * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coupling Length</p>
          <p className="text-xl font-bold text-green-400">{calc.L_c.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase Match</p>
          <p className="text-xl font-bold">{calc.isResonant ? <span className="text-red-400">RESONANT</span> : <span className="text-gray-400">Off</span>}</p>
          <p className="text-xs text-gray-500">Δn = {calc.delta_n.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Scattering Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.scatteringLoss.toFixed(3)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Evanescent: P_out/P_total = exp(-2γd)</p>
          <p>γ = √(2π NA / (λ w₀))</p>
          <p>Coupling coeff: κ = (π/λ)(NA/n_eff) × P_evanescent</p>
          <p>Phase match: n_overlay ≈ n_clad</p>
          <p>Resonance shift: Δλ ∝ Δn_overlay</p>
        </div>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Remaining Cladding (μm)", gridcolor: "#374151" },
        yaxis: { title: "Evanescent Power (%)", gridcolor: "#374151" },
        yaxis2: { title: "Scattering Loss (dB)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30, r: 60 },
      }} style={{ width: "100%", height: 400 }} />
    </div>
  );
}
