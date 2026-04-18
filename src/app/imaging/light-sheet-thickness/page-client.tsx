"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LightSheetThicknessPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 488);
  const [na, setNa] = useURLState("na", 0.1);
  const [sheetLength, setSheetLength] = useURLState("sheetLength", 100);
  const [gaussianBeamWaist, setGaussianBeamWaist] = useURLState("gaussianBeamWaist", 0);

  // If gaussianBeamWaist is 0, compute from NA (all internal units in µm)
  const beamWaistUm = gaussianBeamWaist > 0 ? gaussianBeamWaist : (wavelength / 1000) / (Math.PI * na);
  // Rayleigh range: z_R = π·w₀²/λ (all µm)
  const zRUm = Math.PI * beamWaistUm * beamWaistUm / (wavelength / 1000);
  // Sheet thickness (2× beam waist)
  const sheetThicknessUmUm = 2 * beamWaistUm;
  const rayleighRangeUm = zRUm;

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.01 + i * 0.002);
    return [
      { x: nas, y: nas.map(n => 2 * ((wavelength / 1000) / (Math.PI * n))), type: "scatter", mode: "lines", name: "Sheet Thickness", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => { const w = (wavelength / 1000) / (Math.PI * n); return Math.PI * w * w / (wavelength / 1000); }), type: "scatter", mode: "lines", name: "Rayleigh Range", line: { color: "#fbbf24", dash: "dash" } },
      { x: [na], y: [sheetThicknessUmUm], type: "scatter", mode: "markers", name: "Current Thickness", marker: { color: "#34d399", size: 12 } },
    ];
  }, [wavelength, na, sheetThicknessUmUm]);

  const profileData = useMemo(() => {
    const z = Array.from({ length: 200 }, (_, i) => (i - 100) * sheetLength / 100);
    return [
      { x: z, y: z.map(zz => 1 / (1 + (zz / zRUm) ** 2)), type: "scatter", mode: "lines", name: "On-axis Intensity I(z)/I₀", line: { color: "#a78bfa" } },
    ];
  }, [sheetLength, zRUm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Light Sheet Thickness Calculator" description="Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={350} max={800} />
        <ValidatedNumberInput label="Cylinder NA" value={na} onChange={setNa} min={0.01} max={0.5} step="0.005" />
        <ValidatedNumberInput label="Sheet Length (µm)" value={sheetLength} onChange={setSheetLength} min={10} max={500} />
        <ValidatedNumberInput label="Beam Waist override (µm, 0=auto)" value={gaussianBeamWaist} onChange={setGaussianBeamWaist} min={0} max={50} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Waist (w₀)</p>
          <p className="text-2xl font-bold text-blue-400">{(beamWaistUm).toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sheet Thickness (2w₀)</p>
          <p className="text-2xl font-bold text-green-400">{sheetThicknessUm.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range (z<sub>R</sub>)</p>
          <p className="text-2xl font-bold text-yellow-400">{rayleighRangeUm.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Aspect Ratio</p>
          <p className="text-2xl font-bold text-purple-400">{(2 * zRUm / beamWaistUm).toFixed(1)}:1</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
                              </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Cylinder NA", gridcolor: "#374151" },
            yaxis: { title: "Thickness (µm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={profileData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "z (µm)", gridcolor: "#374151" },
            yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
