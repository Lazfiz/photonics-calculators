"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function EtalonFinessePage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [refractiveIndex, setRefractiveIndex] = useState(1.5);
  const [thickness, setThickness] = useState(100); // µm
  const [reflectivity, setReflectivity] = useState(0.8); // mirror R
  const [wavelengthRange, setWavelengthRange] = useState(5); // nm around center

  const calc = useMemo(() => {
    const lambda0 = wavelength; // nm
    const n = refractiveIndex;
    const d = thickness * 1000; // nm
    const R = reflectivity;
    const F = 4 * R / ((1 - R) * (1 - R)); // coefficient of finesse
    const finesse = Math.PI * Math.sqrt(F) / 2;
    const FSR = lambda0 * lambda0 / (2 * n * d); // nm
    const linewidth = FSR / finesse; // nm (FWHM)
    const Tpeak = ((1 - R) * (1 - R)) / ((1 - R) * (1 - R) + 4 * R); // = 1

    // Transmission spectrum
    const N = 1000;
    const lambdas = Array.from({ length: N }, (_, i) =>
      lambda0 - wavelengthRange + (2 * wavelengthRange * i) / (N - 1)
    );
    const transmission = lambdas.map(lam => {
      const delta = 4 * Math.PI * n * d / lam;
      const denom = 1 + F * Math.sin(delta / 2) ** 2;
      return 1 / denom;
    });

    // Phase shift
    const phase = lambdas.map(lam => {
      const delta = 4 * Math.PI * n * d / lam;
      return Math.atan2(
        -(1 - R) * Math.sin(delta),
        R * (1 - R) + (1 - R) * Math.cos(delta)
      );
    });

    return { finesse, FSR, linewidth, Tpeak, F, lambdas, transmission, phase };
  }, [wavelength, refractiveIndex, thickness, reflectivity, wavelengthRange]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Etalon / Fabry-Pérot Analysis" description="Detailed etalon transmission, finesse, and spectral properties.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Center wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Refractive index n</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Thickness (µm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Mirror reflectivity R</span>
          <input type="number" value={reflectivity} onChange={e => setReflectivity(+e.target.value)} step="0.01" min={0} max={0.999} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <label className="block mb-8"><span className="text-sm text-gray-300">Wavelength range ± (nm)</span>
        <input type="number" value={wavelengthRange} onChange={e => setWavelengthRange(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse ℱ</p>
          <p className="text-xl font-bold text-blue-400">{calc.finesse.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FSR</p>
          <p className="text-xl font-bold text-green-400">{calc.FSR.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Linewidth (FWHM)</p>
          <p className="text-xl font-bold text-orange-400">{calc.linewidth.toFixed(5)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coefficient F</p>
          <p className="text-xl font-bold text-purple-400">{calc.F.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          T = 1/(1 + F·sin²(δ/2))  |  δ = 4πnd/λ  |  FSR = λ²/(2nd)  |  ℱ = π√F/2
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[{
          x: calc.lambdas, y: calc.transmission,
          type: "scatter" as const, mode: "lines" as const, name: "Transmission",
          line: { color: "#60a5fa" },
        }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
