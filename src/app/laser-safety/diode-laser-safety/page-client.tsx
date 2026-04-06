"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function DiodeLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 500); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 808); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 1); // mm (fast axis)
  const [divergenceH, setDivergenceH] = useURLState("divergenceH", 10); // mrad slow axis
  const [divergenceV, setDivergenceV] = useURLState("divergenceV", 30); // mrad fast axis
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 0.25); // s (aversion)

  // MPE simplified for retinal hazard region (400-1400 nm)
  const mpe = useMemo(() => {
    if (wavelength < 400 || wavelength > 1400) return 0.01; // W/cm² fallback
    // IEC 60825-1 simplified: MPE ≈ 1.8 t^0.75 × 10^(-3) mJ/cm² per pulse
    // For CW: MPE (W/cm²) ≈ 1.8 / (sqrt(t) × 1000) simplified
    const t = Math.max(exposureTime, 0.001);
    return 1.8 / (Math.pow(t, 0.75) * 1000); // W/cm² approximate
  }, [wavelength, exposureTime]);

  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const powerDensity = (power / 1000) / beamAreaCm2; // W/cm²
  const safetyFactor = mpe > 0 ? powerDensity / mpe : Infinity;

  const nohdH = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergenceH / 1000;
    const factor = 1.27 * (power / 1000) / (mpe * 1e4 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergenceH, mpe]);

  const nohdV = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergenceV / 1000;
    const factor = 1.27 * (power / 1000) / (mpe * 1e4 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergenceV, mpe]);

  const odRequired = safetyFactor > 1 ? Math.ceil(Math.log10(safetyFactor)) : 0;

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i * Math.max(nohdH, nohdV, 100) * 1.2 / 100);
    const irradianceH = distances.map(z => {
      const a = (beamDia / 2) / 1000;
      const phi = divergenceH / 1000;
      const w = a + z * phi;
      return (power / 1000) / (Math.PI * w * w) * 1e4; // W/cm²
    });
    const irradianceV = distances.map(z => {
      const a = (beamDia / 2) / 1000;
      const phi = divergenceV / 1000;
      const w = a + z * phi;
      return (power / 1000) / (Math.PI * w * w) * 1e4;
    });
    return [
      { x: distances, y: irradianceH, type: "scatter" as const, mode: "lines" as const, name: "Slow axis", line: { color: "#60a5fa" } },
      { x: distances, y: irradianceV, type: "scatter" as const, mode: "lines" as const, name: "Fast axis", line: { color: "#a78bfa" } },
      { x: [0, Math.max(...distances)], y: [mpe, mpe], type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [power, beamDia, divergenceH, divergenceV, mpe, nohdH, nohdV]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Diode Laser Safety Calculator" description="Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} step="0.1" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} step="0.01" />
        <ValidatedNumberInput label="Slow Axis Divergence (mrad)" value={divergenceH} onChange={setDivergenceH} />
        <ValidatedNumberInput label="Fast Axis Divergence (mrad)" value={divergenceV} onChange={setDivergenceV} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">MPE</p>
          <p className="text-2xl font-bold text-blue-400">{mpe.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-2xl font-bold text-red-400">{powerDensity.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD (slow/fast)</p>
          <p className="text-2xl font-bold text-orange-400">{nohdH.toFixed(0)} / {nohdV.toFixed(0)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Min OD Required</p>
          <p className="text-2xl font-bold text-yellow-400">OD{odRequired}+</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>MPE ≈ 1.8 × t<sup>−0.75</sup> × 10<sup>−3</sup> W/cm² (400–1400 nm, CW)</p>
          <p>E = P / (π r²)</p>
          <p>OD<sub>min</sub> = ⌈log₁₀(E / MPE)⌉</p>
          <p>NOHD = (1/φ)(√(1.27P/(MPE·a²)) − 1)</p>
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
