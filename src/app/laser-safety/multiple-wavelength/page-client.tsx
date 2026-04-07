"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function MultipleWavelengthPage() {
  const [wavelengths, setWavelengths] = useState("532, 650, 808");
  const [powers, setPowers] = useState("100, 50, 200");
  const [exposure, setExposure] = useURLState("exposure", 0.25);

  const results = useMemo(() => {
    const wls = wavelengths.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const pws = powers.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const t = exposure;

    if (wls.length !== pws.length || wls.length === 0) return null;

    // MPE for each wavelength
    const mpes = wls.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.4 && lam < 0.7) return 1.8e-3 * Math.pow(t, 0.75);
      if (lam >= 0.7 && lam < 1.05) return 1.8e-3 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(t, 0.75);
      if (lam >= 1.05 && lam < 1.4) return t > 10 ? 0.01 : 0.01;
      if (lam >= 1.4 && lam <= 1.8) return 0.1;
      return 1e-3;
    });

    // Hazard ratio per wavelength: (P_beam / MPE)
    const ratios = wls.map((wl, i) => {
      const beamArea = Math.PI * 0.1 * 0.1; // 1cm limiting aperture, 0.1cm radius
      const irradiance = (pws[i] / 1000) / beamArea; // W/cm²
      const mpeIrradiance = mpes[i] / t; // W/cm²
      return irradiance / mpeIrradiance;
    });

    const totalRatio = ratios.reduce((a, b) => a + b, 0);

    return { wls, pws, mpes, ratios, totalRatio };
  }, [wavelengths, powers, exposure]);

  const chartData = useMemo(() => {
    if (!results) return [];
    return [
      {
        x: results.wls.map(w => `${w} nm`),
        y: results.ratios,
        type: "bar" as const,
        name: "Hazard Ratio",
        marker: { color: results.ratios.map(r => r > 1 ? "#f87171" : "#60a5fa") },
      },
    ];
  }, [results]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Multiple Wavelength MPE" description="Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be &lt; 1 for safety per ANSI Z136.1 Section 8.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelengths (nm, comma-separated)</span>
          <input type="text" value={wavelengths} onChange={e => setWavelengths(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Powers (mW, comma-separated, same order)</span>
          <input type="text" value={powers} onChange={e => setPowers(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <ValidatedNumberInput label="Exposure Time (s)" value={exposure} onChange={setExposure} min={1e-9} step="any" />
      </div>

      {results && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-400">Total Hazard Ratio (Σ Hᵢ/MPEᵢ)</p>
            <p className={`text-3xl font-bold ${results.totalRatio < 1 ? "text-green-400" : "text-red-400"}`}>
              {results.totalRatio.toFixed(4)}
            </p>
            <p className={`text-sm mt-1 ${results.totalRatio < 1 ? "text-green-500" : "text-red-500"}`}>
              {results.totalRatio < 1 ? "✓ Within MPE limits" : "✗ EXCEEDS MPE — protection required"}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <ChartPanel data={chartData} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "Wavelength", gridcolor: "#374151" },
              yaxis: { title: "Hazard Ratio (H/MPE)", gridcolor: "#374151" },
              margin: { t: 30, r: 30, b: 50, l: 70 },
              shapes: [{ type: "line", x0: -0.5, x1: results.wls.length - 0.5, y0: 1, y1: 1, line: { color: "#f87171", width: 2, dash: "dash" } }],
            }} />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Per-Wavelength Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead><tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">λ (nm)</th><th className="text-left py-2">Power (mW)</th>
                  <th className="text-left py-2">MPE (J/cm²)</th><th className="text-left py-2">Hazard Ratio</th>
                </tr></thead>
                <tbody>
                  {results.wls.map((wl, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="py-2">{wl}</td><td className="py-2">{results.pws[i]}</td>
                      <td className="py-2">{results.mpes[i].toFixed(4)}</td>
                      <td className={`py-2 ${results.ratios[i] > 1 ? "text-red-400" : "text-blue-400"}`}>{results.ratios[i].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>Hᵢ / MPEᵢ = Eᵢ / MPEᵢ (hazard ratio per wavelength)</p>
          <p>Σ (Hᵢ / MPEᵢ) &lt; 1 → SAFE (all wavelengths additive)</p>
          <p>Σ (Hᵢ / MPEᵢ) ≥ 1 → EXCEEDS MPE</p>
          <p>Multiple wavelength rule: ANSI Z136.1 §8 — spectral additivity</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
