"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";
export default function UVExposurePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 254); // nm (UV-C, mercury line)
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 8); // hours
  const [beamArea, setBeamArea] = useURLState("beamArea", 1); // cm²

  // UV exposure limits (ICNIRP / ACGIH TLV)
  // For UV (180-400nm):
  // Actinic UV weighting function S(λ) - peaks at ~270nm
  // TLV = 3 mJ/cm² (for S(λ)-weighted, 8hr exposure)
  //
  // S(λ) simplified:
  // S(λ) = 1 at 270nm, falls off on both sides
  // MPE(t) = TLV / t for long exposures (simplified)
  // MPE = 0.003 J/cm² for unweighted 270nm, 8hr

  const uvWeight = (lambda: number): number => {
    // Simplified ACGIH actinic UV weighting
    if (lambda < 180 || lambda > 400) return 0;
    // Gaussian approximation centered at 270nm
    return Math.exp(-Math.pow((lambda - 270) / 30, 2));
  };

  const results = useMemo(() => {
    const t = exposureTime * 3600; // seconds
    const S = uvWeight(wavelength);

    // TLV: 3 mJ/cm² S(λ)-weighted per 8-hour day
    // Equivalent irradiance limit: 3e-3 / 28800 ≈ 1.04×10⁻⁷ W/cm² at peak
    const tlv = 3e-3; // J/cm² (weighted)
    const dailyLimit = tlv; // J/cm² S-weighted

    // Maximum permissible irradiance for given exposure
    const mpeIrradiance = dailyLimit / t; // W/cm² (S-weighted)
    // Unweighted: divide by S(λ)
    const mpeUnweighted = S > 0 ? mpeIrradiance / S : Infinity; // W/cm²
    const mpeUnweightedJ = mpeUnweighted * t; // J/cm² unweighted for the exposure time

    // How much of the TLV is used in the given time
    const tlvFraction = t / 28800; // fraction of 8hr day

    return { S, mpeIrradiance, mpeUnweighted, mpeUnweightedJ, tlvFraction, dailyLimit };
  }, [wavelength, exposureTime]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 180 + (i / 199) * 220);
    const weights = wls.map(uvWeight);
    return { wls, weights };
  }, []);

  const fmtSci = (v: number) => v < 1e-4 ? v.toExponential(2) : v < 0.01 ? v.toExponential(2) : v.toFixed(4);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">UV Exposure Limits</h1>
        <p className="text-gray-400 mb-8">Calculate UV exposure limits based on ICNIRP/ACGIH actinic UV weighting for 180–400 nm.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>TLV = 3 mJ/cm² (S(λ)-weighted, 8h day)</p>
            <p>E<sub>MPE</sub>(t) = TLV / t  (S-weighted irradiance)</p>
            <p>E<sub>unweighted</sub> = E<sub>MPE</sub> / S(λ)</p>
            <p>S(270 nm) = 1 (peak weighting)</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={e => setWavelength(parseFloat(e.target.value) || 200)}
                step="1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Exposure Time (hours)</label>
              <input type="number" value={exposureTime} onChange={e => setExposureTime(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                step="0.5" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam/Source Area (cm²)</label>
              <input type="number" value={beamArea} onChange={e => setBeamArea(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "S(λ) Weight", value: results.S.toFixed(4), unit: "" },
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
                ? `✅ Within TLV: ${(results.tlvFraction * 100).toFixed(1)}% of 8-hour daily limit`
                : `⚠️ Exceeds TLV: ${(results.tlvFraction * 100).toFixed(1)}% of 8-hour daily limit`}
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
                fill: "tozeroy", fillcolor: "rgba(168,85,247,0.15)",
              },
              {
                x: [wavelength], y: [uvWeight(wavelength)], type: "scatter", mode: "markers",
                name: "Selected λ", marker: { color: "#ef4444", size: 12 },
              },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "S(λ)", color: "#9ca3af", gridcolor: "#1f2937", range: [0, 1.1] },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 50, l: 50 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
