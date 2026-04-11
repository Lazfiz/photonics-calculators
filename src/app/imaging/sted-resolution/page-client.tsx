"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function STEDResolutionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 640);
  const [na, setNa] = useURLState("na", 1.4);
  const [depletionWavelength, setDepletionWavelength] = useURLState("depletionWavelength", 775);
  const [saturationFactor, setSaturationFactor] = useURLState("saturationFactor", 30);

  // Confocal resolution
  const confocalRes = 0.4 * wavelength / na;

  // STED resolution: d_STED = d_conf / sqrt(1 + I_dep / I_sat)
  const stedRes = confocalRes / Math.sqrt(1 + saturationFactor);

  // Donut zero intensity at center
  const improvementFactor = Math.sqrt(1 + saturationFactor);

  const chartData = useMemo(() => {
    const sats = Array.from({ length: 100 }, (_, i) => 1 + i * 1.5);
    return [
      { x: sats, y: sats.map(s => confocalRes / Math.sqrt(1 + s)), type: "scatter", mode: "lines", name: "STED Resolution", line: { color: "#34d399" } },
      { x: [saturationFactor], y: [stedRes], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [sats[0], sats[sats.length - 1]], y: [confocalRes, confocalRes], type: "scatter", mode: "lines", name: "Confocal Limit", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [confocalRes, stedRes, saturationFactor]);

  const wavelengthData = useMemo(() => {
    const wls = Array.from({ length: 60 }, (_, i) => 400 + i * 10);
    return [
      { x: wls, y: wls.map(w => 0.4 * w / na), type: "scatter", mode: "lines", name: "Confocal", line: { color: "#60a5fa" } },
      { x: wls, y: wls.map(w => 0.4 * w / na / Math.sqrt(1 + saturationFactor)), type: "scatter", mode: "lines", name: "STED", line: { color: "#34d399" } },
    ];
  }, [na, saturationFactor]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="STED Super-Resolution Calculator" description="Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={400} max={800} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.5} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Depletion λ (nm)" value={depletionWavelength} onChange={setDepletionWavelength} min={500} max={900} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="block text-sm text-gray-300 mb-1">I<sub>dep</sub> / I<sub>sat</sub></span>
          <ValidatedNumberInput label="Idep / Isat" value={saturationFactor} onChange={setSaturationFactor} min={1} max={200} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{confocalRes.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">STED Resolution</p>
          <p className="text-2xl font-bold text-green-400">{stedRes.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Improvement Factor</p>
          <p className="text-2xl font-bold text-yellow-400">{improvementFactor.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Depletion Shift</p>
          <p className="text-2xl font-bold text-purple-400">+{depletionWavelength - wavelength} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>d_conf = 0.4λ / NA (confocal FWHM)</p>
          <p>d_STED = d_conf / √(1 + I_dep/I_sat)</p>
          <p>Improvement = √(1 + I_dep/I_sat)</p>
        </div>
                      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "I_dep / I_sat", gridcolor: "#374151" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={wavelengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Excitation λ (nm)", gridcolor: "#374151" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
