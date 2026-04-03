"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function CoherentAntiStokesPage() {
  const [pumpWavelength, setPumpWavelength] = useState(532);
  const [stokesWavelength, setStokesWavelength] = useState(630);
  const [temperature, setTemperature] = useState(300);
  const [maxShift, setMaxShift] = useState(4000);

  const chartData = useMemo(() => {
    const c = 3e8;
    const h = 6.626e-34;
    const kB = 1.381e-23;
    const shifts = Array.from({ length: 500 }, (_, i) => (i / 500) * maxShift);

    const pumpFreq = c / (pumpWavelength * 1e-9);
    const stokesFreq = c / (stokesWavelength * 1e-9);
    const vibFreq = pumpFreq - stokesFreq; // vibrational frequency

    const CARSFreq = pumpFreq + vibFreq; // anti-Stokes
    const CARSnm = c / CARSFreq * 1e9;

    // CARS signal intensity (simplified: non-resonant + resonant)
    const gamma = 10; // linewidth cm⁻¹
    const A_NR = 0.1; // non-resonant amplitude
    const R = 5; // Raman cross-section

    const carsIntensity = shifts.map(s => {
      const chiR = R / (s * 100 - vibFreq / 100 / (2 * Math.PI * c / 100) + 0);
      const chi = A_NR + chiR;
      return Math.pow(chi.real ** 2 + chi.imag ** 2, 2);
    });

    // Spontaneous Raman for comparison
    const ramanIntensity = shifts.map(s => {
      const x = (s - (vibFreq / 100 / (2 * Math.PI * c / 100)));
      return Math.exp(-x * x / (2 * gamma * gamma));
    });

    return [
      { x: shifts, y: carsIntensity, type: "scatter", mode: "lines", name: "CARS Signal",
        line: { color: "#60a5fa" } },
      { x: shifts, y: ramanIntensity, type: "scatter", mode: "lines", name: "Spontaneous Raman",
        line: { color: "#f87171", dash: "dash" } },
    ];
  }, [pumpWavelength, stokesWavelength, maxShift]);

  const c = 3e8;
  const pumpFreq = c / (pumpWavelength * 1e-9);
  const stokesFreq = c / (stokesWavelength * 1e-9);
  const vibFreqHz = pumpFreq - stokesFreq;
  const CARSFreq = pumpFreq + vibFreqHz;
  const CARSnm = c / CARSFreq * 1e9;
  const vibWavenumber = vibFreqHz / c * 1e-2;

  // Thermal population factor
  const h = 6.626e-34;
  const kB = 1.381e-23;
  const thermalFactor = 1 / (Math.exp(h * vibFreqHz / (kB * temperature)) - 1);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Coherent Anti-Stokes Raman Spectroscopy (CARS)" description="Four-wave mixing process: ω_CARS = ω_pump − ω_Stokes + ω_probe. Coherent, directional signal above fluorescence.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pump Wavelength (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={200} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Stokes Wavelength (nm)</span>
          <input type="number" value={stokesWavelength} onChange={e => setStokesWavelength(+e.target.value)} min={200} max={3000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={4} max={5000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Max Raman Shift (cm⁻¹)</span>
          <input type="number" value={maxShift} onChange={e => setMaxShift(+e.target.value)} min={100} max={5000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">CARS:</span> ω_as = ω_p − ω_s + ω_p = 2ω_p − ω_s</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">χ⁽³:</span> I_CARS ∝ |χ_NR + Σ R/(Ω−Ω_v + iΓ)|⁴</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Thermal:</span> n(Ω) = 1/(e<sup>&#123;ℏΩ/k<sub>B</sub>T&#125;</sup> − 1)</p>
        <p className="text-sm text-gray-300">CARS is a χ⁽³⁠⁾ four-wave mixing process producing coherent signal at the anti-Stokes frequency.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-sm text-gray-300"><span className="text-green-400">Vibrational frequency:</span> {vibWavenumber.toFixed(1)} cm⁻¹ ({(vibFreqHz/1e12).toFixed(2)} THz)</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">CARS wavelength:</span> {CARSnm.toFixed(2)} nm</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Thermal factor n(Ω):</span> {thermalFactor.toFixed(4)}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "CARS Spectrum vs Spontaneous Raman", font: { color: "white" } },
          xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>
    </CalculatorShell>
  );
}
