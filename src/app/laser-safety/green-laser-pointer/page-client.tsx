"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function GreenLaserPointerPage() {
  const [power, setPower] = useState(5); // mW
  const [wavelength, setWavelength] = useState(532); // nm
  const [beamDia, setBeamDia] = useState(1.5); // mm
  const [divergence, setDivergence] = useState(1.2); // mrad
  const [distance, setDistance] = useState(10); // m

  // MPE for 532nm, 0.25s exposure (aversion response)
  const mpeWcm2 = 2.5; // W/cm² for visible CW, 0.25s (IEC simplified)
  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const powerDensity0 = (power / 1000) / beamAreaCm2; // W/cm² at aperture

  // Beam at distance
  const beamDiaAtDist = beamDia + distance * divergence; // mm
  const beamAreaAtDist = Math.PI * Math.pow(beamDiaAtDist / 20, 2); // cm²
  const powerDensityAtDist = (power / 1000) / beamAreaAtDist;

  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergence / 1000;
    const factor = 1.27 * (power / 1000) / (mpeWcm2 * 1e4 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergence, mpeWcm2]);

  // Visual interference distance (10× MPE for flashblindness)
  const flashBlindDist = nohd * Math.sqrt(10);
  // Retinal spot size for 532nm
  const retinalSpot = 10; // µm minimum (diffraction limited)
  const retinalIrradiance = (power / 1000) / (Math.PI * Math.pow(retinalSpot / 10000 / 2, 2)); // W/cm² on retina

  // Classification
  const classification = useMemo(() => {
    if (power <= 0.4) return { class: "1", color: "text-green-400", desc: "Safe under all conditions" };
    if (power <= 1) return { class: "1M", color: "text-green-400", desc: "Safe unless viewed with optics" };
    if (power <= 5) return { class: "2", color: "text-yellow-400", desc: "Safe with aversion response" };
    if (power <= 50) return { class: "2M", color: "text-yellow-400", desc: "Safe with aversion, unless optics" };
    if (power <= 500) return { class: "3R", color: "text-orange-400", desc: "Hazard with optics" };
    return { class: "3B/4", color: "text-red-400", desc: "Hazardous — eye/skin damage" };
  }, [power]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i * Math.max(nohd, 50) * 1.5 / 100);
    const irradiances = distances.map(z => {
      const bd = beamDia + z * divergence;
      return (power / 1000) / (Math.PI * Math.pow(bd / 20, 2));
    });
    return [
      { x: distances, y: irradiances, type: "scatter" as const, mode: "lines" as const, name: "Irradiance", line: { color: "#4ade80" } },
      { x: [0, Math.max(...distances)], y: [mpeWcm2, mpeWcm2], type: "scatter" as const, mode: "lines" as const, name: "MPE (aversion)", line: { color: "#f87171", dash: "dash" } },
      { x: [0, Math.max(...distances)], y: [mpeWcm2 / 10, mpeWcm2 / 10], type: "scatter" as const, mode: "lines" as const, name: "Flashblindness", line: { color: "#fbbf24", dash: "dot" } },
    ];
  }, [power, beamDia, divergence, mpeWcm2, nohd]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Green Laser Pointer Safety" description="Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} step="0.5" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} step="0.1" />
        <ValidatedNumberInput label="Divergence (mrad)" value={divergence} onChange={setDivergence} step="0.1" />
        <ValidatedNumberInput label="Viewing Distance (m)" value={distance} onChange={setDistance} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">IEC Classification</p>
          <p className={`text-2xl font-bold ${classification.color}`}>Class {classification.class}</p>
          <p className="text-xs text-gray-500 mt-1">{classification.desc}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD</p>
          <p className="text-2xl font-bold text-red-400">{nohd.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Flashblindness Dist.</p>
          <p className="text-2xl font-bold text-yellow-400">{flashBlindDist.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Irradiance at {distance}m</p>
          <p className="text-2xl font-bold text-blue-400">{powerDensityAtDist.toFixed(3)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Beam Ø at {distance}m</p>
          <p className="text-2xl font-bold text-purple-400">{beamDiaAtDist.toFixed(1)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Retinal Irradiance (worst)</p>
          <p className="text-2xl font-bold text-red-300">{retinalIrradiance.toFixed(0)} W/cm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>MPE<sub>vis</sub> = 2.5 W/cm² (CW, 0.25s, 400–700 nm)</p>
          <p>d(z) = d₀ + z × φ</p>
          <p>E(z) = P / (π(d(z)/2)²)</p>
          <p>NOHD = (1/φ)(√(1.27P/(MPE·a²)) − 1)</p>
          <p>Retinal image ~10 µm (diffraction-limited for λ=532 nm)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
