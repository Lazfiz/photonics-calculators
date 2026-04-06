"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function MedicalLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 10000); // mW (10W)
  const [wavelength, setWavelength] = useURLState("wavelength", 10600); // nm CO2
  const [spotSize, setSpotSize] = useURLState("spotSize", 0.2); // mm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 0.1); // s
  const [beamDia, setBeamDia] = useURLState("beamDia", 1); // mm (delivery fiber/handpiece)
  const [treatmentArea, setTreatmentArea] = useURLState("treatmentArea", 1); // cm²

  // MPE based on wavelength region (ANSI Z136.1 simplified)
  // Retinal hazard (400-1400nm): mW/cm² scale; Corneal hazard (>1400nm): W/cm² scale
  const mpe = useMemo(() => {
    if (wavelength < 400) return 0.003; // UV, W/cm² (corneal)
    if (wavelength <= 700) return 1.8e-3 * Math.pow(exposureTime, -0.25); // visible retinal, W/cm²
    if (wavelength <= 1400) return 1e-3; // IR-A retinal, W/cm² (long exposure, C_A≈1 at 700nm)
    if (wavelength <= 3000) return 0.56 * Math.pow(exposureTime, -0.25); // IR-B corneal
    return 0.1 * Math.pow(exposureTime, -0.25); // IR-C (CO2) corneal
  }, [wavelength, exposureTime]);

  const spotAreaCm2 = Math.PI * Math.pow(spotSize / 20, 2);
  const powerDensity = (power / 1000) / spotAreaCm2; // W/cm²
  const fluence = powerDensity * exposureTime; // J/cm²
  const safetyRatio = mpe > 0 ? powerDensity / mpe : Infinity;
  const odRequired = safetyRatio > 1 ? Math.ceil(Math.log10(safetyRatio)) : 0;

  // Thermal relaxation time
  const thermalRelaxTime = Math.pow(spotSize / 1000, 2) / (16 * 1.3e-3); // s (skin, α ≈ 1.3e-3 cm²/s)

  // Treatment power density
  const treatmentPowerDensity = treatmentArea > 0 ? (power / 1000) / treatmentArea : 0;

  // Laser type
  const laserType = useMemo(() => {
    if (wavelength === 10600) return "CO₂ Surgical";
    if (wavelength === 1064) return "Nd:YAG";
    if (wavelength === 532) return "KTP (frequency-doubled Nd:YAG)";
    if (wavelength === 810) return "Diode";
    if (wavelength === 694) return "Ruby";
    if (wavelength === 755) return "Alexandrite";
    if (wavelength === 1550) return "Er:Glass";
    if (wavelength === 2940) return "Er:YAG";
    if (wavelength === 1320 || wavelength === 1440) return "Nd:YAG (1.3–1.4 µm)";
    return "Other";
  }, [wavelength]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 80 }, (_, i) => 0.001 + i * 0.5); // 1ms to 40s
    const fluences = times.map(t => powerDensity * t);
    const mpeFluences = times.map(t => {
      if (wavelength <= 700) return 1.8e-3 * Math.pow(t, 0.75);
      if (wavelength <= 1400) return 1e-3 * t;
      return 0.56 * Math.pow(t, 0.75);
    });
    return [
      { x: times.map(t => t * 1000), y: fluences, type: "scatter" as const, mode: "lines" as const, name: "Your fluence", line: { color: "#60a5fa" } },
      { x: times.map(t => t * 1000), y: mpeFluences, type: "scatter" as const, mode: "lines" as const, name: "MPE fluence", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [powerDensity, wavelength]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Medical Laser Safety Calculator" description="Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Spot Size (mm)" value={spotSize} onChange={setSpotSize} step="0.1" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} step="0.01" />
        <ValidatedNumberInput label="Delivery Ø (mm)" value={beamDia} onChange={setBeamDia} step="0.1" />
        <ValidatedNumberInput label="Treatment Area (cm²)" value={treatmentArea} onChange={setTreatmentArea} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Laser Type</p>
          <p className="text-2xl font-bold text-blue-400">{laserType}</p>
          <p className="text-xs text-gray-500 mt-1">{wavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Peak Irradiance</p>
          <p className="text-2xl font-bold text-red-400">{powerDensity.toFixed(0)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Fluence</p>
          <p className="text-2xl font-bold text-yellow-400">{fluence.toFixed(1)} J/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Thermal Relaxation Time</p>
          <p className="text-2xl font-bold text-orange-400">{(thermalRelaxTime * 1000).toFixed(1)} ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">MPE (this config)</p>
          <p className="text-2xl font-bold text-green-400">{mpe.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Min OD (spectators)</p>
          <p className="text-2xl font-bold text-purple-400">OD{odRequired}+</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>E = P / A<sub>spot</sub></p>
          <p>F = E × t (fluence)</p>
          <p>τ<sub>tr</sub> = d² / (16α) where α ≈ 1.3 × 10<sup>−3</sup> cm²/s (skin)</p>
          <p>MPE<sub>IR-C</sub> = 0.1 × t<sup>−0.25</sup> W/cm² (corneal, 1mm aperture)</p>
          <p>MPE<sub>vis</sub> = 1.8×10⁻³ × t<sup>−0.25</sup> W/cm² (retinal, ANSI Z136.1)</p>
          <p>MPE<sub>IR-A</sub> ≈ 1×10⁻³ W/cm² (long exposure)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Exposure Time (ms)", gridcolor: "#374151" },
          yaxis: { title: "Fluence (J/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
