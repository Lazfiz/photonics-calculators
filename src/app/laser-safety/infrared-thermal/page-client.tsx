"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";


export default function InfraredThermalPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 10600);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10);
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 5); // mm
  const [power, setPower] = useURLState("power", 10); // W

  // IR thermal limits:
  // 1400nm - 1mm (far IR): corneal/thermal hazard dominates
  // 1mm - 1µm: thermal retinal hazard + corneal
  //
  // For far-IR (λ > 1400nm, e.g. CO2 at 10.6µm):
  //   MPE = 0.1 × t^0.25 W/cm² (corneal limit, 1mm aperture)
  // For mid-IR (1400-2600nm):
  //   MPE = 0.56 × t^0.25 W/cm² (1mm aperture)
  // For near-IR retinal (780-1400nm):
  //   MPE = 1.8e-3 × CA × t^-0.25 J/cm² converted to W/cm²

  const mpeIR = (wl: number, t: number): number => {
    const lam = wl / 1000; // µm
    if (lam >= 1.4 && lam <= 2.6) {
      // Mid-IR corneal
      return 0.56 * Math.pow(t, -0.25); // W/cm²
    }
    if (lam > 2.6 && lam <= 1000) {
      // Far-IR corneal (CO2 lasers etc)
      return 0.1 * Math.pow(t, -0.25); // W/cm²
    }
    if (lam >= 0.78 && lam < 1.4) {
      // Near-IR retinal hazard with thermal correction
      const CA = Math.pow(10, 0.002 * (wl - 700));
      return 1.8e-3 * CA / Math.pow(Math.min(t, 10), 0.25); // W/cm²
    }
    return 0.1; // fallback
  };

  const results = useMemo(() => {
    const mpe = mpeIR(wavelength, exposureTime); // W/cm²
    const beamArea = Math.PI * Math.pow(beamDiam / 10 / 2, 2); // cm² (1mm limiting aperture for IR)
    const aperture = wavelength > 1400 ? 0.11 : 0.1; // cm
    const apertureArea = Math.PI * Math.pow(aperture / 2, 2);
    const powerDensity = power / beamArea; // W/cm²
    const powerInAperture = power * apertureArea / beamArea; // W through limiting aperture
    const mpePower = mpe * apertureArea; // W (max power through aperture)

    const safetyMargin = mpe / powerDensity;
    const isSafe = safetyMargin >= 1;

    // Penetration depth (simplified)
    const lam = wavelength / 1000;
    const penetration = lam > 10 ? 0.01 : lam > 3 ? 0.05 : lam > 1.4 ? 0.5 : 1; // mm (approximate)

    return {
      mpe,
      powerDensity,
      powerInAperture,
      mpePower,
      safetyMargin,
      isSafe,
      penetration,
      aperture,
    };
  }, [wavelength, exposureTime, beamDiam, power]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 700 + i * 25);
    const mpeVals = wls.map(w => mpeIR(w, exposureTime));
    const pdVals = wls.map(() => {
      const aperture = wavelength > 1400 ? 0.11 : 0.1;
      return power / (Math.PI * Math.pow(beamDiam / 10 / 2, 2));
    });

    return [
      { x: wls, y: mpeVals, type: "scatter" as const, mode: "lines" as const, name: "MPE (W/cm²)", line: { color: "#60a5fa" } },
      { x: wls, y: pdVals, type: "scatter" as const, mode: "lines" as const, name: "Beam Irradiance (W/cm²)", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, exposureTime, beamDiam, power]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937", color: "#9ca3af" },
    yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    margin: { t: 30, b: 50, l: 70, r: 20 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Infrared Thermal Limits" description="Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
          <input type="number" step="0.1" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam Diameter (mm)</label>
          <input type="number" step="0.1" value={beamDiam} onChange={e => setBeamDiam(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Power (W)</label>
          <input type="number" step="0.1" value={power} onChange={e => setPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">IR MPE</div>
          <div className="text-2xl font-bold text-blue-400">{results.mpe.toFixed(3)}</div>
          <div className="text-xs text-gray-500">W/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Beam Irradiance</div>
          <div className="text-2xl font-bold text-red-400">{results.powerDensity.toFixed(2)}</div>
          <div className="text-xs text-gray-500">W/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Safety Margin</div>
          <div className={`text-2xl font-bold ${results.isSafe ? "text-green-400" : "text-red-400"}`}>{results.safetyMargin.toFixed(2)}×</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Penetration Depth</div>
          <div className="text-2xl font-bold text-yellow-400">~{results.penetration}</div>
          <div className="text-xs text-gray-500">mm (approx)</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>Mid-IR (1.4-2.6µm): MPE = 0.56 × t<sup>-0.25</sup> W/cm² (1mm aperture)</p>
        <p>Far-IR (2.6-1000µm): MPE = 0.1 × t<sup>-0.25</sup> W/cm² (1mm aperture)</p>
        <p>Near-IR retinal (780-1400nm): MPE = 1.8×10⁻³ × C<sub>A</sub> × t<sup>-0.25</sup> W/cm²</p>
        <p className="text-yellow-400 mt-2">⚠ CO2 (10.6µm) absorbed at cornea; Er:YAG (2.94µm) at ~1µm depth</p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
