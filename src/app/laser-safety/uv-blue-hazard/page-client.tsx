"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";


export default function UVBlueHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 450);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10000);
  const [spectralPower, setSpectralPower] = useURLState("spectralPower", 1); // mW/nm

  // Blue light hazard function B(λ) and UV hazard function S(λ)
  // Weighted radiance: L_B = ∫ L(λ) × B(λ) dλ
  // Blue light hazard limit: L_B ≤ 100 W·m⁻²·sr⁻¹ (for t > 10,000s)
  // UV hazard: H_UV = ∫ E(λ) × S(λ) dλ ≤ 30 J/m² (for 8h)
  //
  // B(λ) peaks at ~435-440 nm
  // S(λ) peaks at ~270 nm (germicidal)

  // Simplified blue light hazard action spectrum (ICNIRP/CIE)
  const blueLightHazard = (wl: number) => {
    // Approximate B(λ) curve
    const peaks = [
      { center: 435, width: 20, strength: 1.0 },
      { center: 445, width: 25, strength: 0.95 },
      { center: 460, width: 30, strength: 0.6 },
      { center: 415, width: 15, strength: 0.7 },
      { center: 480, width: 35, strength: 0.3 },
      { center: 500, width: 40, strength: 0.05 },
    ];
    let b = 0;
    for (const p of peaks) {
      b += p.strength * Math.exp(-((wl - p.center) ** 2) / (2 * p.width ** 2));
    }
    return b;
  };

  // UV hazard action spectrum S(λ) (approximate)
  const uvHazard = (wl: number) => {
    if (wl < 200 || wl > 400) return 0;
    const peaks = [
      { center: 270, width: 15, strength: 1.0 },
      { center: 295, width: 12, strength: 0.85 },
      { center: 310, width: 10, strength: 0.5 },
      { center: 330, width: 15, strength: 0.2 },
      { center: 365, width: 20, strength: 0.01 },
    ];
    let s = 0;
    for (const p of peaks) {
      s += p.strength * Math.exp(-((wl - p.center) ** 2) / (2 * p.width ** 2));
    }
    return s;
  };

  const results = useMemo(() => {
    const B = blueLightHazard(wavelength);
    const S = uvHazard(wavelength);
    const t = exposureTime;

    // Blue light weighted irradiance
    const blueWeightedPower = spectralPower * B; // mW/nm (weighted)
    const blueLimit = t > 10000 ? 100 : 100 * Math.pow(10000 / t, 0.25); // W/m²/sr simplified

    // UV weighted exposure
    const uvWeightedExposure = spectralPower * S * t / 1000; // mJ/m² (per nm)
    const uvLimit = 30; // J/m² for 8h occupational

    const isBlueHazardous = B > 0.1;
    const isUVHazardous = S > 0.01;

    return {
      B: B.toFixed(4),
      S: S.toFixed(4),
      blueWeightedPower,
      blueLimit,
      uvWeightedExposure,
      uvLimit,
      isBlueHazardous,
      isUVHazardous,
      hazardType: isBlueHazardous && isUVHazardous ? "UV + Blue Light" :
                  isBlueHazardous ? "Blue Light" :
                  isUVHazardous ? "UV" : "None (IR/Visible safe)",
    };
  }, [wavelength, exposureTime, spectralPower]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 200 + i);
    const blueVals = wls.map(w => blueLightHazard(w));
    const uvVals = wls.map(w => uvHazard(w));

    return [
      { x: wls, y: blueVals, type: "scatter" as const, mode: "lines" as const, name: "B(λ) Blue Light Hazard", line: { color: "#60a5fa" } },
      { x: wls, y: uvVals, type: "scatter" as const, mode: "lines" as const, name: "S(λ) UV Hazard", line: { color: "#a78bfa" } },
    ];
  }, []);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937", color: "#9ca3af", range: [200, 600] },
    yaxis: { title: "Hazard Weighting Function", gridcolor: "#1f2937", color: "#9ca3af" },
    margin: { t: 30, b: 50, l: 70, r: 20 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="UV / Blue Light Hazard" description="Calculates weighted hazard using the blue light B(λ) and UV S(λ) action spectra per IEC 62471 / ICNIRP guidelines.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Spectral Power (mW/nm)</label>
          <input type="number" step="0.1" value={spectralPower} onChange={e => setSpectralPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">B(λ)</div>
          <div className="text-2xl font-bold text-blue-400">{results.B}</div>
          <div className="text-xs text-gray-500">blue hazard</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">S(λ)</div>
          <div className="text-2xl font-bold text-purple-400">{results.S}</div>
          <div className="text-xs text-gray-500">UV hazard</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Blue Weighted</div>
          <div className="text-2xl font-bold text-cyan-400">{results.blueWeightedPower.toFixed(3)}</div>
          <div className="text-xs text-gray-500">mW/nm</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">UV Weighted</div>
          <div className="text-2xl font-bold text-violet-400">{results.uvWeightedExposure.toFixed(3)}</div>
          <div className="text-xs text-gray-500">mJ/m²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Hazard Type</div>
          <div className={`text-lg font-bold ${results.hazardType !== "None (IR/Visible safe)" ? "text-red-400" : "text-green-400"}`}>{results.hazardType}</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>L<sub>B</sub> = ∫ L(λ) × B(λ) dλ ≤ 100 W·m⁻²·sr⁻¹ (t &gt; 10,000s)</p>
        <p>H<sub>UV</sub> = ∫ E(λ) × S(λ) dλ ≤ 30 J/m² (8h exposure)</p>
        <p>B(λ) peak ≈ 435-440 nm | S(λ) peak ≈ 270 nm</p>
        <p className="text-yellow-400 mt-2">⚠ Chronic blue light exposure linked to retinal damage; UV causes photokeratitis</p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
