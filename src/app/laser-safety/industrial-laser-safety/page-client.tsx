"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function IndustrialLaserSafetyPage() {
  const [power, setPower] = useState(4000); // W
  const [wavelength, setWavelength] = useState(1070); // nm fiber laser
  const [beamDia, setBeamDia] = useState(5); // mm at exit
  const [divergence, setDivergence] = useState(2); // mrad
  const [materialReflectivity, setMaterialReflectivity] = useState(30); // %
  const [workingDistance, setWorkingDistance] = useState(0.3); // m
  const [exposureTime, setExposureTime] = useState(10); // s (accidental)

  const reflectedPower = power * materialReflectivity / 100;
  const mpeWcm2 = wavelength <= 1400 ? 0.1 / Math.sqrt(exposureTime) : 0.1;
  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const directIrradiance = power / beamAreaCm2;
  const reflectedIrradiance = reflectedPower / beamAreaCm2;

  // NOHD for direct beam
  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergence / 1000;
    const mpeWm2 = mpeWcm2 * 1e4;
    const factor = 1.27 * power / (mpeWm2 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergence, mpeWcm2]);

  // NOHD for reflected beam (diffuse, Lambertian)
  const nohdDiffuse = useMemo(() => {
    const mpeWm2 = mpeWcm2 * 1e4;
    // E_diffuse = P_reflected * cos(θ) / (π r²)
    // At normal incidence: E = P_refl / (π r²)
    // r = sqrt(P_refl / (π * MPE))
    return Math.sqrt(reflectedPower / (Math.PI * mpeWm2));
  }, [reflectedPower, mpeWcm2]);

  // Beam at working distance
  const beamDiaWork = beamDia + workingDistance * 1000 * divergence / 1000; // mm
  const irradianceWork = power / (Math.PI * Math.pow(beamDiaWork / 20, 2));

  // OD for operators
  const odDirect = Math.ceil(Math.log10(directIrradiance / mpeWcm2));
  const odReflected = Math.ceil(Math.log10(reflectedIrradiance / mpeWcm2));

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i * Math.max(nohd, 50) * 1.3 / 100);
    const direct = distances.map(z => {
      const bd = beamDia + z * divergence;
      return power / (Math.PI * Math.pow(bd / 20, 2));
    });
    const diffuse = distances.map(z => z > 0 ? reflectedPower / (Math.PI * z * z) * 1e-4 : direct[0]);
    return [
      { x: distances, y: direct, type: "scatter" as const, mode: "lines" as const, name: "Direct beam", line: { color: "#f87171" } },
      { x: distances, y: diffuse, type: "scatter" as const, mode: "lines" as const, name: "Diffuse reflection", line: { color: "#fbbf24" } },
      { x: [0, Math.max(...distances)], y: [mpeWcm2, mpeWcm2], type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [power, beamDia, divergence, reflectedPower, mpeWcm2, nohd]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Industrial Laser Safety Calculator" description="Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} />
        <ValidatedNumberInput label="Divergence (mrad)" value={divergence} onChange={setDivergence} step="0.1" />
        <ValidatedNumberInput label="Material Reflectivity (%)" value={materialReflectivity} onChange={setMaterialReflectivity} />
        <ValidatedNumberInput label="Working Distance (m)" value={workingDistance} onChange={setWorkingDistance} step="0.1" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD (direct)</p>
          <p className="text-2xl font-bold text-red-400">{nohd.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD (diffuse)</p>
          <p className="text-2xl font-bold text-yellow-400">{nohdDiffuse.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Reflected Power</p>
          <p className="text-2xl font-bold text-orange-400">{reflectedPower.toFixed(0)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Direct Irradiance</p>
          <p className="text-2xl font-bold text-red-300">{directIrradiance.toFixed(0)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">OD (direct)</p>
          <p className="text-2xl font-bold text-purple-400">OD{odDirect}+</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">OD (reflected)</p>
          <p className="text-2xl font-bold text-blue-400">OD{odReflected}+</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>P<sub>refl</sub> = P × R (R = material reflectivity)</p>
          <p>E<sub>direct</sub>(z) = P / (π(d₀ + zφ)²/4)</p>
          <p>E<sub>diffuse</sub>(r) = P<sub>refl</sub> / (π r²) (Lambertian)</p>
          <p>NOHD<sub>direct</sub> = (1/φ)(√(1.27P/(MPE·a²)) − 1)</p>
          <p>NOHD<sub>diffuse</sub> = √(P<sub>refl</sub> / (π · MPE))</p>
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
