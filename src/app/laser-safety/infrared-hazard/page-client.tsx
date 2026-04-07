"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function InfraredHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 10600);
  const [power, setPower] = useURLState("power", 50);
  const [beamDia, setBeamDia] = useURLState("beamDia", 5);
  const [exposure, setExposure] = useURLState("exposure", 10);

  const area = Math.PI * Math.pow(beamDia / 2, 2);
  const irradiance = power / area;

  // Simplified IR MPE limits
  const cornealMPE = useMemo(() => {
    const lam = wavelength;
    if (lam >= 780 && lam < 1400) {
      // Retinal hazard region
      const alphaMin = 1.5; // mrad
      return 1.8 * Math.pow(exposure, 0.75) / Math.pow(alphaMin, 2) * 0.01; // W/cm² simplified
    } else if (lam >= 1400 && lam < 2600) {
      return 0.1 / Math.sqrt(exposure); // W/cm²
    } else if (lam >= 2600 && lam <= 106000) {
      return 0.01 / Math.sqrt(exposure); // W/cm² (CO2 region)
    }
    return 0.01;
  }, [wavelength, exposure]);

  const hazardRatio = irradiance / cornealMPE;

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 780 + i * 500);
    const mpeVals = wls.map(wl => {
      if (wl >= 780 && wl < 1400) return 1.8 * Math.pow(exposure, 0.75) * 0.01;
      if (wl >= 1400 && wl < 2600) return 0.1 / Math.sqrt(exposure);
      if (wl >= 2600 && wl <= 106000) return 0.01 / Math.sqrt(exposure);
      return 0.01;
    });
    return [
      { x: wls, y: mpeVals, type: "scatter" as const, mode: "lines" as const, name: "Corneal MPE", line: { color: "#f97316" } },
      { x: [wavelength], y: [irradiance], type: "scatter" as const, mode: "markers" as const, name: "Actual", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, exposure, irradiance]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Infrared Hazard Calculator" description="Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={780} max={106000} />
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} min={0.001} step="any" />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} min={0.1} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposure} onChange={setExposure} min={1e-9} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Irradiance</p>
          <p className="text-2xl font-bold text-blue-400">{irradiance.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Corneal MPE</p>
          <p className="text-2xl font-bold text-orange-400">{cornealMPE.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hazard Ratio</p>
          <p className={`text-2xl font-bold ${hazardRatio > 1 ? "text-red-400" : "text-green-400"}`}>{hazardRatio.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Region</p>
          <p className="text-2xl font-bold text-yellow-400">{wavelength < 1400 ? "IR-A" : wavelength < 3000 ? "IR-B" : "IR-C"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
