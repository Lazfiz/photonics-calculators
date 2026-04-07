"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function AversionResponsePage() {
  const [wavelength, setWavelength] = useState(632);
  const [beamDiam, setBeamDiam] = useState(2);
  const [divergence, setDivergence] = useState(1);

  // Aversion response time ~0.25s (blink reflex for visible 400-700nm)
  // For intrabeam: NOHD = (1/φ) * sqrt( (P * MPE_t) / (π * (MPE / t)) ) simplified
  // Key: compare accessible emission to MPE at t_aversion = 0.25s
  const tAversion = 0.25; // seconds

  const results = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const a = beamDiam / 10; // cm
    const phi = divergence / 1000; // rad

    // MPE at aversion response time for visible (400-700nm)
    let mpeAversion: number; // J/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpeAversion = 1.8e-3 * Math.pow(tAversion, 0.75); // J/cm²
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeAversion = 1.8e-3 * CA * Math.pow(tAversion, 0.75);
    } else {
      mpeAversion = 1.8e-3 * Math.pow(10, 0.02 * 0.3) * Math.pow(tAversion, 0.75);
    }

    // Maximum class 2 power = MPE * π * (1mm)² ≈ 1 mW
    const class2Power = 0.001; // W

    // Safe viewing distance for a given power
    // For CW: MPE_irradiance = MPE / t [W/cm²]
    const mpeIrradiance = mpeAversion / tAversion;

    // Aversion-response-based NOHD for intrabeam
    // NOHD = (1/φ) * sqrt(4P/(π*E_MPE))
    // For extended source (beam > 1mm at eye): use larger limiting aperture
    const beamAtEye = a + phi * 0; // at distance=0
    const limitingAperture = beamAtEye > 0.1 ? 0.7 : 0.1; // cm
    const safePower = mpeIrradiance * Math.PI * limitingAperture * limitingAperture;

    return {
      tAversion,
      mpeAversion: mpeAversion * 1000, // mJ/cm²
      mpeIrradiance,
      class2PowerMW: class2Power * 1000,
      safePowerMW: safePower * 1000,
      limitingAperture,
    };
  }, [wavelength, beamDiam, divergence]);

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 300 }, (_, i) => 400 + i * 5);
    const mpeVals = wavelengths.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.4 && lam < 0.7) return 1.8e-3 * Math.pow(tAversion, 0.75) * 1000;
      if (lam >= 0.7 && lam < 1.05) return 1.8e-3 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(tAversion, 0.75) * 1000;
      return 1.8e-3 * Math.pow(10, 0.02 * 0.3) * Math.pow(tAversion, 0.75) * 1000;
    });
    const class2Line = wavelengths.map(() => 1.0); // 1 mW reference

    return [
      { x: wavelengths, y: mpeVals, type: "scatter" as const, mode: "lines" as const, name: "MPE (t=0.25s)", line: { color: "#60a5fa" } },
      { x: wavelengths, y: class2Line, type: "scatter" as const, mode: "lines" as const, name: "Class 2 limit (1 mW)", line: { color: "#f87171", dash: "dash" } },
    ];
  }, []);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Aversion Response Time" description="Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={1400} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Divergence (mrad)" value={divergence} onChange={setDivergence} min={0.1} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">MPE at t = {results.tAversion} s</p>
          <p className="text-3xl font-bold text-blue-400">{results.mpeAversion.toFixed(3)} mJ/cm²</p>
          <p className="text-sm text-gray-500 mt-1">λ = {wavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">MPE Irradiance (W/cm²)</p>
          <p className="text-3xl font-bold text-green-400">{results.mpeIrradiance.toFixed(3)}</p>
          <p className="text-sm text-gray-500 mt-1">Limiting aperture: {results.limitingAperture} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Class 2 Power Limit</p>
          <p className="text-3xl font-bold text-amber-400">{results.class2PowerMW.toFixed(1)} mW</p>
          <p className="text-sm text-gray-500 mt-1">Visible only (400–700 nm)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Safe Power at Aversion Time</p>
          <p className="text-3xl font-bold text-purple-400">{results.safePowerMW.toFixed(3)} mW</p>
          <p className="text-sm text-gray-500 mt-1">For given beam parameters</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "MPE at 0.25 s (mJ/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>t<sub>aversion</sub> = 0.25 s (natural blink reflex)</p>
          <p>MPE (400–700 nm, t &lt; 10 s) = 1.8 × t<sup>0.75</sup> mJ/cm²</p>
          <p>MPE (700–1050 nm) = 1.8 × C<sub>A</sub> × t<sup>0.75</sup> mJ/cm²</p>
          <p>C<sub>A</sub> = 10<sup>0.02(λ−0.7)</sup></p>
          <p>Class 2 limit: P ≤ 1 mW (visible, relies on aversion response)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
