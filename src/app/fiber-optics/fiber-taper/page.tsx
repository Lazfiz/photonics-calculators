"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FiberTaperPage() {
  const [pullLength, setPullLength] = useState(5000); // μm total
  const [heaterWidth, setHeaterWidth] = useState(2); // mm
  const [initialDia, setInitialDia] = useState(125); // μm
  const [coreDia, setCoreDia] = useState(8.2); // μm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [taperType, setTaperType] = useState<"symmetric" | "asymmetric">("symmetric");

  const calc = useMemo(() => {
    const stretch = pullLength * 1e-3; // mm
    const L_hot = heaterWidth;
    // Conservation of volume: π r₀² L₀ = π r² L → r = r₀ √(L₀/L)
    const waistDia = initialDia * Math.sqrt(L_hot / (L_hot + stretch));
    const stretchRatio = (L_hot + stretch) / L_hot;
    const waistCoreDia = coreDia / Math.sqrt(stretchRatio);

    const NA = 0.12;
    const V_waist = (2 * Math.PI / (wavelength * 1e-3)) * (waistCoreDia / 2) * NA;

    // Evanescent field penetration depth at waist
    const n_eff = 1.45;
    const n_ext = 1.33; // water/air
    const d_p = (wavelength * 1e-3) / (2 * Math.PI * Math.sqrt(n_eff * n_eff - n_ext * n_ext));

    // Coupling coefficient for waist region
    const kappa = Math.PI / (2 * waistDia * 1e-3); // simplified, per mm
    const couplingLength = Math.PI / (2 * kappa); // half-beat length

    // Losses
    const excessLoss = waistDia < 5 ? 0.5 * Math.pow((5 - waistDia) / 5, 2) : 0;
    const transmission = Math.pow(10, -excessLoss / 10);

    return { waistDia, stretchRatio, waistCoreDia, V_waist, d_p, kappa, couplingLength, excessLoss, transmission };
  }, [pullLength, heaterWidth, initialDia, coreDia, wavelength, taperType]);

  const chartData = useMemo(() => {
    const pulls = Array.from({ length: 200 }, (_, i) => i * 50);
    const waists = pulls.map(p => {
      const s = p * 1e-3;
      return initialDia * Math.sqrt(heaterWidth / (heaterWidth + s));
    });
    const losses = waists.map(w => w < 5 ? 0.5 * Math.pow((5 - w) / 5, 2) : 0);

    return [
      { x: pulls, y: waists, type: "scatter" as const, mode: "lines" as const, name: "Waist Ø (μm)", line: { color: "#f87171" }, yaxis: "y" },
      { x: pulls, y: losses, type: "scatter" as const, mode: "lines" as const, name: "Excess Loss (dB)", line: { color: "#fbbf24" }, yaxis: "y2" },
    ];
  }, [initialDia, heaterWidth]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Fiber Taper Calculation</h1>
      <p className="text-gray-400 mb-8">Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pull Length (μm)</span>
          <input type="number" value={pullLength} onChange={e => setPullLength(+e.target.value)} min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Heater Width (mm)</span>
          <input type="number" value={heaterWidth} onChange={e => setHeaterWidth(+e.target.value)} min={0.1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Initial Cladding Ø (μm)</span>
          <input type="number" value={initialDia} onChange={e => setInitialDia(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Core Ø (μm)</span>
          <input type="number" value={coreDia} onChange={e => setCoreDia(+e.target.value)} min={0.1} step="any"
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
          <p className="text-sm text-gray-400">Waist Ø</p>
          <p className="text-xl font-bold text-red-400">{calc.waistDia.toFixed(1)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretch Ratio</p>
          <p className="text-xl font-bold text-blue-400">{calc.stretchRatio.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Evanescent Depth</p>
          <p className="text-xl font-bold text-green-400">{calc.d_p.toFixed(3)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excess Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.excessLoss.toFixed(4)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Volume conservation: d_waist = d₀ × √(L₀ / (L₀ + ΔL))</p>
          <p>Evanescent depth: d_p = λ / (2π √(n_eff² - n_ext²))</p>
          <p>Coupling coeff: κ ≈ π / (2d_waist)</p>
          <p>Beat length: L_B = π / (2κ)</p>
        </div>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Pull Length (μm)", gridcolor: "#374151" },
        yaxis: { title: "Waist Diameter (μm)", gridcolor: "#374151" },
        yaxis2: { title: "Excess Loss (dB)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30, r: 60 },
      }} style={{ width: "100%", height: 400 }} />
    </div>
  );
}
