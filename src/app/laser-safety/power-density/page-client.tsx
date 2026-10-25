"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { beamIrradiance, irradianceAt, type BeamProfile } from "../../../physics/laser-safety/power-density";

const W_PER_M2_TO_W_PER_CM2 = 1e-4;

export default function PowerDensityPage() {
  const [power, setPower] = useURLState("power", 1, { min: 0 }); // W
  const [diameter, setDiameter] = useURLState("diameter", 1, { min: 0.01 }); // mm (1/e²)
  const [beamProfile, setBeamProfile] = useState<BeamProfile>("gaussian");

  const results = useMemo(() => {
    const r = beamIrradiance(power, diameter * 1e-3, beamProfile);
    return {
      peakIrradiance: r.peak * W_PER_M2_TO_W_PER_CM2,
      avgIrradiance: r.mean * W_PER_M2_TO_W_PER_CM2,
      area: r.area * 1e4, // cm²
    };
  }, [power, diameter, beamProfile]);

  const chartData = useMemo(() => {
    const r = Array.from({ length: 200 }, (_, i) => (i / 200) * diameter * 1.5); // mm
    const intensity = r.map(ri => irradianceAt(ri * 1e-3, power, diameter * 1e-3, beamProfile) * W_PER_M2_TO_W_PER_CM2);
    return { r, intensity };
  }, [power, diameter, beamProfile]);

  const fmt = (v: number) => {
    if (v >= 1e6) return v.toExponential(2);
    if (v >= 1) return v.toFixed(2);
    if (v >= 1e-3) return (v * 1e3).toFixed(2) + " m";
    return v.toExponential(2);
  };

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="max-w-4xl mx-auto">

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
              <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} min={0} step="0.1" />
            </div>
            <div>
              <ValidatedNumberInput label="1/e² Diameter (mm)" value={diameter} onChange={setDiameter} min={0.01} step="0.1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam Profile</label>
              <select value={beamProfile} onChange={e => setBeamProfile(e.target.value === "tophat" ? "tophat" : "gaussian")}
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
    </>
  );
}
