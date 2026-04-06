"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function DopplerBroadeningPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 632.8);
  const [temperature, setTemperature] = useURLState("temperature", 300);
  const [mass, setMass] = useURLState("mass", 20.18); // Neon in amu

  const c = 3e8;
  const kB = 1.381e-23;
  const amu = 1.661e-27;
  const m = mass * amu;

  // Doppler FWHM: Δν_D = (ν₀/c)·√(8kT·ln2/m) = (1/λ)·√(8kT·ln2/m)
  const nu0 = c / (wavelength * 1e-9); // center frequency Hz
  const deltaNuD = (nu0 / c) * Math.sqrt(8 * kB * temperature * Math.log(2) / m); // Hz
  const fwhmNm = deltaNuD * (wavelength * 1e-9) ** 2 / c * 1e9; // nm
  const deltaNuHz = deltaNuD / Math.PI; // HWHM in Hz

  const profile = (dw: number) => Math.exp(-Math.pow(dw / (fwhmNm / 2), 2) * Math.log(2));

  const chartData = useMemo(() => {
    const range = fwhmNm * 5;
    const wls = Array.from({ length: 200 }, (_, i) => wavelength - range + (2 * range * i) / 199);
    return [
      { x: wls, y: wls.map(w => profile(w - wavelength)), type: "scatter" as const, mode: "lines" as const, name: "Gaussian Profile", line: { color: "#f97316" } },
    ];
  }, [wavelength, fwhmNm]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Doppler Broadening Calculator" description="Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={5000} step="any" />
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={10} max={10000} />
        <ValidatedNumberInput label="Mass (amu)" value={mass} onChange={setMass} min={1} max={300} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM (nm)</p>
          <p className="text-2xl font-bold text-orange-400">{fwhmNm.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM (GHz)</p>
          <p className="text-2xl font-bold text-blue-400">{(deltaNuD * 1e-9).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">HWHM (MHz)</p>
          <p className="text-2xl font-bold text-green-400">{(deltaNuHz * 1e-6).toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Thermal Velocity</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.sqrt(kB * temperature / m).toFixed(0)} m/s</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
