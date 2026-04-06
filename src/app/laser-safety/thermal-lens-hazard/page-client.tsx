"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function ThermalLensHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 808);
  const [power, setPower] = useURLState("power", 2000); // mW
  const [beamDiameter, setBeamDiameter] = useURLState("beamDiameter", 5); // mm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1); // s

  // Thermal lensing hazard: when a lens (eyewear, optics) absorbs laser energy
  // Temperature rise: ΔT = (α * I * t) / (ρ * Cp * d)
  // where α = absorption coefficient, I = irradiance, t = time, d = thickness
  // Thermal stress: σ = E * α_th * ΔT / (1 - ν)
  // Lens damage occurs when ΔT > threshold or σ > fracture stress

  const [absorption, setAbsorption] = useURLState("absorption", 0.001); // 0.1% absorption
  const [thickness, setThickness] = useURLState("thickness", 3); // mm

  const beamArea = useMemo(() => Math.PI * Math.pow(beamDiameter / 20, 2), [beamDiameter]); // cm²
  const irradiance = useMemo(() => power / 1000 / beamArea, [power, beamArea]); // W/cm²
  const absorbedPower = useMemo(() => irradiance * absorption * beamArea, [irradiance, absorption, beamArea]); // W
  const tempRise = useMemo(() => {
    // Simplified: ΔT = P_absorbed * t / (m * Cp)
    // Assume polycarbonate lens: ρ = 1.2 g/cm³, Cp = 1.2 J/(g·K)
    const lensArea = Math.PI * Math.pow(1, 2); // 1cm radius lens
    const volume = lensArea * thickness / 10; // cm³
    const mass = 1.2 * volume; // g
    return (absorbedPower * exposureTime) / (mass * 1.2);
  }, [absorbedPower, exposureTime, thickness]);

  // Material properties for common lens materials
  const materials = {
    polycarbonate: { density: 1.2, cp: 1.2, maxTemp: 135, youngs: 2.4, poisson: 0.37, alphaTh: 65e-6 },
    glass: { density: 2.5, cp: 0.84, maxTemp: 550, youngs: 70, poisson: 0.22, alphaTh: 9e-6 },
    "PMMA": { density: 1.18, cp: 1.5, maxTemp: 105, youngs: 3.2, poisson: 0.37, alphaTh: 70e-6 },
  };

  const [material, setMaterial] = useState<keyof typeof materials>("polycarbonate");
  const mat = materials[material];

  const thermalStress = useMemo(() => {
    // σ = E * α_th * ΔT / (1 - ν) (in MPa when E in GPa)
    return (mat.youngs * mat.alphaTh * tempRise) / (1 - mat.poisson) * 1000; // MPa
  }, [mat, tempRise]);

  const chartData = useMemo(() => {
    const powers = Array.from({ length: 100 }, (_, i) => (i + 1) * 100);
    return [
      {
        x: powers, y: powers.map(p => {
          const ir = p / 1000 / beamArea;
          const pAbs = ir * absorption * beamArea;
          return (pAbs * exposureTime) / ((1.2 * Math.PI * Math.pow(1, 2) * thickness / 10) * 1.2);
        }),
        type: "scatter" as const, mode: "lines" as const, name: "Temperature Rise (°C)",
        line: { color: "#f87171" }
      },
      {
        x: powers, y: powers.map(() => mat.maxTemp - 25), // above ambient
        type: "scatter" as const, mode: "lines" as const, name: `Max ΔT (${material})`,
        line: { color: "#fbbf24", dash: "dash" }
      }
    ];
  }, [beamArea, absorption, thickness, exposureTime, mat.maxTemp, material]);

  const riskLevel = tempRise > (mat.maxTemp - 25) ? "DAMAGE RISK" : tempRise > (mat.maxTemp - 25) * 0.5 ? "CAUTION" : "SAFE";
  const riskColor = tempRise > (mat.maxTemp - 25) ? "text-red-500" : tempRise > (mat.maxTemp - 25) * 0.5 ? "text-yellow-400" : "text-green-400";

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Thermal Lens Hazard" description="Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1800} />
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0.001} step="any" />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.01} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Lens Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.keys(materials).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Absorption (fraction)" value={absorption} onChange={setAbsorption} min={1e-6} step="any" />
        <ValidatedNumberInput label="Lens Thickness (mm)" value={thickness} onChange={setThickness} min={0.1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-xl font-bold text-yellow-400">{irradiance.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorbed Power</p>
          <p className="text-xl font-bold text-orange-400">{absorbedPower.toFixed(4)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Temperature Rise</p>
          <p className={`text-xl font-bold ${riskColor}`}>{tempRise.toFixed(1)} °C</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Risk</p>
          <p className={`text-xl font-bold ${riskColor}`}>{riskLevel}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Laser Power (mW)", gridcolor: "#374151" },
          yaxis: { title: "Temperature Rise (°C)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
