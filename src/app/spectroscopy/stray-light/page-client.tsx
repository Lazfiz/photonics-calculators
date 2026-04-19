"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function StrayLightPage() {
  const [gratingLines, setGratingLines] = useURLState("gratingLines", 600);
  const [order, setOrder] = useURLState("order", 1);
  const [centralWavelength, setCentralWavelength] = useURLState("centralWavelength", 600);
  const [scatterFraction, setScatterFraction] = useURLState("scatterFraction", 0.001);

  const chartData = useMemo(() => {
    // Stray light rejection across wavelengths
    const wls = Array.from({ length: 300 }, (_, i) => 200 + i * 3);

    // Ghost orders: λ_ghost = n·λ_center / m (fixed angle: nλ_n = mλ_m)
    const ghosts = [1, 2, 3, 4, 5].filter(m => m !== order).map(m => ({
      ghostWl: (order * centralWavelength) / m,
      label: `Order ${m} ghost`,
    }));

    // Approximate stray light envelope (Rayleigh-like scatter ∝ 1/λ⁴)
    const strayLight = wls.map(wl => {
      const baseScatter = scatterFraction * Math.pow(centralWavelength / wl, 4);
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

  const ghosts = [1, 2, 3, 4, 5].filter(m => m !== order).map(m => ({
    order: m,
    wavelength: ((order * centralWavelength) / m).toFixed(1),
  }));

  const rejectionDB = scatterFraction > 0 ? 10 * Math.log10(1 / scatterFraction) : Infinity;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Stray Light Rejection" description="Ghost order analysis and stray light estimation for grating-based spectrometers.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Grating (lines/mm)" value={gratingLines} onChange={setGratingLines} min={50} max={3600} />
        <ValidatedNumberInput label="Working Order" value={order} onChange={setOrder} min={1} max={5} />
        <ValidatedNumberInput label="Central λ (nm)" value={centralWavelength} onChange={setCentralWavelength} min={100} max={2000} />
        <ValidatedNumberInput label="Scatter Fraction" value={scatterFraction} onChange={setScatterFraction} min={1e-6} max={0.1} />
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
        <h3 className="text-lg font-semibold mb-2">Ghost Orders (λ_ghost = n·λ_center / m)</h3>
        {ghosts.map(g => (
          <p key={g.order} className="text-sm text-gray-300">
            Order {g.order} ghost: <span className="text-yellow-400">{g.wavelength} nm</span>
          </p>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Stray Light (%)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.6, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
