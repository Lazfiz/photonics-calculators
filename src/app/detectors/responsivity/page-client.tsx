"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";

const wavelengthPresets = [405, 532, 850, 1310, 1550];
const qePresets = [0.2, 0.5, 0.8, 0.95];
const currentHref = "/detectors/responsivity";

export default function ResponsivityPage() {
  const [quantumEfficiency, setQuantumEfficiency] = useState(0.8);
  const [wavelength, setWavelength] = useState(1550);

  const q = 1.602e-19, h = 6.626e-34, c = 3e8;
  const responsivity = (quantumEfficiency * q * wavelength * 1e-9) / (h * c);
  const photonsPerWatt = (wavelength * 1e-9) / (h * c);
  const photocurrentAt1mW_uA = responsivity * 1e-3 * 1e6;

  const chartSeries = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 300 + i * 7);
    const r = wls.map((wl) => (quantumEfficiency * q * wl * 1e-9) / (h * c));
    return [{ name: "Responsivity", color: "#60a5fa", points: wls.map((x, i) => ({ x, y: r[i] })) }, { name: "Current point", color: "#22c55e", showPoints: true, points: [{ x: wavelength, y: responsivity }] }];
  }, [quantumEfficiency, wavelength, q, h, c, responsivity]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Detector Responsivity" description="Interactive responsivity calculator from quantum efficiency and wavelength, with presets and wavelength sweeps.">
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={`w-${preset}`} onClick={() => setWavelength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} nm</button>
        ))}
        {qePresets.map((preset) => (
          <button key={`q-${preset}`} onClick={() => setQuantumEfficiency(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${quantumEfficiency === preset ? "border-green-400 bg-green-500/15 text-green-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>QE {preset}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Quantum efficiency" value={quantumEfficiency} onChange={setQuantumEfficiency} min={0} max={1} step={0.01} />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={300} max={2000} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${responsivity.toFixed(3)} A/W`} tone="blue" />
        <ResultCard label="Photons per watt" value={photonsPerWatt.toExponential(2)} tone="green" />
        <ResultCard label="Current @ 1 mW" value={`${photocurrentAt1mW_uA.toFixed(2)} µA`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>R = ηqλ / hc</p>
        <p>Responsivity rises linearly with wavelength for fixed quantum efficiency.</p>
      </div>

      <SimpleLineChart title="Responsivity vs wavelength" xLabel="Wavelength (nm)" yLabel="Responsivity (A/W)" series={chartSeries} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
