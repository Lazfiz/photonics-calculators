"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function UltrafastLaserSafetyPage() {
  const [pulseEnergy, setPulseEnergy] = useState(1); // µJ
  const [repRate, setRepRate] = useState(80); // MHz
  const [pulseWidth, setPulseWidth] = useState(100); // fs
  const [wavelength, setWavelength] = useState(800); // nm
  const [beamDia, setBeamDia] = useState(2); // mm
  const [divergence, setDivergence] = useState(1); // mrad

  const avgPower = pulseEnergy * 1e-6 * repRate * 1e6; // W
  const peakPower = pulseEnergy * 1e-6 / (pulseWidth * 1e-15); // W
  const peakIrradiance = peakPower / (Math.PI * Math.pow(beamDia / 20000, 2)); // W/cm²

  // Single-pulse MPE (simplified, 400-1400 nm)
  const singlePulseMpe = useMemo(() => {
    const t = pulseWidth * 1e-15;
    if (t < 1e-9) return 5e-7; // 0.5 µJ/cm² for ultrashort (simplified)
    return 1.8 * Math.pow(t, 0.75) * 1e-3 * 1e-3; // J/cm²
  }, [pulseWidth]);

  // Average power MPE (for 80 MHz rep rate, use 0.25s exposure)
  const avgMpeWcm2 = 1.8 / (Math.pow(0.25, 0.75) * 1000); // W/cm²
  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const avgIrradiance = avgPower / beamAreaCm2;

  // PRF correction for multiple pulses
  const nPulses = Math.min(repRate * 1e6 * 0.25, 86400);
  const prfCorrection = Math.pow(nPulses, -0.25);
  const correctedMpe = singlePulseMpe * prfCorrection;

  const singlePulseEdensity = (pulseEnergy * 1e-6) / beamAreaCm2; // J/cm²

  const safetyRatio = singlePulseMpe > 0 ? singlePulseEdensity / singlePulseMpe : Infinity;
  const odRequired = safetyRatio > 1 ? Math.ceil(Math.log10(safetyRatio)) : 0;

  const chartData = useMemo(() => {
    const widths = Array.from({ length: 80 }, (_, i) => 10 + i * 24); // 10 fs to ~2 ps
    const mpes = widths.map(t => {
      const ts = t * 1e-15;
      if (ts < 1e-9) return 5e-7;
      return 1.8 * Math.pow(ts, 0.75) * 1e-3 * 1e-3;
    });
    const energies = widths.map(t => {
      const pp = pulseEnergy * 1e-6 / (t * 1e-15);
      return pp / (Math.PI * Math.pow(beamDia / 20000, 2));
    });
    return [
      { x: widths, y: mpes.map(v => v * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Single-pulse MPE", line: { color: "#f87171", dash: "dash" } },
      { x: widths, y: energies.map(v => singlePulseEdensity * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Your pulse density", line: { color: "#60a5fa" } },
    ];
  }, [pulseEnergy, beamDia, singlePulseEdensity]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Ultrafast Laser Safety Calculator" description="Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Energy (µJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Rep Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Width (fs)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Beam Diameter (mm)</span>
          <input type="number" value={beamDia} onChange={e => setBeamDia(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Divergence (mrad)</span>
          <input type="number" value={divergence} onChange={e => setDivergence(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Average Power</p>
          <p className="text-2xl font-bold text-blue-400">{avgPower.toFixed(1)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-2xl font-bold text-purple-400">{(peakPower / 1e6).toFixed(1)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Single-pulse MPE</p>
          <p className="text-2xl font-bold text-green-400">{(singlePulseMpe * 1e6).toFixed(3)} µJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Min OD Required</p>
          <p className="text-2xl font-bold text-yellow-400">OD{odRequired}+</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Key Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>P<sub>avg</sub> = E<sub>p</sub> × f<sub>rep</sub></p>
          <p>P<sub>peak</sub> = E<sub>p</sub> / τ<sub>p</sub></p>
          <p>MPE<sub>single</sub> ≈ 5 × 10<sup>−7</sup> J/cm² (t &lt; 1 ns, 400–1400 nm)</p>
          <p>MPE<sub>avg</sub> ≈ 1.8 × t<sup>−0.75</sup> × 10<sup>−3</sup> W/cm² (t = 0.25 s)</p>
          <p>MPE<sub>corrected</sub> = MPE<sub>single</sub> × N<sup>−0.25</sup> (PRF correction)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Pulse Width (fs)", gridcolor: "#374151" },
          yaxis: { title: "Energy Density (µJ/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
