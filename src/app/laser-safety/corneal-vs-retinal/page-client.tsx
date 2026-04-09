"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function CornealVsRetinalPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10);
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 3); // mm

  // Corneal MPE: limits irradiance at the front surface of the eye
  // Retinal MPE: limits irradiance at the retina (much lower due to focusing)
  // The eye acts as a ~17mm focal length lens, concentrating beam by ~(pupil/retina_spot)²
  //
  // Corneal MPE for retinal hazard region (400-1400nm):
  //   MPE_corneal = MPE_retinal × (π/4) × α² × (1/d_eff²)
  //   where α = angular subtense, d_eff = effective pupil diameter
  //
  // Simplified: Retinal irradiance = Corneal irradiance × (d_pupil/f_eye)²
  //   Gain ≈ (7mm/17mm)² ≈ 170,000×

  const results = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const t = exposureTime;

    // Corneal MPE (irradiance, W/cm²) for 400-700nm CW
    let mpeCorneal: number; // W/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpeCorneal = t <= 0.7 ? 1.8e-3 / Math.pow(t, 0.25) : 1e-3 / Math.pow(t, 0.25);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      const tEff = Math.min(t, 0.7);
      mpeCorneal = 1.8e-3 * CA / Math.pow(tEff, 0.25);
    } else if (lam >= 1.05 && lam < 1.4) {
      // 1050-1400nm: corneal limits start dominating
      const C = 5;
      mpeCorneal = 1.8e-3 * C / Math.pow(Math.min(t, 0.7), 0.25);
    } else {
      mpeCorneal = 0.01; // UV simplified
    }

    // Retinal irradiance gain
    const fEye = 0.0017; // m
    const dPupil = Math.min(beamDiam, 7) / 1000; // m
    const gain = Math.pow(dPupil / fEye, 2);

    // Retinal irradiance at corneal MPE
    const retinalIrradiance = mpeCorneal * gain; // W/cm² (at retina)

    // Retinal spot size (diffraction limited)
    const lamM = wavelength * 1e-9;
    const retinalSpotDiam = 2.44 * lamM * fEye; // m
    const retinalSpotUm = retinalSpotDiam * 1e6;

    // Retinal MPE (irradiance at retina)
    // For extended source: higher MPE, for point source: lower
    const alpha = 1.5e-3; // rad (point source minimum)
    const mpeRetinalIrradiance = mpeCorneal * Math.pow(alpha * fEye * 100, 2) * Math.PI / 4 / Math.pow(retinalSpotUm / 10000, 2);

    // Which limit is more restrictive?
    const corneaLimitPower = mpeCorneal * Math.PI * Math.pow(0.1, 2); // power through 1mm aperture
    const foveolaArea = Math.PI * Math.pow(retinalSpotUm / 2 * 1e-4, 2); // cm²
    const retinaLimitPower = mpeRetinalIrradiance * foveolaArea;

    return {
      mpeCorneal,
      retinalIrradiance,
      gain,
      retinalSpotUm,
      corneaLimitPower,
      retinaLimitPower,
      dominantLimit: corneaLimitPower < retinaLimitPower ? "Corneal" : "Retinal",
    };
  }, [wavelength, exposureTime, beamDiam]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 2.2);
    const t = exposureTime;

    const cornealVals = wls.map(w => {
      const lam = w / 1000;
      if (lam >= 0.4 && lam < 0.7) return t <= 0.7 ? 1.8e-3 / Math.pow(t, 0.25) : 1e-3 / Math.pow(t, 0.25);
      if (lam >= 0.7 && lam < 1.05) return 1.8e-3 * Math.pow(10, 0.02 * (lam - 0.7)) / Math.pow(Math.min(t, 0.7), 0.25);
      if (lam >= 1.05 && lam < 1.4) return 1.8e-3 * 5 / Math.pow(Math.min(t, 0.7), 0.25);
      return 0.01;
    });

    const retinalVals = cornealVals.map((mc, i) => {
      const fEye = 0.0017;
      const dPupil = Math.min(beamDiam, 7) / 1000;
      return mc * Math.pow(dPupil / fEye, 2);
    });

    return [
      { x: wls, y: cornealVals, type: "scatter" as const, mode: "lines" as const, name: "Corneal MPE (W/cm²)", line: { color: "#60a5fa" } },
      { x: wls, y: retinalVals, type: "scatter" as const, mode: "lines" as const, name: "Retinal Irradiance (W/cm²)", line: { color: "#f87171" } },
    ];
  }, [wavelength, exposureTime, beamDiam]);

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
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Corneal vs Retinal Limits" description="Compares corneal MPE with equivalent retinal irradiance, showing the eye&apos;s focusing gain and which limit governs.">
            
      <LaserSafetyDisclaimer />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
          <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} step="0.1" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam/Pupil Diameter (mm)</label>
          <ValidatedNumberInput label="Beam/Pupil Diameter (mm)" value={beamDiam} onChange={setBeamDiam} step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Corneal MPE</div>
          <div className="text-2xl font-bold text-blue-400">{results.mpeCorneal.toExponential(2)}</div>
          <div className="text-xs text-gray-500">W/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Focusing Gain</div>
          <div className="text-2xl font-bold text-yellow-400">{results.gain.toExponential(2)}×</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Retinal Spot</div>
          <div className="text-2xl font-bold text-pink-400">{results.retinalSpotUm.toFixed(1)}</div>
          <div className="text-xs text-gray-500">µm</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Dominant Limit</div>
          <div className={`text-xl font-bold ${results.dominantLimit === "Corneal" ? "text-blue-400" : "text-red-400"}`}>{results.dominantLimit}</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>E<sub>retina</sub> = E<sub>cornea</sub> × (d<sub>pupil</sub> / f<sub>eye</sub>)²</p>
        <p>Gain = (7mm / 17mm)² ≈ 1.7 × 10⁵ (for full pupil)</p>
        <p>d<sub>Airy</sub> = 2.44 × λ × f<sub>eye</sub> / d<sub>pupil</sub></p>
        <p className="text-yellow-400 mt-2">⚠ For 400-1400nm, retinal limits usually govern; corneal limits govern outside this range</p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
