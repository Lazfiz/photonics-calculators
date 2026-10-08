"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { actinicUvWeight, uvExposureFraction, uvHazard, UV_LIMIT_PERIOD } from "../../../physics/laser-safety/hazard-weighting";

const fmtTime = (t: number) =>
  t === Infinity || t > UV_LIMIT_PERIOD ? "> 8 hr" : t >= 3600 ? (t / 3600).toFixed(1) + " hr" : t >= 10 ? t.toFixed(0) + " s" : t.toPrecision(2) + " s";

export default function UVHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 254);
  // Irradiance at the eye, W/cm² (the URL key predates the label).
  const [spectralIrr, setSpectralIrr] = useURLState("spectralIrr", 0.01);
  const [exposure, setExposure] = useState(8 * 3600);

  // S(λ) and the limits: src/physics/laser-safety/hazard-weighting.ts (ICNIRP 2004 Table 1). SI inside.
  const h = uvHazard(wavelength * 1e-9, spectralIrr * 1e4);
  const weight = h.S;
  const effectiveIrr = h.E_eff / 1e4; // W/cm²
  const maxExposureTime = h.tMax;
  const hazardRatio = uvExposureFraction(wavelength * 1e-9, spectralIrr * 1e4, exposure);
  const governing = h.tMax === Infinity ? "" : h.tUva < h.tActinic ? "UVA eye limit, 1 J/cm² unweighted" : "Actinic limit, 3 mJ/cm² S(λ)-weighted";

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 221 }, (_, i) => 180 + i);
    return [
      { x: wls, y: wls.map(w => actinicUvWeight(w * 1e-9)), type: "scatter" as const, mode: "lines" as const, name: "S(λ)", line: { color: "#c084fc" } },
      ...(weight > 0 ? [{ x: [wavelength], y: [weight], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#f87171", size: 10 } }] : []),
    ];
  }, [wavelength, weight]);

  return (
    <>
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={400} />
        <ValidatedNumberInput label="Irradiance (W/cm²)" value={spectralIrr} onChange={setSpectralIrr} min={0} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposure} onChange={setExposure} min={1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">S(λ) Weight</p>
          <p className="text-2xl font-bold text-purple-400">{weight !== 0 && weight < 0.01 ? weight.toExponential(2) : weight.toPrecision(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Irradiance</p>
          <p className="text-2xl font-bold text-blue-400">{effectiveIrr.toExponential(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Safe Time</p>
          <p className="text-2xl font-bold text-green-400">{fmtTime(maxExposureTime)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hazard Ratio</p>
          <p className={`text-2xl font-bold ${hazardRatio > 1 ? "text-red-400" : "text-green-400"}`}>{hazardRatio.toFixed(3)}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-8">
        Limits for the eye within 8 h (ICNIRP 2004): S(λ)-weighted exposure ≤ 3 mJ/cm², and unweighted 315–400 nm
        exposure ≤ 1 J/cm². For a single wavelength, effective irradiance = irradiance × S(λ).
        {governing && <> Limited by: {governing}.</>}
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "S(λ) Weight", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
