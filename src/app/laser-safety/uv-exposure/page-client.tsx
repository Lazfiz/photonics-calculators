"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";
import { actinicUvWeight, uvMaxIrradiance, UV_LIMIT_PERIOD } from "../../../physics/laser-safety/hazard-weighting";

export default function UVExposurePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 254); // nm (UV-C, mercury line)
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 8); // hours
  const [beamArea, setBeamArea] = useURLState("beamArea", 1); // cm²

  // S(λ) and the limits: src/physics/laser-safety/hazard-weighting.ts (ICNIRP 2004 Table 1). SI inside.
  const results = useMemo(() => {
    const t = exposureTime * 3600; // s
    const S = actinicUvWeight(wavelength * 1e-9);
    const mpeUnweighted = uvMaxIrradiance(wavelength * 1e-9, t) / 1e4; // W/cm², within both limits
    const mpeUnweightedJ = mpeUnweighted * t; // J/cm² over the exposure
    const tlvFraction = t / UV_LIMIT_PERIOD; // fraction of the 8 h period the limits apply to
    return { S, mpeUnweighted, mpeUnweightedJ, tlvFraction };
  }, [wavelength, exposureTime]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 221 }, (_, i) => 180 + i);
    const weights = wls.map((w) => actinicUvWeight(w * 1e-9));
    return { wls, weights };
  }, []);

  const fmtSci = (v: number) => v === Infinity ? "no limit" : v !== 0 && v < 0.01 ? v.toExponential(2) : v.toFixed(4);

  return (
    <>
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>Actinic: Σ E<sub>λ</sub> S(λ) Δλ · t ≤ 3 mJ/cm² within 8 h (ICNIRP 2004, S(λ) from its Table 1)</p>
            <p>E<sub>max</sub>(t) = 3 mJ/cm² / (S(λ) · t)  (single wavelength)</p>
            <p>UVA eye, 315–400 nm: E · t ≤ 1 J/cm² unweighted within 8 h, so E<sub>max</sub> ≤ 1 J/cm² / t</p>
            <p>S(270 nm) = 1 (peak weighting)</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
            <div>
              <ValidatedNumberInput label="Exposure Time (hours)" value={exposureTime} onChange={setExposureTime} step="0.5" />
            </div>
            <div>
              <ValidatedNumberInput label="Beam/Source Area (cm²)" value={beamArea} onChange={setBeamArea} step="0.1" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "S(λ) Weight", value: results.S !== 0 && results.S < 0.01 ? results.S.toExponential(2) : results.S.toPrecision(3), unit: "" },
              { label: "MPE Irradiance", value: fmtSci(results.mpeUnweighted), unit: "W/cm²" },
              { label: "MPE Energy", value: fmtSci(results.mpeUnweightedJ), unit: "J/cm²" },
              { label: "Max Power (source)", value: fmtSci(results.mpeUnweighted * beamArea), unit: "W" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#0d0d14] rounded-lg p-3">
            <p className="text-sm text-gray-400">
              {results.tlvFraction <= 1
                ? `The limits apply per 8-hour period; this exposure is ${(results.tlvFraction * 100).toFixed(1)}% of it.`
                : `⚠️ Longer than the 8-hour period the limits are defined for (${(results.tlvFraction * 100).toFixed(1)}% of it).`}
            </p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Actinic UV Weighting Function S(λ)</h2>
          <ChartPanel
            data={[
              {
                x: chartData.wls, y: chartData.weights, type: "scatter", mode: "lines",
                name: "S(λ)", line: { color: "#a855f7", width: 2 },
              },
              ...(results.S > 0 ? [{
                x: [wavelength], y: [results.S], type: "scatter", mode: "markers",
                name: "Selected λ", marker: { color: "#ef4444", size: 12 },
              }] : []),
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "S(λ)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 50, l: 50 },
            }}
           
           
          />
        </div>
      </div>
    </>
  );
}
