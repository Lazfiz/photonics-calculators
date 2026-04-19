"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function RamanShiftPage() {
  const [laserWavelength, setLaserWavelength] = useURLState("laserWavelength", 532);
  const [ramanShiftCm, setRamanShiftCm] = useURLState("ramanShiftCm", 1000);
  const [minShift, setMinShift] = useURLState("minShift", 100);
  const [maxShift, setMaxShift] = useURLState("maxShift", 4000);

  const laserWavenumber = 1e7 / laserWavelength; // cm⁻¹
  const stokesWavenumber = laserWavenumber - ramanShiftCm;
  const stokesWavelength = stokesWavenumber > 0 ? 1e7 / stokesWavenumber : NaN;
  const antiStokesWavenumber = laserWavenumber + ramanShiftCm;
  const antiStokesWavelength = 1e7 / antiStokesWavenumber;

  // Energy and frequency from Raman shift directly (not from Stokes photon)
  const energyDiffEv = ramanShiftCm * 1.239842e-4; // hc ≈ 1.239842e-4 eV·cm
  const frequencyDiffTHz = ramanShiftCm * 0.029979; // 1 cm⁻¹ = 29.979 THz

  const chartData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => minShift + i * (maxShift - minShift) / 500);
    const stokesWL = shifts.map(s => {
      const wn = laserWavenumber - s;
      return wn > 0 ? 1e7 / wn : null; // skip non-positive wavenumbers
    });
    const antiStokesWL = shifts.map(s => 1e7 / (laserWavenumber + s));
    return [
      { x: shifts, y: stokesWL, type: "scatter" as const, mode: "lines" as const,
        name: "Stokes", line: { color: "#34d399" } },
      { x: shifts, y: antiStokesWL, type: "scatter" as const, mode: "lines" as const,
        name: "Anti-Stokes", line: { color: "#f87171" } },
      { x: [ramanShiftCm], y: [stokesWavelength], type: "scatter" as const, mode: "markers" as const,
        name: "Selected", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [laserWavelength, ramanShiftCm, minShift, maxShift]);

  // Energy difference
  // const energyDiffEv = laserEnergyEv - stokesEnergyEv; // REMOVED: broke at high shifts

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Raman Shift Calculator" description="Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Laser Wavelength (nm)" value={laserWavelength} onChange={setLaserWavelength} min={200} max={2000} />
        <ValidatedNumberInput label="Raman Shift (cm⁻¹)" value={ramanShiftCm} onChange={setRamanShiftCm} min={0} max={5000} />
        <ValidatedNumberInput label="Plot Range Min (cm⁻¹)" value={minShift} onChange={setMinShift} />
        <ValidatedNumberInput label="Plot Range Max (cm⁻¹)" value={maxShift} onChange={setMaxShift} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes Wavelength</p>
          <p className="text-xl font-bold text-green-400">{isNaN(stokesWavelength) ? "N/A (shift > laser)" : stokesWavelength.toFixed(2) + " nm"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Anti-Stokes Wavelength</p>
          <p className="text-xl font-bold text-red-400">{antiStokesWavelength.toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Laser Wavenumber</p>
          <p className="text-xl font-bold text-blue-400">{laserWavenumber.toFixed(2)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes Wavenumber</p>
          <p className="text-xl font-bold text-green-400">{isNaN(stokesWavelength) ? "N/A (shift > laser)" : stokesWavenumber.toFixed(2) + " cm⁻¹"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy Difference</p>
          <p className="text-xl font-bold text-yellow-400">{energyDiffEv.toFixed(4)} eV</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Vibrational Frequency</p>
          <p className="text-xl font-bold text-purple-400">{frequencyDiffTHz.toFixed(2)} THz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>ν̃<sub>laser</sub> = 10⁷ / λ<sub>laser</sub>(nm) cm⁻¹</p>
        <p><span className="text-green-400">Stokes:</span> ν̃<sub>s</sub> = ν̃<sub>laser</sub> − Δν̃ → λ<sub>s</sub> = 10⁷ / ν̃<sub>s</sub></p>
        <p><span className="text-red-400">Anti-Stokes:</span> ν̃<sub>as</sub> = ν̃<sub>laser</sub> + Δν̃ → λ<sub>as</sub> = 10⁷ / ν̃<sub>as</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" },
        yaxis: { title: "Scattered Wavelength (nm)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />
    </CalculatorShell>
  );
}
