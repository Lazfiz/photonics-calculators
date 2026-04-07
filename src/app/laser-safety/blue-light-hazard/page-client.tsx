"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";
export default function BlueLightHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 450); // nm
  const [power, setPower] = useURLState("power", 1); // W
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 2); // mm

  // Blue light hazard (IEC 62471 / IEC 60825-1)
  // Weighting function B(λ) peaks at 435-440 nm
  // B(λ) is defined in the standard; we use a Gaussian approximation
  //
  // L_B = Σ L_λ × B(λ) × Δλ  (blue-weighted radiance)
  // For intrabeam viewing: L = 4P / (π² × d² × α²) ... simplified
  //
  // Hazard limits: RG0 (exempt), RG1 (low risk), RG2 (moderate), RG3 (high)
  // Based on E_B = Σ E_λ × B(λ) × Δλ  (blue-weighted irradiance)

  // Blue light hazard function B(λ) - simplified Gaussian approximation
  const blueLightWeight = (lambda: number): number => {
    // Approximation of the IEC B(λ) function
    // Peak at ~435nm, significant from ~400-500nm
    if (lambda < 300 || lambda > 700) return 0;
    if (lambda < 380) return 0.01 * Math.exp(-Math.pow((lambda - 380) / 15, 2));
    if (lambda <= 500) return Math.exp(-Math.pow((lambda - 435) / 40, 2));
    return 0.01 * Math.exp(-Math.pow((lambda - 500) / 20, 2));
  };

  const results = useMemo(() => {
    const d_cm = beamDiam / 10;
    const area = Math.PI * Math.pow(d_cm / 2, 2);

    // Irradiance at cornea
    const irradiance = power / area; // W/cm²

    // Blue-light weighted irradiance
    const B = blueLightWeight(wavelength);
    const EB = irradiance * B; // W/cm² weighted

    // Simplified spectral weighting for a narrowband source
    // Assume 1nm bandwidth for single wavelength
    const deltaLambda = 1e-9; // 1nm in m
    // EB in W/m² = irradiance_W_m2 * B(λ) * Δλ
    const irradianceWm2 = power / (Math.PI * Math.pow(beamDiam / 2 * 1e-3, 2));
    const EBnarrow = irradianceWm2 * B; // W/m² per nm

    // Exposure limits (simplified from IEC 62471):
    // RG0: E_B < 0.01 W/m² (10000s exposure)
    // RG1: E_B < 1 W/m² (100s)
    // RG2: E_B < 1 W/m² (0.25s)
    // RG3: E_B > 1 W/m² (0.25s) - but depends on time

    // Risk group based on weighted irradiance (for t=10000s reference)
    const EBref = EBnarrow; // W/m² per nm bandwidth
    let riskGroup: string;
    if (EBref < 0.001) riskGroup = "Exempt (RG0)";
    else if (EBref < 0.1) riskGroup = "RG1 (Low Risk)";
    else if (EBref < 1.0) riskGroup = "RG2 (Moderate)";
    else riskGroup = "RG3 (High Risk)";

    return { irradiance, B, EBnarrow, riskGroup, irradianceWm2 };
  }, [wavelength, power, beamDiam]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + (i / 199) * 400);
    const weights = wls.map(blueLightWeight);
    return { wls, weights };
  }, []);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">Blue Light Hazard</h1>
        <p className="text-gray-400 mb-8">Calculate blue-light weighted irradiance and photobiological risk group per IEC 62471.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>E<sub>B</sub> = Σ E<sub>λ</sub> × B(λ) × Δλ  (blue-weighted irradiance)</p>
            <p>B(λ): weighting function, peak at 435 nm</p>
            <p>E = P / (π(d/2)²)  (irradiance)</p>
            <p>Risk Groups: Exempt → RG1 → RG2 → RG3</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={e => setWavelength(parseFloat(e.target.value) || 400)}
                step="1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Power (W)</label>
              <input type="number" value={power} onChange={e => setPower(Math.max(0, parseFloat(e.target.value) || 0))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beam Diameter (mm)</label>
              <input type="number" value={beamDiam} onChange={e => setBeamDiam(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                step="0.1" className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-2 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Corneal Irradiance", value: results.irradiance.toFixed(2), unit: "W/cm²" },
              { label: "B(λ) Weight", value: results.B.toFixed(4), unit: "" },
              { label: "Blue-weighted E_B", value: results.EBnarrow.toFixed(2), unit: "W/m²/nm" },
              { label: "Risk Group", value: results.riskGroup, unit: "" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Blue Light Hazard Function B(λ)</h2>
          <ChartPanel
            data={[
              {
                x: chartData.wls, y: chartData.weights, type: "scatter", mode: "lines",
                name: "B(λ)", line: { color: "#3b82f6", width: 2 },
                fill: "tozeroy", fillcolor: "rgba(59,130,246,0.15)",
              },
              {
                x: [wavelength], y: [blueLightWeight(wavelength)], type: "scatter", mode: "markers",
                name: "Selected λ", marker: { color: "#ef4444", size: 12 },
              },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "B(λ)", color: "#9ca3af", gridcolor: "#1f2937", range: [0, 1.1] },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 50, l: 50 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
