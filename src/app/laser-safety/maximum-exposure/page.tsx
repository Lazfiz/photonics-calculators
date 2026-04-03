"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

export default function MaximumExposurePage() {
  const [wavelength, setWavelength] = useState(632); // nm
  const [power, setPower] = useState(0.001); // W
  const [beamDiam, setBeamDiam] = useState(2); // mm
  const [mpeValue, setMpeValue] = useState(1.8); // mJ/cm²

  // Maximum exposure duration calculator
  // Given a laser's irradiance, how long can you be safely exposed?
  //
  // For visible (400-700nm): MPE(t) = 1.8×10⁻³ × t^0.75 J/cm²
  // Solving for t: t = (H / 1.8e-3)^(1/0.75) = (H / 1.8e-3)^(4/3)
  // where H = irradiance × t, so H/t = E (irradiance)
  //
  // E × t = 1.8e-3 × t^0.75
  // E = 1.8e-3 × t^(-0.25)
  // t = (1.8e-3 / E)^4

  const results = useMemo(() => {
    const lam = wavelength; // nm
    const d_cm = beamDiam / 10;
    const area = Math.PI * Math.pow(d_cm / 2, 2); // cm²
    const irradiance = power / area; // W/cm²
    const mpe_Jcm2 = mpeValue / 1000; // J/cm²

    // Calculate maximum safe exposure time
    let tMax: number;
    let regime: string;

    if (lam >= 400 && lam < 700) {
      // Visible: MPE(t) = 1.8e-3 × t^0.75
      // H_acc = E × t ≤ 1.8e-3 × t^0.75
      // E × t^0.25 ≤ 1.8e-3
      // t ≤ (1.8e-3 / E)^4
      const base = 1.8e-3;
      tMax = Math.pow(base / irradiance, 4);
      tMax = Math.min(tMax, 10); // cap at 10s for retinal
      regime = "Visible retinal";
    } else if (lam >= 700 && lam < 1050) {
      const CA = Math.pow(10, 0.02 * ((lam / 1000) - 0.7));
      tMax = Math.pow((1.8e-3 * CA) / irradiance, 4);
      tMax = Math.min(tMax, 10);
      regime = "Near-IR retinal";
    } else if (lam >= 1400 && lam <= 4000) {
      // IR corneal: MPE = 0.1 × t^0.5 for t ≤ 10s
      // E × t = 0.1 × t^0.5 → E = 0.1 × t^(-0.5) → t = (0.1/E)^2
      tMax = Math.pow(0.1 / irradiance, 2);
      tMax = Math.min(tMax, 10);
      regime = "IR corneal";
    } else {
      tMax = Math.pow(0.01 / irradiance, 2);
      tMax = Math.min(tMax, 10);
      regime = "Far-IR corneal";
    }

    // Accumulated energy at t_max
    const energyAtTmax = irradiance * tMax; // J/cm²

    // Safety factor: ratio of MPE energy to actual energy at t_max
    const safetyFactor = 1.0; // by definition at t_max

    // How long until 10× overexposure
    const t10x = tMax * 10;

    return { irradiance, tMax, regime, area, energyAtTmax, t10x };
  }, [wavelength, power, beamDiam, mpeValue]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => {
      const logT = -5 + (i / 199) * 2; // 10µs to 100s
      return Math.pow(10, logT);
    });
    const lam = wavelength;

    // MPE energy vs time
    const mpeEnergy = times.map(t => {
      if (lam >= 400 && lam < 700) return 1.8e-3 * Math.pow(Math.min(t, 10), 0.75);
      if (lam >= 700 && lam < 1050) {
        const CA = Math.pow(10, 0.02 * ((lam / 1000) - 0.7));
        return 1.8e-3 * CA * Math.pow(Math.min(t, 10), 0.75);
      }
      if (lam >= 1400 && lam <= 4000) return t <= 10 ? 0.1 * Math.pow(t, 0.5) : 0.56 * Math.pow(t, 0.25);
      return t <= 10 ? 0.01 * Math.pow(t, 0.5) : 0.056 * Math.pow(t, 0.25);
    });

    // Actual energy accumulation
    const actualEnergy = times.map(t => results.irradiance * t);

    return { times, mpeEnergy, actualEnergy };
  }, [wavelength, results.irradiance]);

  const fmtTime = (t: number) => {
    if (t < 1e-6) return (t * 1e9).toFixed(1) + " ns";
    if (t < 1e-3) return (t * 1e6).toFixed(1) + " µs";
    if (t < 1) return (t * 1000).toFixed(1) + " ms";
    return t.toFixed(3) + " s";
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">Maximum Exposure Duration</h1>
        <p className="text-gray-400 mb-8">Given a laser's parameters, calculate the maximum safe exposure time before exceeding MPE.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>Visible: MPE(t) = 1.8×10⁻³ × t^0.75 J/cm²</p>
            <p>t<sub>max</sub> = (1.8×10⁻³ / E)^4  (solving E × t = MPE(t))</p>
            <p>E = P / (π(d/2)²)  (corneal irradiance)</p>
            <p>Accumulated energy: H = E × t</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={e => setWavelength(parseFloat(e.target.value) || 400)}
                step="1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Power (W)</label>
              <input type="number" value={power} onChange={e => setPower(Math.max(0, parseFloat(e.target.value) || 0))}
                step="any" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam Diameter (mm)</label>
              <input type="number" value={beamDiam} onChange={e => setBeamDiam(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">MPE Reference (mJ/cm²)</label>
              <input type="number" value={mpeValue} onChange={e => setMpeValue(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Regime", value: results.regime, unit: "" },
              { label: "Corneal Irradiance", value: results.irradiance.toExponential(2), unit: "W/cm²" },
              { label: "Max Safe Time", value: fmtTime(results.tMax), unit: "" },
              { label: "Energy at t_max", value: (results.energyAtTmax * 1000).toFixed(3), unit: "mJ/cm²" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">MPE Energy vs Accumulated Energy</h2>
          <ChartPanel
            data={[
              {
                x: chartData.times, y: chartData.mpeEnergy.map(v => v * 1000), type: "scatter", mode: "lines",
                name: "MPE (mJ/cm²)", line: { color: "#22c55e", width: 2 },
              },
              {
                x: chartData.times, y: chartData.actualEnergy.map(v => v * 1000), type: "scatter", mode: "lines",
                name: "Actual (mJ/cm²)", line: { color: "#ef4444", width: 2, dash: "dash" },
              },
            ]}
            layout={{
              xaxis: { title: "Exposure Time (s)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              yaxis: { title: "Energy (mJ/cm²)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, legend: { orientation: "h", y: -0.2 },
              margin: { t: 30, r: 30, b: 60, l: 70 },
            }}
           
           
          />
          <p className="text-sm text-gray-500 mt-3">The crossing point shows t<sub>max</sub> — the maximum safe exposure duration.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
