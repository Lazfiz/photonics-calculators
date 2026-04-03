"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function EnclosureClassPage() {
  const [laserPower, setLaserPower] = useState(5000); // mW
  const [wavelength, setWavelength] = useState(1064); // nm
  const [apertureSize, setApertureSize] = useState(5); // mm (largest opening)
  const [exposureTime, setExposureTime] = useState(100); // s (inspection/maintenance)
  const [workingDistance, setWorkingDistance] = useState(30); // cm (to aperture)

  const results = useMemo(() => {
    const P = laserPower / 1000; // W
    const lam = wavelength / 1000; // µm
    const a = apertureSize / 10; // cm
    const t = exposureTime;
    const r = workingDistance; // cm

    // MPE for the wavelength and exposure time
    let mpe: number; // J/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpe = 1.8e-3 * Math.pow(Math.min(t, 10), 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpe = 1.8e-3 * CA * Math.pow(Math.min(t, 10), 0.75);
    } else if (lam >= 1.05 && lam < 1.4) {
      mpe = t > 10 ? 0.1 : 0.01 * t;
    } else if (lam >= 1.4 && lam <= 1.8) {
      mpe = 0.1;
    } else {
      mpe = 1e-3;
    }

    const mpeIrr = mpe / t; // W/cm²

    // Emission through aperture: treat as a point source
    // Irradiance at distance r: E = P / (4π r²) for isotropic
    // For directed beam through aperture: E ≈ P / (π (a/2 + r*div)²)
    // Simplified: use solid angle of aperture at distance r
    const solidAngle = Math.PI * a * a / (4 * r * r); // sr (approx)
    const powerThroughAperture = P * 0.01; // assume 1% leakage
    const irradianceAtDistance = powerThroughAperture / (Math.PI * (a / 2) ** 2); // W/cm² at aperture
    const irradianceAtR = irradianceAtDistance * (a / (2 * r)) ** 2; // spreading

    // Or simpler: E = P_leak / (π r²)
    const E_at_r = powerThroughAperture / (Math.PI * r * r); // W/cm²

    // Accessible Emission Limit (AEL) for Class 1
    // Class 1 AEL: emission ≤ MPE at closest point of human access
    const class1AEL = mpeIrr * Math.PI * 0.1 * 0.1; // W (7mm limiting aperture)

    // Determine enclosure class
    const emissionPower = powerThroughAperture;
    let enclosureClass: string;
    let description: string;

    if (emissionPower <= class1AEL) {
      enclosureClass = "Class 1 Enclosure";
      description = "Emission ≤ MPE. Safe under all conditions. No protective eyewear required.";
    } else if (emissionPower <= class1AEL * 10) {
      enclosureClass = "Enhanced Class 1";
      description = "Emission slightly above Class 1 AEL. Administrative controls recommended.";
    } else if (emissionPower <= 0.5) {
      enclosureClass = "Class 2 Enclosure";
      description = "Visible emission ≤ 1 mW. Aversion response provides protection.";
    } else if (emissionPower <= 500) {
      enclosureClass = "Class 3B Enclosure";
      description = "Significant emission. Protective eyewear and interlocks REQUIRED.";
    } else {
      enclosureClass = "Class 4 Enclosure";
      description = "High-power emission. Full safety controls: interlocks, eyewear, barriers, LSO required.";
    }

    // Required OD for inspection
    const ratio = E_at_r / mpeIrr;
    const requiredOD = Math.max(0, Math.log10(ratio));

    return {
      mpe: mpe * 1000, mpeIrr, E_at_r, class1AEL, emissionPower,
      enclosureClass, description, requiredOD, ratio,
      powerThroughAperture,
    };
  }, [laserPower, wavelength, apertureSize, exposureTime, workingDistance]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 200 }, (_, i) => 5 + i * 2);
    const irradiance = distances.map(r => results.powerThroughAperture / (Math.PI * r * r));
    const mpeLine = distances.map(() => results.mpeIrr);

    return [
      { x: distances, y: irradiance, type: "scatter" as const, mode: "lines" as const, name: "Irradiance at distance", line: { color: "#f87171", width: 2 } },
      { x: distances, y: mpeLine, type: "scatter" as const, mode: "lines" as const, name: "MPE Irradiance", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [results]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Enclosure Classification" description="Determines laser enclosure safety class based on emission through apertures, per IEC 60825-1 and ANSI Z136.1. Evaluates whether the enclosure provides Class 1 protection.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Laser Power (mW)</span>
          <input type="number" value={laserPower} onChange={e => setLaserPower(+e.target.value)} min={0.001} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={20000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Aperture Size (mm)</span>
          <input type="number" value={apertureSize} onChange={e => setApertureSize(+e.target.value)} min={0.1} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min={1e-9} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Working Distance (cm)</span>
          <input type="number" value={workingDistance} onChange={e => setWorkingDistance(+e.target.value)} min={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 ${results.enclosureClass.includes("Class 1") ? "border-green-700" : "border-red-700"}`}>
        <p className="text-sm text-gray-400">Enclosure Classification</p>
        <p className={`text-2xl font-bold ${results.enclosureClass.includes("Class 1") ? "text-green-400" : "text-red-400"}`}>{results.enclosureClass}</p>
        <p className="text-sm text-gray-400 mt-2">{results.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Leakage Power (est. 1%)</p>
          <p className="text-3xl font-bold text-amber-400">{(results.powerThroughAperture * 1000).toFixed(2)} mW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Irradiance at {workingDistance} cm</p>
          <p className="text-3xl font-bold text-blue-400">{results.E_at_r.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Required OD at {workingDistance} cm</p>
          <p className="text-3xl font-bold text-purple-400">OD {results.requiredOD.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (cm)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>E(r) = P<sub>leak</sub> / (π × r²) [W/cm²]</p>
          <p>Class 1 AEL: P ≤ MPE × π × (0.7)² [W]</p>
          <p>Classification: compare emission to AEL thresholds</p>
          <p>Required OD = log₁₀(E / E<sub>MPE</sub>)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
