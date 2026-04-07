"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
export default function BeamDiameterConversionPage() {
  const [inputValue, setInputValue] = useState(1);
  const [inputType, setInputType] = useState<"1e2" | "1e" | "fwhm">("1e2");

  // Gaussian beam relationships:
  // 1/e² diameter = 2w₀ (standard definition)
  // 1/e diameter = w₀ × √2 = d(1/e²) / √2
  // FWHM = w₀ × 2√(ln2) ≈ d(1/e²) × √(ln2) ≈ 0.8326 × d(1/e²)
  const conversions = useMemo(() => {
    const d1e2 = inputType === "1e2" ? inputValue :
                 inputType === "1e" ? inputValue * Math.SQRT2 :
                 inputValue / Math.sqrt(Math.LN2);
    const d1e = d1e2 / Math.SQRT2;
    const dFWHM = d1e2 * Math.sqrt(Math.LN2);
    const w0 = d1e2 / 2; // beam waist radius
    return { d1e2, d1e, dFWHM, w0 };
  }, [inputValue, inputType]);

  // Intensity ratios relative to peak
  // I(r) = I₀ exp(-2r²/w₀²)
  // At 1/e²: I = I₀ × e⁻² ≈ 0.1353
  // At 1/e: I = I₀ × e⁻¹ ≈ 0.3679
  // At FWHM: I = I₀ / 2 = 0.5
  const ratios = {
    "1/e²": Math.exp(-2),
    "1/e": Math.exp(-1),
    FWHM: 0.5,
  };

  const chartData = useMemo(() => {
    const r = Array.from({ length: 300 }, (_, i) => (i / 300) * conversions.d1e2 * 1.5);
    const intensity = r.map(ri => Math.exp(-2 * Math.pow(ri / conversions.w0, 2)));
    return {
      r,
      intensity,
    };
  }, [conversions]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <div className="max-w-4xl mx-auto">
<h1 className="text-3xl font-bold mb-2">Beam Diameter Conversion</h1>
        <p className="text-gray-400 mb-8">Convert between 1/e², 1/e, and FWHM beam diameter definitions for Gaussian beams.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conversion Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
            <p>d<sub>1/e</sub> = d<sub>1/e²</sub> / √2 ≈ {conversions.d1e2 !== undefined ? (1 / Math.SQRT2).toFixed(4) : ''}</p>
            <p>d<sub>FWHM</sub> = d<sub>1/e²</sub> × √(ln 2) ≈ {Math.sqrt(Math.LN2).toFixed(4)}</p>
            <p>w₀ = d<sub>1/e²</sub> / 2</p>
            <p>I(r) = I₀ exp(−2r²/w₀²)</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Diameter Type</label>
              <select
                value={inputType}
                onChange={e => setInputType(e.target.value as any)}
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white"
              >
                <option value="1e2">1/e² diameter</option>
                <option value="1e">1/e diameter</option>
                <option value="fwhm">FWHM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Diameter (mm)</label>
              <input
                type="number"
                value={inputValue}
                onChange={e => setInputValue(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                step="0.1"
                min="0.001"
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "1/e² diameter", value: conversions.d1e2.toFixed(4), unit: "mm", highlight: inputType === "1e2" },
              { label: "1/e diameter", value: conversions.d1e.toFixed(4), unit: "mm", highlight: inputType === "1e" },
              { label: "FWHM", value: conversions.dFWHM.toFixed(4), unit: "mm", highlight: inputType === "fwhm" },
              { label: "Beam waist (w₀)", value: conversions.w0.toFixed(4), unit: "mm", highlight: false },
            ].map(item => (
              <div key={item.label} className={`bg-[#0d0d14] rounded-lg p-4 ${item.highlight ? "border border-blue-500" : ""}`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-[#0d0d14] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Intensity Ratios (relative to peak)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">At 1/e² radius:</span> {(ratios["1/e²"] * 100).toFixed(2)}%</div>
              <div><span className="text-gray-400">At 1/e radius:</span> {(ratios["1/e"] * 100).toFixed(2)}%</div>
              <div><span className="text-gray-400">At FWHM radius:</span> {(ratios.FWHM * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Gaussian Beam Profile</h2>
          <ChartPanel
            data={[
              {
                x: chartData.r,
                y: chartData.intensity,
                type: "scatter",
                mode: "lines",
                name: "I(r)/I₀",
                line: { color: "#3b82f6", width: 2 },
                fill: "tozeroy",
                fillcolor: "rgba(59,130,246,0.1)",
              },
              {
                x: [conversions.dFWHM / 2, conversions.dFWHM / 2],
                y: [0, 0.5],
                mode: "lines",
                name: "FWHM",
                line: { color: "#f59e0b", width: 1, dash: "dash" },
              },
              {
                x: [conversions.d1e2 / 2, conversions.d1e2 / 2],
                y: [0, Math.exp(-2)],
                mode: "lines",
                name: "1/e²",
                line: { color: "#ef4444", width: 1, dash: "dash" },
              },
              {
                x: [conversions.d1e / 2, conversions.d1e / 2],
                y: [0, Math.exp(-1)],
                mode: "lines",
                name: "1/e",
                line: { color: "#22c55e", width: 1, dash: "dash" },
              },
            ]}
            layout={{
              xaxis: { title: "Radius (mm)", color: "#9ca3af", gridcolor: "#1f2937", zerolinecolor: "#374151" },
              yaxis: { title: "Normalised Intensity", color: "#9ca3af", gridcolor: "#1f2937", zerolinecolor: "#374151", range: [0, 1.1] },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              legend: { orientation: "h", y: -0.2 },
              margin: { t: 30, r: 30, b: 60, l: 60 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
