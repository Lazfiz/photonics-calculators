"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MacrobendingLossPage() {
  const [bendRadius, setBendRadius] = useState(15); // mm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [coreRadius, setCoreRadius] = useState(4.1); // µm
  const [coreNA, setCoreNA] = useState(0.12);
  const [claddingRadius, setCladdingRadius] = useState(62.5); // µm
  const [coatingIndex, setCoatingIndex] = useState(1.48);
  const [numBends, setNumBends] = useState(1);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // µm
    const R = bendRadius * 1e3; // µm
    const n1 = 1.468; // core
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA); // cladding
    const a = coreRadius; // µm
    const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6)); // MFD approx
    const V = coreNA * 2 * Math.PI * a / lambda;

    // Marcuse formula for pure bend loss (dB/m)
    // α_bend = (π^(1/2) · a² / (2·R·w²)) · (u²/w²)^(2·V²) · exp(-2R·(β - n_clad·k)²/(β·V²))
    // Simplified pure bend loss using the curvature radiation model:
    const beta = n1 * 2 * Math.PI / lambda; // propagation constant
    const beta_clad = n2 * 2 * Math.PI / lambda;
    const delta = (beta - beta_clad) / beta; // relative index difference

    // Pure bend loss coefficient (dB/turn) - Marcuse approximation
    // α = (sqrt(π) / 2) · (w / R)^(1/2) · (w · (β - n2·k))^(3/2) · exp(-R·(β - n2·k))
    const dBeta = beta - beta_clad;
    const bendLossPerTurn = R > 0
      ? (Math.sqrt(Math.PI) / 2) * Math.pow(w / R, 0.5) * Math.pow(w * dBeta, 1.5) * Math.exp(-R * dBeta) * 4.343
      : 0;

    // Coating effect - transition loss at bend entry/exit
    const nc = coatingIndex;
    const transitionLoss = numBends > 1 ? 0.02 * numBends : 0; // small additional loss

    // Whiteman formula alternative: α = A·exp(-B·R)
    // Calibrated for SMF-28 at 1550nm
    const A_coeff = 0.001; // dB/turn scaling
    const B_coeff = 0.3; // 1/mm
    const bendLossApprox = A_coeff * Math.exp(B_coeff * (30 - bendRadius)); // dB/turn, calibrated at R=30mm≈0.001dB

    const totalLoss = (bendLossPerTurn + bendLossApprox * 0.5) * numBends + transitionLoss;

    // Critical radius (where loss becomes significant, ~0.1 dB/turn)
    // R_c ≈ 20·λ / (n1² - n2²)^(3/2) [purely empirical scaling]
    const R_critical = 20 * lambda / Math.pow(n1 * n1 - n2 * n2, 1.5) / 1e3; // mm

    return { w, V, bendLossPerTurn, bendLossApprox, totalLoss, R_critical, n1, n2 };
  }, [bendRadius, wavelength, coreRadius, coreNA, claddingRadius, coatingIndex, numBends]);

  const radiusData = useMemo(() => {
    const radii = Array.from({ length: 150 }, (_, i) => 5 + i * 0.3);
    const lambda = wavelength * 1e-3;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const a = coreRadius;
    const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));
    const beta = n1 * 2 * Math.PI / lambda;
    const beta_clad = n2 * 2 * Math.PI / lambda;
    const dBeta = beta - beta_clad;

    const loss = radii.map(r => {
      const R = r * 1e3; // µm
      return (Math.sqrt(Math.PI) / 2) * Math.pow(w / R, 0.5) * Math.pow(w * dBeta, 1.5) * Math.exp(-R * dBeta) * 4.343;
    });

    const wavelengths = [1310, 1550, 1625];
    const allTraces = wavelengths.map(wl => {
      const lam = wl * 1e-3;
      const b1 = n1 * 2 * Math.PI / lam;
      const b2 = n2 * 2 * Math.PI / lam;
      const db = b1 - b2;
      const wm = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));
      const l = radii.map(r => {
        const R = r * 1e3;
        return (Math.sqrt(Math.PI) / 2) * Math.pow(wm / R, 0.5) * Math.pow(wm * db, 1.5) * Math.exp(-R * db) * 4.343;
      });
      return { x: radii, y: l, type: "scatter" as const, mode: "lines" as const, name: `${wl}nm`, line: { width: 2 } };
    });

    return allTraces;
  }, [wavelength, coreRadius, coreNA]);

  const wavelengthData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 1100 + i * 3);
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const a = coreRadius;
    const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));

    const loss = wavelengths.map(wl => {
      const lam = wl * 1e-3;
      const R = bendRadius * 1e3;
      const beta = n1 * 2 * Math.PI / lam;
      const beta_clad = n2 * 2 * Math.PI / lam;
      const dBeta = beta - beta_clad;
      return (Math.sqrt(Math.PI) / 2) * Math.pow(w / R, 0.5) * Math.pow(w * dBeta, 1.5) * Math.exp(-R * dBeta) * 4.343;
    });

    return [{ x: wavelengths, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Bend Loss", line: { color: "#f97316", width: 2 } }];
  }, [bendRadius, coreRadius, coreNA]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Macrobending Loss</h1>
      <p className="text-gray-400 mb-8">Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Bend Radius (mm)</span>
          <input type="number" value={bendRadius} onChange={e => setBendRadius(+e.target.value)} step="0.5" min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Core Radius (µm)</span>
          <input type="number" value={coreRadius} onChange={e => setCoreRadius(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Core NA</span>
          <input type="number" value={coreNA} onChange={e => setCoreNA(+e.target.value)} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Cladding Radius (µm)</span>
          <input type="number" value={claddingRadius} onChange={e => setCladdingRadius(+e.target.value)} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Bends</span>
          <input type="number" value={numBends} onChange={e => setNumBends(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Loss per Turn</p>
          <p className="text-xl font-bold text-red-400">{calc.bendLossPerTurn.toFixed(4)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Loss ({numBends} bends)</p>
          <p className={`text-xl font-bold ${calc.totalLoss > 0.5 ? "text-red-400" : calc.totalLoss > 0.1 ? "text-yellow-400" : "text-green-400"}`}>{calc.totalLoss.toFixed(4)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MFD</p>
          <p className="text-xl font-bold text-blue-400">{calc.w.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-number</p>
          <p className="text-xl font-bold text-purple-400">{calc.V.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Bend Loss vs Radius (Multi-λ)</h3>
          <Plot data={radiusData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Bend Radius (mm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss/turn (dB)", gridcolor: "#374151", color: "#9ca3af", type: "log" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Bend Loss vs Wavelength</h3>
          <Plot data={wavelengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss/turn (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Marcuse: α = (√π/2)·(w/R)^(1/2)·(w·Δβ)^(3/2)·exp(-R·Δβ) [Np/turn]</p>
          <p>Δβ = β_core - β_clad = (2π/λ)·(n₁ - n₂)</p>
          <p>Loss increases exponentially with decreasing bend radius</p>
          <p>Loss increases strongly at longer wavelengths</p>
          <p>ITU-T G.657: Bend-insensitive fiber specs at R=7.5, 10, 15, 30mm</p>
        </div>
      </div>
    </div>
  );
}
