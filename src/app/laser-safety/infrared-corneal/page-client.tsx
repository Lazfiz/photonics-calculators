"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

export default function InfraredCornealPage() {
  const [wavelength, setWavelength] = useState(10600); // nm (CO2)
  const [exposureTime, setExposureTime] = useState(10); // seconds
  const [beamDiam, setBeamDiam] = useState(1); // mm

  // IR corneal MPE (IEC 60825-1)
  // For 1400nm to 1mm wavelength, corneal limits apply (not retinal):
  //
  // 1400-4000nm (IR-B, IR-C):
  //   For t ≤ 10s: MPE = 0.1 × t^0.5 J/cm²
  //   For t > 10s: MPE = 0.56 × t^0.25 J/cm²
  //
  // 4000nm-1mm (far IR):
  //   For t ≤ 10s: MPE = 0.01 × t^0.5 J/cm²
  //   For t > 10s: MPE = 0.056 × t^0.25 J/cm²
  //
  // 780-1400nm (IR-A): retinal limits apply with C_A correction

  const results = useMemo(() => {
    const lam = wavelength; // nm
    const t = Math.max(exposureTime, 1e-6);
    const d_cm = beamDiam / 10;

    let mpe: number; // J/cm²
    let regime: string;

    if (lam < 780) {
      // Visible - retinal limits apply (not covered here)
      mpe = 1.8e-3 * Math.pow(Math.min(t, 10), 0.75);
      regime = "Visible (retinal)";
    } else if (lam < 1400) {
      // IR-A: retinal with C_A correction
      const CA = Math.pow(10, 0.02 * (lam / 1000 - 0.7));
      mpe = 1.8e-3 * CA * Math.pow(Math.min(t, 10), 0.75);
      regime = "IR-A (retinal + C_A)";
    } else if (lam <= 4000) {
      // IR-B/IR-C: corneal limits
      if (t <= 10) {
        mpe = 0.1 * Math.pow(t, 0.5);
      } else {
        mpe = 0.56 * Math.pow(t, 0.25);
      }
      regime = "IR-B/C (corneal)";
    } else {
      // Far IR
      if (t <= 10) {
        mpe = 0.01 * Math.pow(t, 0.5);
      } else {
        mpe = 0.056 * Math.pow(t, 0.25);
      }
      regime = "Far IR (corneal)";
    }

    // Maximum power for safe exposure
    const area = Math.PI * Math.pow(d_cm / 2, 2);
    const mpePower = mpe / t * area; // W (max power through this beam)

    // MPE as irradiance (W/cm²)
    const mpeIrradiance = mpe / t; // W/cm²

    return { mpe, mpeIrradiance, mpePower, regime, area };
  }, [wavelength, exposureTime, beamDiam]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => {
      const logT = -5 + (i / 199) * 5; // 10µs to 100s
      return Math.pow(10, logT);
    });
    const lam = wavelength;

    const mpeValues = times.map(t => {
      if (lam < 780) return 1.8e-3 * Math.pow(Math.min(t, 10), 0.75);
      if (lam < 1400) {
        const CA = Math.pow(10, 0.02 * (lam / 1000 - 0.7));
        return 1.8e-3 * CA * Math.pow(Math.min(t, 10), 0.75);
      }
      if (lam <= 4000) return t <= 10 ? 0.1 * Math.pow(t, 0.5) : 0.56 * Math.pow(t, 0.25);
      return t <= 10 ? 0.01 * Math.pow(t, 0.5) : 0.056 * Math.pow(t, 0.25);
    });

    return { times, mpeValues };
  }, [wavelength]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">IR Corneal Exposure</h1>
        <p className="text-gray-400 mb-8">Calculate corneal MPE for infrared lasers (1400nm–1mm) per IEC 60825-1.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>1400–4000 nm: MPE = 0.1 × t^0.5 J/cm² (t ≤ 10s)</p>
            <p>1400–4000 nm: MPE = 0.56 × t^0.25 J/cm² (t &gt; 10s)</p>
            <p>&gt;4000 nm: MPE = 0.01 × t^0.5 J/cm² (t ≤ 10s)</p>
            <p>&gt;4000 nm: MPE = 0.056 × t^0.25 J/cm² (t &gt; 10s)</p>
            <p>780–1400 nm: Retinal MPE × C<sub>A</sub></p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={e => setWavelength(parseFloat(e.target.value) || 780)}
                step="1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
              <input type="number" value={exposureTime} onChange={e => setExposureTime(Math.max(1e-5, parseFloat(e.target.value) || 1e-5))}
                step="any" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam Diameter (mm)</label>
              <input type="number" value={beamDiam} onChange={e => setBeamDiam(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Regime", value: results.regime, unit: "" },
              { label: "MPE", value: results.mpe < 0.01 ? results.mpe.toExponential(2) : results.mpe.toFixed(3), unit: "J/cm²" },
              { label: "MPE Irradiance", value: results.mpeIrradiance < 0.01 ? results.mpeIrradiance.toExponential(2) : results.mpeIrradiance.toFixed(3), unit: "W/cm²" },
              { label: "Max Safe Power", value: results.mpePower < 0.01 ? results.mpePower.toExponential(2) : results.mpePower.toFixed(3), unit: "W" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">MPE vs Exposure Time</h2>
          <ChartPanel
            data={[{
              x: chartData.times, y: chartData.mpeValues, type: "scatter", mode: "lines",
              name: "MPE (J/cm²)", line: { color: "#ef4444", width: 2 },
            }]}
            layout={{
              xaxis: { title: "Exposure Time (s)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              yaxis: { title: "MPE (J/cm²)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 60, l: 70 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
