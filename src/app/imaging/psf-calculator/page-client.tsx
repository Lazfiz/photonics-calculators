"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function PSFCalculatorPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [na, setNa] = useURLState("na", 1.4);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [oversampling, setOversampling] = useURLState("oversampling", 4);

  // PSF parameters
  const airyRadiusNm = 0.61 * wavelength / na;
  const fwhm = 0.514 * wavelength / na;
  const axialFWHM = 0.88 * refractiveIndex * wavelength / (na * na);

  // Accurate J1(u)/u approximation
  // J1(u)/u = 1/2 - u²/16 + u⁴/384 - ... (Taylor, |u| < 3)
  // For |u| >= 3: J1(u)/u ≈ √(2/(πu)) · cos(u - 3π/4) / u
  function j1OverU(u: number): number {
    const x = Math.abs(u);
    if (x < 1e-10) return 0.5;
    if (x < 4) {
      const x2 = x * x;
      return 0.5 - x2 / 16 + x2 * x2 / 384 - x2 * x2 * x2 / 18432 + x2 * x2 * x2 * x2 / 1474560;
    }
    // Asymptotic: J1(u)/u ≈ √(2/(π·|u|)) · cos(u - 3π/4) / u
    return Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - 0.75 * Math.PI) / x;
  }

  // Generate 2D Airy PSF
  const psfData = useMemo(() => {
    const size = 100;
    const extent = airyRadiusNm * oversampling * 1.5;
    const step = (2 * extent) / size;
    const x = Array.from({ length: size }, (_, i) => -extent + i * step);
    const y = Array.from({ length: size }, (_, j) => -extent + j * step);
    const z = y.map(yy => x.map(xx => {
      const r = Math.sqrt(xx * xx + yy * yy);
      const u = Math.PI * na * r / wavelength;
      if (u < 1e-10) return 1;
      const j1 = j1OverU(u);
      const airy = 2 * j1 / u;
      return airy * airy;
    }));
    return [{ z, x, y, type: "heatmap" as const, colorscale: "Viridis", showscale: false }];
  }, [wavelength, na, airyRadiusNm, oversampling]);

  // 1D lateral PSF profile
  const lateralProfile = useMemo(() => {
    const x = Array.from({ length: 200 }, (_, i) => -airyRadiusNm * 2.5 + i * (airyRadiusNm * 5 / 200));
    const y = x.map(xx => {
      const u = Math.PI * na * xx / wavelength;
      if (u < 1e-10) return 1;
      const j1 = j1OverU(u);
      return Math.pow(2 * j1 / u, 2);
    });
    return [
      { x, y, type: "scatter", mode: "lines", name: "Lateral PSF", line: { color: "#60a5fa" } },
      { x: [-fwhm / 2, fwhm / 2], y: [0.5, 0.5], type: "scatter", mode: "lines", name: "FWHM", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, na, airyRadiusNm, fwhm]);

  // 1D axial PSF profile
  const axialProfile = useMemo(() => {
    const z = Array.from({ length: 200 }, (_, i) => -axialFWHM * 3 + i * (axialFWHM * 6 / 200));
    const y = z.map(zz => {
      const u = Math.PI * na * na * Math.abs(zz) / (wavelength * refractiveIndex);
      if (u < 1e-10) return 1;
      return Math.pow(Math.sin(u) / u, 2);
    });
    return [
      { x: z, y, type: "scatter", mode: "lines", name: "Axial PSF", line: { color: "#34d399" } },
      { x: [-axialFWHM / 2, axialFWHM / 2], y: [0.5, 0.5], type: "scatter", mode: "lines", name: "FWHM", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [wavelength, na, refractiveIndex, axialFWHM]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Point Spread Function Calculator" description="Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Oversampling" value={oversampling} onChange={setOversampling} min={1} max={10} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Airy Radius</p>
          <p className="text-2xl font-bold text-blue-400">{airyRadiusNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral FWHM</p>
          <p className="text-2xl font-bold text-green-400">{fwhm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial FWHM</p>
          <p className="text-2xl font-bold text-yellow-400">{axialFWHM.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl (ideal)</p>
          <p className="text-2xl font-bold text-purple-400">1.000</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>Airy radius: r = 0.61λ / NA</p>
          <p>Lateral FWHM = 0.514λ / NA</p>
          <p>Axial FWHM = 0.88nλ / NA²</p>
          <p>I(r) = [2J₁(πNAr/λ) / (πNAr/λ)]²</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">2D PSF (Lateral)</h3>
          <ChartPanel data={psfData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "x (nm)", gridcolor: "#374151" },
            yaxis: { title: "y (nm)", gridcolor: "#374151" },
            margin: { t: 10, r: 10, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Lateral PSF Profile</h3>
          <ChartPanel data={lateralProfile} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Position (nm)", gridcolor: "#374151" },
            yaxis: { title: "Intensity", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Axial PSF Profile</h3>
        <ChartPanel data={axialProfile} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "z (nm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity", gridcolor: "#374151", range: [0, 1.1] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
