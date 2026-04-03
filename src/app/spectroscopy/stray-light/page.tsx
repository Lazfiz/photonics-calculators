"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function StrayLightPage() {
  const [gratingLines, setGratingLines] = useState(600);
  const [order, setOrder] = useState(1);
  const [centralWavelength, setCentralWavelength] = useState(600);
  const [scatterFraction, setScatterFraction] = useState(0.001);

  const chartData = useMemo(() => {
    // Stray light rejection across wavelengths
    const wls = Array.from({ length: 300 }, (_, i) => 200 + i * 3);

    // Ghost orders: λ_ghost = m·λ_center / n (order m detected at order n)
    const ghosts = [2, 3, 4].map(m => ({
      ghostWl: (m * centralWavelength) / order,
      label: `Order ${m} ghost`,
    }));

    // Approximate stray light envelope (Rayleigh-like scatter ∝ 1/λ⁴)
    const strayLight = wls.map(wl => {
      const baseScatter = scatterFraction * Math.pow(centralWavelength / wl, 2);
      // Add peaks near ghost orders
      let ghostContrib = 0;
      for (const g of ghosts) {
        const dist = Math.abs(wl - g.ghostWl);
        ghostContrib += 0.5 * scatterFraction * Math.exp(-dist * dist / 400);
      }
      return (baseScatter + ghostContrib) * 100;
    });

    return [
      { x: wls, y: strayLight, type: "scatter" as const, mode: "lines" as const, name: "Stray Light (%)", fill: "tozeroy" as const, line: { color: "#f87171" } },
      ...ghosts.map((g, i) => ({
        x: [g.ghostWl, g.ghostWl], y: [0, Math.max(...strayLight) * 1.2],
        type: "scatter" as const, mode: "lines" as const, name: g.label,
        line: { color: ["#fbbf24", "#a78bfa", "#fb923c"][i], dash: "dash" as const, width: 1 },
      })),
    ];
  }, [gratingLines, order, centralWavelength, scatterFraction]);

  const ghosts = [2, 3, 4].map(m => ({
    order: m,
    wavelength: ((m * centralWavelength) / order).toFixed(1),
  }));

  const rejectionDB = 10 * Math.log10(1 / scatterFraction);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Stray Light Rejection</h1>
      <p className="text-gray-400 mb-8">Ghost order analysis and stray light estimation for grating-based spectrometers.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Grating (lines/mm)</span>
          <input type="number" value={gratingLines} onChange={e => setGratingLines(+e.target.value)} min={50} max={3600}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Working Order</span>
          <input type="number" value={order} onChange={e => setOrder(+e.target.value)} min={1} max={5}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Central λ (nm)</span>
          <input type="number" value={centralWavelength} onChange={e => setCentralWavelength(+e.target.value)} min={100} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Scatter Fraction</span>
          <input type="number" value={scatterFraction} onChange={e => setScatterFraction(+e.target.value)} min={1e-6} max={0.1} step={0.0001}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stray Light Rejection</p>
          <p className="text-xl font-bold text-red-400">{rejectionDB.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Scatter Level</p>
          <p className="text-xl font-bold text-orange-400">{(scatterFraction * 100).toFixed(3)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Ghost Orders (λ_ghost = m·λ_center / n)</h3>
        {ghosts.map(g => (
          <p key={g.order} className="text-gray-300 text-sm">
            Order {g.order} ghost: <span className="text-yellow-400">{g.wavelength} nm</span>
          </p>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Stray Light (%)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.6, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
