"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SpectralLineBroadeningPage() {
  const [centerWl, setCenterWl] = useURLState("centerWl", 500); // nm
  const [temperature, setTemperature] = useURLState("temperature", 5000); // K
  const [molecularMass, setMolecularMass] = useURLState("molecularMass", 20); // amu
  const [pressure, setPressure] = useURLState("pressure", 1); // atm
  const [gammaCol, setGammaCol] = useURLState("gammaCol", 0.1); // cm⁻¹ FWHM collisional
  const [naturalWidth, setNaturalWidth] = useURLState("naturalWidth", 0.001); // cm⁻¹

  const chartData = useMemo(() => {
    const sigma0 = 1e7 / centerWl; // cm⁻¹
    const range = 5; // cm⁻¹ from center
    const x = Array.from({ length: 500 }, (_, i) => sigma0 - range + (2 * range * i) / 499);

    // Doppler FWHM: Δσ_D = σ0 * sqrt(8kT ln2 / mc²)
    const k = 1.381e-23, c = 3e8, amu = 1.661e-27;
    const m = molecularMass * amu;
    const dopplerFWHM = sigma0 * Math.sqrt((8 * k * temperature * Math.LN2) / (m * c * c));
    const dopplerGauss = dopplerFWHM / (2 * Math.sqrt(2 * Math.LN2));

    // Gaussian (Doppler)
    const gaussian = x.map(s => Math.exp(-Math.pow((s - sigma0) / dopplerGauss, 2) / 2));

    // Lorentzian (collisional + natural)
    // FWHM = 2·γ_col·P + Γ_nat (Demtröder, Laser Spectroscopy Vol 2)
    const lorentzFWHM = 2 * gammaCol * pressure + naturalWidth;
    const lorentzian = x.map(s => (lorentzFWHM / 2) ** 2 / ((s - sigma0) ** 2 + (lorentzFWHM / 2) ** 2));

    // Voigt (approximate: Gaussian convolved with Lorentzian via pseudo-Voigt)
    const fG = dopplerFWHM;
    const fL = lorentzFWHM;
    const f = Math.pow(fG ** 5 + 2.69269 * fG ** 4 * fL + 2.42843 * fG ** 3 * fL ** 2 + 4.47163 * fG ** 2 * fL ** 3 + 0.07842 * fG * fL ** 4 + fL ** 5, 0.2);
    const eta = (fL / f);
    const voigt = x.map(s => {
      const g = Math.exp(-Math.pow((s - sigma0) / (fG / (2 * Math.sqrt(2 * Math.LN2))), 2) / 2);
      const l = (fL / 2) ** 2 / ((s - sigma0) ** 2 + (fL / 2) ** 2);
      return (1 - eta) * g + eta * l;
    });

    // Normalize
    const norm = (arr: number[]) => { const mx = Math.max(...arr); return mx > 0 ? arr.map(v => v / mx) : arr; };

    return [
      { x, y: norm(gaussian), type: "scatter" as const, mode: "lines" as const, name: "Doppler (Gaussian)", line: { color: "#60a5fa" } },
      { x, y: norm(lorentzian), type: "scatter" as const, mode: "lines" as const, name: "Collisional (Lorentzian)", line: { color: "#34d399" } },
      { x, y: norm(voigt), type: "scatter" as const, mode: "lines" as const, name: "Voigt (combined)", line: { color: "#f87171", width: 2.5 } },
    ];
  }, [centerWl, temperature, molecularMass, pressure, gammaCol, naturalWidth]);

  // Compute values
  const k = 1.381e-23, c = 3e8, amu = 1.661e-27;
  const m = molecularMass * amu;
  const sigma0 = 1e7 / centerWl;
  const dopplerFWHM = sigma0 * Math.sqrt((8 * k * temperature * Math.LN2) / (m * c * c));
  const collisionalFWHM = 2 * gammaCol * pressure;
  const lorentzFWHM_disp = collisionalFWHM + naturalWidth;
  // Olivero-Longbothum Voigt FWHM approximation (same as chart)
  const fG = dopplerFWHM, fL = lorentzFWHM_disp;
  const totalFWHM = Math.pow(fG**5 + 2.69269*fG**4*fL + 2.42843*fG**3*fL**2 + 4.47163*fG**2*fL**3 + 0.07842*fG*fL**4 + fL**5, 0.2);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Spectral Line Broadening" description="Doppler, collisional, natural, and Voigt broadening mechanisms.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Center λ (nm)" value={centerWl} onChange={setCenterWl} min={100} />
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={100} />
        <ValidatedNumberInput label="Molecular Mass (amu)" value={molecularMass} onChange={setMolecularMass} min={1} />
        <ValidatedNumberInput label="Pressure (atm)" value={pressure} onChange={setPressure} min={0} />
        <ValidatedNumberInput label="Collisional γ (cm⁻¹)" value={gammaCol} onChange={setGammaCol} min={0} />
        <ValidatedNumberInput label="Natural Width (cm⁻¹)" value={naturalWidth} onChange={setNaturalWidth} min={0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Doppler FWHM</p>
          <p className="text-xl font-bold text-blue-400">{dopplerFWHM.toFixed(4)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Collisional FWHM</p>
          <p className="text-xl font-bold text-green-400">{collisionalFWHM.toFixed(4)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Voigt ~FWHM</p>
          <p className="text-xl font-bold text-red-400">{totalFWHM.toFixed(4)} cm⁻¹</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">Gaussian (Doppler):</span> Δσ = σ₀√(8kT ln2 / mc²) — thermal motion</p>
        <p><span className="text-green-400 font-mono">Lorentzian (collisional):</span> Δσ = 2γ_col·P — molecular collisions</p>
        <p><span className="text-red-400 font-mono">Voigt:</span> Convolution of Gaussian + Lorentzian. Dominant at intermediate conditions.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" },
        yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [-0.05, 1.1] },
        height: 500, margin: { t: 30, b: 40 },
      }} />
    </CalculatorShell>
  );
}
