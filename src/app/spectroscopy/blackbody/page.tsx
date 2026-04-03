"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function BlackbodyPage() {
  const [temperature, setTemperature] = useState(5778);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 100 + i * 4); // nm
    const h = 6.626e-34, c = 3e8, k = 1.381e-23;
    const T = temperature;
    const spectralRadiance = wls.map(wl => {
      const lam = wl * 1e-9;
      const exp = h * c / (lam * k * T);
      if (exp > 500) return 0;
      return (2 * h * c * c) / (Math.pow(lam, 5) * (Math.exp(exp) - 1)) * 1e-9; // W/m²/sr/nm
    });
    const peak = 2.898e6 / T; // Wien in nm
    const stefanBoltzmann = 5.67e-8 * Math.pow(T, 4);
    return [
      { x: wls, y: spectralRadiance, type: "scatter" as const, mode: "lines" as const, name: `${T} K`, line: { color: "#f87171" } },
    ];
  }, [temperature]);

  const peakWavelength = 2897771.955 / temperature; // Wien's law nm
  const totalPower = 5.67e-8 * Math.pow(temperature, 4); // W/m²

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Blackbody Radiation" description="Planck's law spectral radiance curve, Wien's displacement law, and Stefan-Boltzmann total power.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={100} max={40000} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Wavelength (Wien)</p>
          <p className="text-xl font-bold text-orange-400">{peakWavelength.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Radiated Power</p>
          <p className="text-xl font-bold text-red-400">{totalPower.toExponential(2)} W/m²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Spectral Radiance (W/m²/sr/nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
