"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  FWHM_PER_D1E2, d1e2From, gaussianDiameters, powerInsideDiameter, relativeIntensity, type DiameterKind,
} from "../../../physics/laser-safety/beam-diameter";

const fmtLen = (x: number) => (Number.isFinite(x) ? x.toPrecision(5) : "—");
const fmtPct = (x: number) => (Number.isFinite(x) ? (100 * x).toFixed(2) + " %" : "—");

export default function BeamDiameterConversionPage() {
  const [inputValue, setInputValue] = useURLState("inputValue", 1); // mm
  const [inputTypeParam, setInputType] = useURLState("inputType", "1e2");
  const inputType: DiameterKind = inputTypeParam === "1e" || inputTypeParam === "fwhm" ? inputTypeParam : "1e2";

  // Gaussian beam I(r) = I₀ exp(−2r²/w²), d(1/e²) = 2w: src/physics/laser-safety/beam-diameter.ts. The relations are
  // ratios, so the diameters stay in mm.
  const conversions = useMemo(() => {
    const d = gaussianDiameters(d1e2From(inputType, inputValue));
    return {
      ...d,
      // Intensity at, and power inside, each diameter's circle.
      i1e2: relativeIntensity(d.d1e2 / 2, d.w),
      i1e: relativeIntensity(d.d1e / 2, d.w),
      iFwhm: relativeIntensity(d.fwhm / 2, d.w),
      p1e2: powerInsideDiameter(d.d1e2, d.w),
      p1e: powerInsideDiameter(d.d1e, d.w),
      pFwhm: powerInsideDiameter(d.fwhm, d.w),
    };
  }, [inputValue, inputType]);

  const valid = Number.isFinite(conversions.d1e2);

  const chartData = useMemo(() => {
    if (!Number.isFinite(conversions.w)) return null;
    const r = Array.from({ length: 201 }, (_, i) => (i / 200) * conversions.d1e2); // 0 … 2w
    const intensity = r.map((ri) => relativeIntensity(ri, conversions.w));
    return { r, intensity };
  }, [conversions]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="max-w-4xl mx-auto">

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conversion Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
            <p>d<sub>1/e</sub> = d<sub>1/e²</sub> / √2 ≈ {(1 / Math.SQRT2).toFixed(4)} d<sub>1/e²</sub></p>
            <p>d<sub>FWHM</sub> = d<sub>1/e²</sub> × √(ln 2 / 2) ≈ {FWHM_PER_D1E2.toFixed(4)} d<sub>1/e²</sub></p>
            <p>w = d<sub>1/e²</sub> / 2</p>
            <p>I(r) = I₀ exp(−2r²/w²)</p>
            <p>P(inside d) / P = 1 − exp(−d² / (2w²))</p>
          </div>
          <p className="text-sm text-gray-400">
            The IEC 60825-1 and ANSI Z136.1 &ldquo;beam diameter&rdquo;, used in the exposure limits and hazard
            distances, is the 1/e diameter (the circle that holds 63 % of the power). Datasheets often quote the 1/e²
            diameter instead, which is √2 larger.
          </p>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="diameter-type" className="block text-sm text-gray-400 mb-1">Diameter Type</label>
              <select
                id="diameter-type"
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white"
              >
                <option value="1e2">1/e² diameter</option>
                <option value="1e">1/e diameter</option>
                <option value="fwhm">FWHM</option>
              </select>
            </div>
            <div>
              <ValidatedNumberInput label="Diameter (mm)" value={inputValue} onChange={setInputValue} min={0.001} max={10000} step="any" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "1/e² diameter", value: fmtLen(conversions.d1e2), unit: "mm", highlight: inputType === "1e2", note: fmtPct(conversions.p1e2) + " of the power inside" },
              { label: "1/e diameter", value: fmtLen(conversions.d1e), unit: "mm", highlight: inputType === "1e", note: fmtPct(conversions.p1e) + " of the power inside" },
              { label: "FWHM", value: fmtLen(conversions.fwhm), unit: "mm", highlight: inputType === "fwhm", note: fmtPct(conversions.pFwhm) + " of the power inside" },
              { label: "Beam radius w (1/e²)", value: fmtLen(conversions.w), unit: "mm", highlight: false, note: "w = d(1/e²) / 2" },
            ].map(item => (
              <div key={item.label} className={`bg-[#0d0d14] rounded-lg p-4 ${item.highlight ? "border border-blue-500" : ""}`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
                <p className="text-xs text-gray-400 mt-1">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-[#0d0d14] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Intensity Ratios (relative to peak)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">At 1/e² radius:</span> {fmtPct(conversions.i1e2)}</div>
              <div><span className="text-gray-400">At 1/e radius:</span> {fmtPct(conversions.i1e)}</div>
              <div><span className="text-gray-400">At FWHM radius:</span> {fmtPct(conversions.iFwhm)}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Gaussian Beam Profile</h2>
          {valid && chartData ? (
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
                  x: [conversions.fwhm / 2, conversions.fwhm / 2],
                  y: [0, conversions.iFwhm],
                  mode: "lines",
                  name: "FWHM",
                  line: { color: "#f59e0b", width: 1, dash: "dash" },
                },
                {
                  x: [conversions.d1e2 / 2, conversions.d1e2 / 2],
                  y: [0, conversions.i1e2],
                  mode: "lines",
                  name: "1/e²",
                  line: { color: "#ef4444", width: 1, dash: "dash" },
                },
                {
                  x: [conversions.d1e / 2, conversions.d1e / 2],
                  y: [0, conversions.i1e],
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
          ) : (
            <p className="text-sm text-gray-400">Enter a diameter above to see the profile.</p>
          )}
        </div>
      </div>
    </>
  );
}
