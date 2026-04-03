"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

export default function PowerDensityPage() {
  const [power, setPower] = useState(1); // W
  const [diameter, setDiameter] = useState(1); // mm (1/e²)
  const [beamProfile, setBeamProfile] = useState<"gaussian" | "tophat">("gaussian");

  // Power density (irradiance): E = P / A
  // Gaussian: peak irradiance = 2P / (π w₀²) = 8P / (π d²)
  // Top-hat: E = P / (π r²) = 4P / (π d²)
  const results = useMemo(() => {
    const d_cm = diameter / 10; // cm
    const area = Math.PI * Math.pow(d_cm / 2, 2); // cm²
    const r_mm = diameter / 2; // mm
    const w0 = r_mm; // 1/e² radius = w₀

    let peakIrradiance: number; // W/cm²
    let avgIrradiance: number;

    if (beamProfile === "gaussian") {
      // For Gaussian: I_peak = 2P / (π w₀²)
      peakIrradiance = (2 * power) / (Math.PI * Math.pow(w0 / 10, 2));
      avgIrradiance = power / area;
    } else {
      // Top-hat: uniform
      peakIrradiance = power / area;
      avgIrradiance = power / area;
    }

    return { peakIrradiance, avgIrradiance, area, w0 };
  }, [power, diameter, beamProfile]);

  const chartData = useMemo(() => {
    const r = Array.from({ length: 200 }, (_, i) => (i / 200) * diameter * 1.5);
    const intensity = r.map(ri => {
      if (beamProfile === "gaussian") {
        return (2 * power) / (Math.PI * Math.pow(results.w0 / 10, 2)) * Math.exp(-2 * Math.pow(ri / results.w0, 2));
      } else {
        return ri <= diameter / 2 ? results.peakIrradiance : 0;
      }
    });
    return { r, intensity };
  }, [power, diameter, beamProfile, results]);

  const fmt = (v: number) => {
    if (v >= 1e6) return v.toExponential(2);
    if (v >= 1) return v.toFixed(2);
    if (v >= 1e-3) return (v * 1e3).toFixed(2) + " m";
    return v.toExponential(2);
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <div className="max-w-4xl mx-auto">
<h1 className="text-3xl font-bold mb-2">Power Density Calculator</h1>
        <p className="text-gray-400 mb-8">Calculate irradiance (W/cm²) from laser power and beam diameter for Gaussian and top-hat profiles.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>Gaussian peak: E<sub>peak</sub> = 2P / (π w₀²) = 8P / (π d²)</p>
            <p>Top-hat: E = P / (π r²) = 4P / (π d²)</p>
            <p>Average irradiance: E<sub>avg</sub> = P / A</p>
            <p>Area: A = π (d/2)²</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Power (W)</label>
              <input type="number" value={power} onChange={e => setPower(Math.max(0, parseFloat(e.target.value) || 0))}
                step="0.1" min="0" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">1/e² Diameter (mm)</label>
              <input type="number" value={diameter} onChange={e => setDiameter(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                step="0.1" min="0.01" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam Profile</label>
              <select value={beamProfile} onChange={e => setBeamProfile(e.target.value as any)}
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white">
                <option value="gaussian">Gaussian</option>
                <option value="tophat">Top-hat</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Peak Irradiance", value: fmt(results.peakIrradiance), unit: "W/cm²" },
              { label: "Avg Irradiance", value: fmt(results.avgIrradiance), unit: "W/cm²" },
              { label: "Beam Area", value: results.area.toFixed(4), unit: "cm²" },
              { label: "Power", value: `${power}`, unit: "W" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Radial Intensity Profile</h2>
          <ChartPanel
            data={[{
              x: chartData.r, y: chartData.intensity, type: "scatter", mode: "lines",
              name: "I(r)", line: { color: "#3b82f6", width: 2 },
              fill: "tozeroy", fillcolor: "rgba(59,130,246,0.1)",
            }]}
            layout={{
              xaxis: { title: "Radius (mm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "Irradiance (W/cm²)", color: "#9ca3af", gridcolor: "#1f2937" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 50, l: 70 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
