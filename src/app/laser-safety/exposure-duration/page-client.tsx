"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function ExposureDurationPage() {
  const [wavelength, setWavelength] = useState(532);
  const [power, setPower] = useState(100); // mW
  const [beamDiameter, setBeamDiameter] = useState(3); // mm
  const [aperture, setAperture] = useState(7); // mm (pupil)

  const lam = wavelength / 1000; // µm

  // Calculate maximum safe exposure time
  const maxSafeTime = useMemo(() => {
    const beamArea = Math.PI * Math.pow(beamDiameter / 20, 2); // cm²
    const irrad = power / 1000 / beamArea; // W/cm²

    // MPE formulas: find t where MPE(t) = irradiance
    // 400-700nm: MPE = 1.8*t^0.75 mJ/cm² = 1.8e-3 * t^0.75 J/cm²
    // Set 1.8e-3 * t^0.75 = irrad * t => for CW: MPE_H = 1.8e-3 * t^0.75
    // Irradiance limit: irrad < MPE/t = 1.8e-3 * t^(-0.25)
    // t_max = (1.8e-3 / irrad)^4 ... but capped at T_max for the regime

    if (lam >= 0.4 && lam < 0.7) {
      // MPE irradiance for CW: 1.8e-3 * t^(-0.25) W/cm² (for t < 10s)
      // 1.8e-3 * t^(-0.25) = irrad => t = (1.8e-3/irrad)^4
      const tCalc = Math.pow(1.8e-3 / irrad, 4);
      return Math.min(tCalc, 10); // max 10s for visible
    } else if (lam >= 0.7 && lam < 1.4) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      const tCalc = Math.pow(1.8e-3 * CA / irrad, 4);
      return Math.min(tCalc, 100);
    } else if (lam >= 1.4 && lam < 1.8) {
      // MPE = 0.1 J/cm² for t < 10s => irradiance = 0.1/t
      // 0.1/t = irrad => t = 0.1/irrad
      return Math.min(0.1 / irrad, 10);
    }
    return 0.001;
  }, [wavelength, power, beamDiameter, lam]);

  const beamIrradiance = useMemo(() => {
    const beamArea = Math.PI * Math.pow(beamDiameter / 20, 2);
    return power / 1000 / beamArea;
  }, [power, beamDiameter]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => Math.pow(10, -4 + i * 0.04));
    let mpeFn: (t: number) => number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeFn = (t) => 1.8e-3 * Math.pow(t, -0.25);
    } else if (lam >= 0.7 && lam < 1.4) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeFn = (t) => 1.8e-3 * CA * Math.pow(t, -0.25);
    } else if (lam >= 1.4 && lam < 1.8) {
      mpeFn = (t) => t < 10 ? 0.1 / t : 0.01;
    } else {
      mpeFn = () => 0.01;
    }
    return [
      {
        x: times, y: times.map(mpeFn),
        type: "scatter" as const, mode: "lines" as const, name: "MPE Irradiance",
        line: { color: "#60a5fa" }
      },
      {
        x: times, y: times.map(() => beamIrradiance),
        type: "scatter" as const, mode: "lines" as const, name: "Beam Irradiance",
        line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [lam, beamIrradiance]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Maximum Safe Exposure Duration" description="Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1800} />
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0.001} step="any" />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.01} step="any" />
        <ValidatedNumberInput label="Pupil Diameter (mm)" value={aperture} onChange={setAperture} min={1} max={7} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-2xl font-bold text-yellow-400">{beamIrradiance.toFixed(3)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Safe Exposure Time</p>
          <p className="text-2xl font-bold text-green-400">
            {maxSafeTime < 0.001 ? (maxSafeTime * 1e6).toFixed(1) + " µs" :
              maxSafeTime < 1 ? (maxSafeTime * 1000).toFixed(2) + " ms" :
              maxSafeTime.toFixed(3) + " s"}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
