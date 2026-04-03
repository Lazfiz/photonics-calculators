"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function SkinHazardPage() {
  const [wavelength, setWavelength] = useState(1064);
  const [power, setPower] = useState(1000); // mW
  const [beamDiameter, setBeamDiameter] = useState(5); // mm
  const [exposureTime, setExposureTime] = useState(10); // s

  // Skin MPE per ANSI Z136.1 (simplified)
  // 400-700nm: same as corneal MPE for most cases
  // 700-1400nm: 0.2 W/cm² for t>10s (simplified)
  // 1400-1500nm: 0.1 J/cm² per pulse
  // UV (180-400nm): 3 mJ/cm² for t<10s at 270nm peak, with spectral weighting
  const skinMPE = useMemo(() => {
    const lam = wavelength / 1000;
    const t = exposureTime;

    if (lam >= 0.18 && lam < 0.30) {
      // UV-B/C: very low MPE, ~3 mJ/cm²
      return 3 * Math.pow(t, 0.75) / 1000; // W/cm²
    } else if (lam >= 0.30 && lam < 0.40) {
      // UV-A: higher but still low
      return 1.0 * Math.pow(t, 0.75) / 1000;
    } else if (lam >= 0.40 && lam < 0.70) {
      // Visible: skin MPE ~1.8*t^0.75 mJ/cm² => W/cm²
      return 1.8e-3 * Math.pow(t, -0.25);
    } else if (lam >= 0.70 && lam < 1.4) {
      // IR-A: skin MPE ~0.2 W/cm² for long exposure
      return t > 10 ? 0.2 : 1.8e-3 * Math.pow(t, -0.25);
    } else if (lam >= 1.4 && lam < 1.8) {
      // IR-B: 0.1 J/cm²
      return t < 10 ? 0.1 / t : 0.01;
    }
    return 0.01;
  }, [wavelength, exposureTime]);

  const beamArea = useMemo(() => Math.PI * Math.pow(beamDiameter / 20, 2), [beamDiameter]); // cm²
  const beamIrradiance = useMemo(() => power / 1000 / beamArea, [power, beamArea]);
  const hazardRatio = useMemo(() => beamIrradiance / skinMPE, [beamIrradiance, skinMPE]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 180 + i * 8.5);
    const t = exposureTime;
    const mpeVals = wls.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.18 && lam < 0.30) return 3 * Math.pow(t, 0.75) / 1000;
      if (lam >= 0.30 && lam < 0.40) return 1.0 * Math.pow(t, 0.75) / 1000;
      if (lam >= 0.40 && lam < 0.70) return 1.8e-3 * Math.pow(t, -0.25);
      if (lam >= 0.70 && lam < 1.4) return t > 10 ? 0.2 : 1.8e-3 * Math.pow(t, -0.25);
      if (lam >= 1.4 && lam < 1.8) return t < 10 ? 0.1 / t : 0.01;
      return 0.01;
    });
    return [
      {
        x: wls, y: mpeVals, type: "scatter" as const, mode: "lines" as const,
        name: "Skin MPE", line: { color: "#60a5fa" }
      },
      {
        x: wls, y: wls.map(() => beamIrradiance), type: "scatter" as const, mode: "lines" as const,
        name: "Beam Irradiance", line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [exposureTime, beamIrradiance]);

  const riskLevel = hazardRatio > 100 ? "EXTREME" : hazardRatio > 10 ? "HIGH" : hazardRatio > 1 ? "MODERATE" : "LOW";
  const riskColor = hazardRatio > 100 ? "text-red-500" : hazardRatio > 10 ? "text-orange-400" : hazardRatio > 1 ? "text-yellow-400" : "text-green-400";

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Skin Hazard Assessment" description="Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={1800}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.001} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Beam Diameter (mm)</span>
          <input type="number" value={beamDiameter} onChange={e => setBeamDiameter(+e.target.value)} min={0.01} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min={1e-9} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Skin MPE</p>
          <p className="text-2xl font-bold text-blue-400">{skinMPE.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-2xl font-bold text-yellow-400">{beamIrradiance.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hazard Ratio</p>
          <p className={`text-2xl font-bold ${riskColor}`}>{hazardRatio.toFixed(1)}× ({riskLevel})</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
