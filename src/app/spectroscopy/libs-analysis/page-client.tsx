"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function LibsAnalysisPage() {
  const [temperature, setTemperature] = useState(10000); // K
  const [electronDensity, setElectronDensity] = useState(1e17); // cm⁻³
  const [wavelength, setWavelength] = useState(500); // nm
  const [spectralRange, setSpectralRange] = useState(50); // nm half-width

  // Stark broadening FWHM (nm) - simplified
  const starkWidth = 2 * 1e-16 * electronDensity; // rough: ~2w_e, w_e ~ 1e-16 * Ne for typical transitions

  // Doppler FWHM (nm)
  const dopplerWidth = wavelength * Math.sqrt(8 * 1.380649e-23 * temperature * Math.log(2) / (1.66054e-27 * 3e8 ** 2 * 40)); // atomic mass ~40 amu (Ar-like)
  const dopplerWidthNm = dopplerWidth * 1e9;

  // Voigt approx (Gaussian + Lorentzian FWHM)
  const voigtWidth = 0.5346 * starkWidth + Math.sqrt(0.2166 * starkWidth ** 2 + dopplerWidthNm ** 2);

  // Saha-Boltzmann (ionization) - simplified for visualization
  const k_B = 1.380649e-23;
  const ionizationEnergy = 7.0; // eV, Ar-like
  const sahaFactor = Math.exp(-ionizationEnergy * 1.602e-19 / (k_B * temperature));

  const chartData = useMemo(() => {
    const x = Array.from({ length: 500 }, (_, i) => wavelength - spectralRange + i * (2 * spectralRange) / 500);
    // Gaussian (Doppler)
    const sigma = dopplerWidthNm / (2 * Math.sqrt(2 * Math.log(2)));
    const gaussian = x.map(xi => Math.exp(-((xi - wavelength) ** 2) / (2 * sigma ** 2)));
    // Lorentzian (Stark)
    const gamma = starkWidth / 2;
    const lorentzian = x.map(xi => 1 / (1 + ((xi - wavelength) / gamma) ** 2));
    return [
      { x, y: gaussian, type: "scatter", mode: "lines", name: "Doppler (Gaussian)",
        line: { color: "#60a5fa", width: 2 } },
      { x, y: lorentzian, type: "scatter", mode: "lines", name: "Stark (Lorentzian)",
        line: { color: "#f87171", width: 2 } },
    ];
  }, [wavelength, dopplerWidthNm, starkWidth, spectralRange]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="LIBS Analysis Calculator" description="Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Plasma Temperature T (K)" value={temperature} onChange={setTemperature} min={1000} step="1000" />
        <ValidatedNumberInput label="Electron Density Nₑ (cm⁻³)" value={electronDensity} onChange={setElectronDensity} step="1e16" />
        <ValidatedNumberInput label="Line Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} />
        <ValidatedNumberInput label="Display Range (nm half-width)" value={spectralRange} onChange={setSpectralRange} min={1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Doppler FWHM</p>
          <p className="text-xl font-bold text-blue-400">{dopplerWidthNm.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stark FWHM</p>
          <p className="text-xl font-bold text-red-400">{starkWidth.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Voigt FWHM (approx)</p>
          <p className="text-xl font-bold text-green-400">{voigtWidth.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Saha factor (ionization)</p>
          <p className="text-xl font-bold text-yellow-400">{sahaFactor.toExponential(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><strong>Doppler:</strong> Δλ_D = λ₀ √(8kT ln2 / mc²) — thermal broadening</p>
        <p><strong>Stark:</strong> Δλ_S ≈ 2wₑ · Nₑ — electron impact broadening (simplified)</p>
        <p><strong>Voigt:</strong> Δλ_V ≈ 0.5346·Δλ_L + √(0.2166·Δλ_L² + Δλ_D²)</p>
        <p className="text-gray-500">wₑ ≈ 1×10⁻¹⁶ nm·cm³ for typical ionic lines (order-of-magnitude)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />
    </CalculatorShell>
  );
}
