"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ThermalVsPhotochemicalPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 450); // nm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1); // seconds
  const [spotSize, setSpotSize] = useURLState("spotSize", 1); // mm

  // IEC 60825-1 distinguishes thermal and photochemical MPEs.
  // The applicable MPE is the MORE RESTRICTIVE of the two.
  //
  // Thermal MPE (400-700nm): MPE_th = 1.8×10⁻³ × t^0.75 J/cm² (t ≤ 10s)
  // For t > 10s: 10.1 mJ/cm² (corneal), retinal limit applies
  //
  // Photochemical MPE (300-700nm):
  // MPE_ph = 10^(0.02(λ-450)) × 0.01 × t^0.5 J/cm² (λ: 400-600nm)
  // Actually: photochemical limit kicks in for λ > 400nm at long exposures
  // Simplified: MPE_ph depends on retinal blue-light weighting

  const results = useMemo(() => {
    const lam = wavelength; // nm
    const t = Math.max(exposureTime, 1e-6);
    const a = spotSize / 10; // cm

    // Correction factor C_A for near-IR (700-1050nm)
    let CA = 1;
    if (lam >= 700 && lam <= 1050) {
      CA = Math.pow(10, 0.02 * (lam / 1000 - 0.7));
    }

    // Thermal MPE for retinal exposure (400-1050nm)
    // For t = 10⁻⁵ to 10s: MPE = 1.8×10⁻³ × CA × t^0.75 J/cm² (small source)
    let mpeThermal: number;
    if (t <= 10) {
      mpeThermal = 1.8e-3 * CA * Math.pow(t, 0.75);
    } else {
      mpeThermal = 1.8e-3 * CA * Math.pow(10, 0.75); // ~10.1 mJ/cm²
    }

    // Photochemical (actinic UV/blue) MPE
    // Dominant for 400-500nm at long exposures
    // Simplified model: MPE_ph = H_photochemical limit
    // For 400-600nm: MPE_ph = 10^(-(λ-450)/50) × 0.01 × t^0.5 J/cm² (approximate)
    let mpePhotochemical: number;
    if (lam >= 300 && lam <= 600) {
      // Blue-light hazard weighting function B(λ)
      const B = lam <= 450 ? 1 : Math.exp(-Math.pow((lam - 450) / 50, 2));
      // Photochemical MPE increases with time as sqrt(t) for long exposures
      const baseMPE = 0.01 * Math.pow(t, 0.5);
      mpePhotochemical = baseMPE / Math.max(B, 0.01);
    } else {
      mpePhotochemical = Infinity; // No photochemical limit above 600nm
    }

    // Limiting MPE
    const mpeLimiting = Math.min(mpeThermal, mpePhotochemical);
    const limitingType = mpeThermal <= mpePhotochemical ? "Thermal" : "Photochemical";

    return { mpeThermal, mpePhotochemical, mpeLimiting, limitingType, CA };
  }, [wavelength, exposureTime, spotSize]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + (i / 199) * 400);
    const thermal = wls.map(l => {
      const t = Math.max(exposureTime, 1e-6);
      let CA = 1;
      if (l >= 700) CA = Math.pow(10, 0.02 * (l / 1000 - 0.7));
      return (1.8e-3 * CA * Math.pow(Math.min(t, 10), 0.75)) * 1000;
    });
    const photochemical = wls.map(l => {
      const t = Math.max(exposureTime, 1e-6);
      if (l > 600) return 1000; // off chart
      const B = l <= 450 ? 1 : Math.exp(-Math.pow((l - 450) / 50, 2));
      return (0.01 * Math.pow(t, 0.5) / Math.max(B, 0.01)) * 1000;
    });
    return { wls, thermal, photochemical };
  }, [exposureTime]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">Thermal vs Photochemical MPE</h1>
        <p className="text-gray-400 mb-8">Compare thermal and photochemical MPE limits — the more restrictive applies.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>Thermal: MPE<sub>th</sub> = 1.8×10⁻³ × C<sub>A</sub> × t^0.75 J/cm²</p>
            <p>C<sub>A</sub> = 10^(0.02(λ−700))  for 700–1050 nm, else 1</p>
            <p>Photochemical: MPE<sub>ph</sub> = H(λ) × t^0.5 J/cm²  (300–600 nm)</p>
            <p>Limiting MPE = min(MPE<sub>th</sub>, MPE<sub>ph</sub>)</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
              <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} step="any" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Spot Size (mm)</label>
              <ValidatedNumberInput label="Spot Size (mm)" value={spotSize} onChange={setSpotSize} step="0.1" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Thermal MPE", value: (results.mpeThermal * 1000).toFixed(3), unit: "mJ/cm²", color: "#ef4444" },
              { label: "Photochemical MPE", value: results.mpePhotochemical === Infinity ? "N/A" : (results.mpePhotochemical * 1000).toFixed(3), unit: "mJ/cm²", color: "#3b82f6" },
              { label: "Limiting MPE", value: (results.mpeLimiting * 1000).toFixed(3), unit: "mJ/cm²", color: "#22c55e" },
              { label: "Limiting Type", value: results.limitingType, unit: "", color: "#f59e0b" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
          {results.CA !== 1 && (
            <p className="text-sm text-gray-400 mt-3">C<sub>A</sub> correction factor: {results.CA.toFixed(3)}</p>
          )}
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">MPE vs Wavelength</h2>
          <ChartPanel
            data={[
              { x: chartData.wls, y: chartData.thermal, type: "scatter", mode: "lines", name: "Thermal", line: { color: "#ef4444", width: 2 } },
              { x: chartData.wls, y: chartData.photochemical, type: "scatter", mode: "lines", name: "Photochemical", line: { color: "#3b82f6", width: 2, dash: "dash" } },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "MPE (mJ/cm²)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, legend: { orientation: "h", y: -0.2 },
              margin: { t: 30, r: 30, b: 60, l: 70 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
