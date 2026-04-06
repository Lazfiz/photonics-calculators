"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function RamanSpectroscopyPage() {
  const [laserWavelength, setLaserWavelength] = useURLState("laserWavelength", 532);
  const [maxShift, setMaxShift] = useURLState("maxShift", 4000);

  const chartData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => (i / 500) * maxShift);
    const laserNm = laserWavelength;

    // Stokes shift: λ_s = 1 / (1/λ₀ - ν̃)
    const stokesWavelengths = shifts.map(s => {
      const invLam0 = 1 / laserNm;
      const invLamS = invLam0 - s / 1e7;
      return invLamS > 0 ? 1 / invLamS : NaN;
    });

    // Anti-Stokes
    const antiStokesWavelengths = shifts.map(s => {
      const invLam0 = 1 / laserNm;
      const invLamAS = invLam0 + s / 1e7;
      return invLamAS > 0 ? 1 / invLamAS : NaN;
    });

    return [
      { x: shifts, y: stokesWavelengths, type: "scatter" as const, mode: "lines" as const, name: "Stokes", line: { color: "#60a5fa" } },
      { x: shifts, y: antiStokesWavelengths, type: "scatter" as const, mode: "lines" as const, name: "Anti-Stokes", line: { color: "#f87171" } },
    ];
  }, [laserWavelength, maxShift]);

  const sampleStokes = [
    { name: "C-H stretch", shift: 2850 },
    { name: "O-H stretch", shift: 3400 },
    { name: "N-H stretch", shift: 3300 },
    { name: "Si-O stretch", shift: 1100 },
    { name: "C=O stretch", shift: 1700 },
  ];

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Raman Spectroscopy" description="Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Laser Wavelength (nm)" value={laserWavelength} onChange={setLaserWavelength} min={200} max={2000} />
        <ValidatedNumberInput label="Max Raman Shift (cm⁻¹)" value={maxShift} onChange={setMaxShift} min={100} max={5000} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Stokes:</span> λ<sub>s</sub> = 1 / (1/λ₀ − ν̃)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-red-400 font-mono">Anti-Stokes:</span> λ<sub>as</sub> = 1 / (1/λ₀ + ν̃)</p>
        <p className="text-sm text-gray-300">Raman shift is independent of excitation wavelength.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Common Raman Peaks</h3>
        {sampleStokes.map(p => {
          const invLam0 = 1 / laserWavelength;
          const invLamS = invLam0 - p.shift / 1e7;
          const wl = invLamS > 0 ? (1 / invLamS).toFixed(2) : "N/A";
          return (
            <p key={p.name} className="text-sm text-gray-300">
              <span className="text-green-400">{p.name}</span>: {p.shift} cm⁻¹ → {wl} nm (Stokes)
            </p>
          );
        })}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
