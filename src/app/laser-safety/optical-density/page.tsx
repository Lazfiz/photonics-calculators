"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function OpticalDensityPage() {
  const [wavelength, setWavelength] = useState(532);
  const [power, setPower] = useState(500); // mW
  const [beamDiam, setBeamDiam] = useState(3); // mm
  const [exposure, setExposure] = useState(0.25); // s
  const [safetyFactor, setSafetyFactor] = useState(10);

  const results = useMemo(() => {
    const P = power / 1000; // W
    const a = beamDiam / 10; // cm
    const area = Math.PI * (a / 2) ** 2; // cm²
    const t = exposure;
    const SF = safetyFactor;

    // Irradiance at cornea
    const irradiance = P / area; // W/cm²
    const fluence = irradiance * t * 1000; // mJ/cm²

    // MPE calculation
    const lam = wavelength / 1000;
    let mpe: number; // J/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpe = 1.8e-3 * Math.pow(t, 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpe = 1.8e-3 * CA * Math.pow(t, 0.75);
    } else if (lam >= 1.05 && lam < 1.4) {
      mpe = t > 10 ? 0.1 : 0.01 * t;
    } else if (lam >= 1.4 && lam <= 1.8) {
      mpe = 0.1;
    } else {
      mpe = 1e-3;
    }

    const mpeIrradiance = mpe / t; // W/cm²

    // Required OD = log10(P / (MPE * area * SF))
    // Or: OD = log10(irradiance / (mpeIrradiance / SF))
    const ratio = irradiance / mpeIrradiance;
    const requiredOD = Math.log10(ratio * SF);

    // Transmission through filter
    const transmission = Math.pow(10, -requiredOD);
    const transmittedPower = P * transmission * 1000; // mW

    // Beam irradiance through filter
    const transmittedIrradiance = irradiance * transmission;

    // VLT (Visual Light Transmission) if visible
    const isVisible = wavelength >= 400 && wavelength <= 700;
    const vlt = isVisible ? transmission * 100 : null;

    // OD scale for different protection levels
    const odLevels = [
      { od: 1, name: "OD 1", trans: 10 },
      { od: 2, name: "OD 2", trans: 1 },
      { od: 3, name: "OD 3", trans: 0.1 },
      { od: 4, name: "OD 4", trans: 0.01 },
      { od: 5, name: "OD 5", trans: 0.001 },
      { od: 6, name: "OD 6", trans: 0.0001 },
      { od: 7, name: "OD 7", trans: 0.00001 },
      { od: 8, name: "OD 8", trans: 0.000001 },
    ];

    return {
      irradiance, fluence, mpe: mpe * 1000, mpeIrradiance, ratio, requiredOD,
      transmission, transmittedPower, transmittedIrradiance, vlt, odLevels,
    };
  }, [wavelength, power, beamDiam, exposure, safetyFactor]);

  const chartData = useMemo(() => {
    const ods = Array.from({ length: 100 }, (_, i) => i * 0.1);
    const transmissionPct = ods.map(od => Math.pow(10, -od) * 100);

    return [
      { x: ods, y: transmissionPct, type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#60a5fa", width: 2 } },
      {
        x: [results.requiredOD], y: [Math.pow(10, -results.requiredOD) * 100],
        type: "scatter" as const, mode: "markers" as const, name: "Required OD",
        marker: { color: "#f87171", size: 12 },
      },
    ];
  }, [results]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Required Optical Density (OD)" description="Calculates the minimum optical density required for laser protective eyewear based on beam parameters and MPE. ANSI Z136.1 / EN 207 compliant approach.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={20000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Beam Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.001} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Beam Diameter (mm)</span>
          <input type="number" value={beamDiam} onChange={e => setBeamDiam(+e.target.value)} min={0.1} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposure} onChange={e => setExposure(+e.target.value)} min={1e-9} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Safety Factor</span>
          <input type="number" value={safetyFactor} onChange={e => setSafetyFactor(+e.target.value)} min={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Corneal Irradiance</p>
          <p className="text-3xl font-bold text-blue-400">{results.irradiance.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">MPE Irradiance</p>
          <p className="text-3xl font-bold text-green-400">{results.mpeIrradiance.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-red-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Required OD</p>
          <p className="text-3xl font-bold text-red-400">OD {results.requiredOD.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">Round UP for selection</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Hazard Ratio (without protection)</p>
          <p className="text-3xl font-bold text-amber-400">{results.ratio.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Transmitted Power (at required OD)</p>
          <p className="text-3xl font-bold text-green-400">{results.transmittedPower.toFixed(4)} mW</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Optical Density", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.6, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">OD Reference Scale</h3>
        <div className="grid grid-cols-4 gap-2">
          {results.odLevels.map(level => (
            <div key={level.od} className={`rounded-lg p-3 text-center ${
              level.od >= Math.ceil(results.requiredOD) ? "bg-green-900/30 border border-green-700" : "bg-gray-800"
            }`}>
              <p className="text-lg font-bold">{level.name}</p>
              <p className="text-xs text-gray-400">T = {level.trans}%</p>
              {level.od >= Math.ceil(results.requiredOD) && <p className="text-xs text-green-400 mt-1">✓ Sufficient</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>OD = log₁₀(E / (E<sub>MPE</sub> / SF))</p>
          <p>OD = log₁₀(P<sub>beam</sub> / (MPE × A × SF))</p>
          <p>Transmission = 10<sup>−OD</sup></p>
          <p>P<sub>transmitted</sub> = P<sub>beam</sub> × 10<sup>−OD</sup></p>
          <p>Select eyewear with OD ≥ ceil(required OD)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
