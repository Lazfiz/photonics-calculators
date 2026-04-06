"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";

const rangePresets = [
  { label: "Visible", min: 400, max: 700 },
  { label: "NIR", min: 700, max: 2500 },
  { label: "Mid-IR", min: 2500, max: 25000 },
  { label: "FTIR common", min: 2500, max: 25000 },
];
const singlePresets = [532, 632.8, 1064, 1550, 3400, 10600];
const currentHref = "/spectroscopy/wavenumber-converter";

export default function WavenumberConverterPage() {
  const [wavelengthMin, setWavelengthMin] = useURLState("wavelengthMin", 400);
  const [wavelengthMax, setWavelengthMax] = useURLState("wavelengthMax", 4000);
  const [mode, setMode] = useState<"wl-to-wn" | "wn-to-wl">("wl-to-wn");
  const [singleValue, setSingleValue] = useURLState("singleValue", 1000);

  const wnMin = 1e7 / wavelengthMax;
  const wnMax = 1e7 / wavelengthMin;
  const singleConverted = 1e7 / singleValue;

  const series = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => wavelengthMin + (i / 299) * (wavelengthMax - wavelengthMin));
    const wn = wl.map((w) => 1e7 / w);
    const energy = wl.map((w) => 1240 / w);
    return [
      { name: "Wavenumber (cm⁻¹)", color: "#60a5fa", points: wl.map((x, i) => ({ x, y: wn[i] })) },
      { name: "Energy (eV)", color: "#34d399", dashed: true, points: wl.map((x, i) => ({ x, y: energy[i] })) },
    ];
  }, [wavelengthMin, wavelengthMax]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Wavenumber Converter" description="Convert wavelength, wavenumber, frequency, and energy with presets, sliders, and range sweeps.">
      <div className="mb-5 flex flex-wrap gap-2">
        {rangePresets.map((preset) => (
          <button key={preset.label} onClick={() => { setWavelengthMin(preset.min); setWavelengthMax(preset.max); }} className={`rounded-full border px-3 py-1 text-sm transition ${wavelengthMin === preset.min && wavelengthMax === preset.max ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="λ min" value={wavelengthMin} onChange={setWavelengthMin} min={100} max={50000} step={1} unit="nm" />
        <InputSlider label="λ max" value={wavelengthMax} onChange={setWavelengthMax} min={Math.max(101, wavelengthMin + 1)} max={50000} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Range (cm⁻¹)" value={`${wnMin.toFixed(1)} — ${wnMax.toFixed(1)}`} tone="blue" />
        <ResultCard label="Energy Range (eV)" value={`${(1240 / wavelengthMax).toFixed(3)} — ${(1240 / wavelengthMin).toFixed(3)}`} tone="green" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {singlePresets.map((preset) => (
            <button key={preset} onClick={() => { setSingleValue(preset); setMode("wl-to-wn"); }} className={`rounded-full border px-3 py-1 text-sm transition ${mode === "wl-to-wn" && singleValue === preset ? "border-yellow-400 bg-yellow-500/15 text-yellow-200" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"}`}>
              {preset} nm
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-end mb-4 flex-wrap">
          <div className="min-w-[220px] flex-1">
            <label className="text-sm text-gray-300">{mode === "wl-to-wn" ? "Wavelength (nm)" : "Wavenumber (cm⁻¹)"}</label>
            <input type="number" value={singleValue} onChange={e => setSingleValue(+e.target.value)} min={0.001} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <button onClick={() => setMode(mode === "wl-to-wn" ? "wn-to-wl" : "wl-to-wn")} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">⇄</button>
          <div className="min-w-[220px] flex-1 bg-gray-800 rounded px-3 py-2">
            <p className="text-sm text-gray-400">{mode === "wl-to-wn" ? "Wavenumber" : "Wavelength"}</p>
            <p className="text-lg font-bold text-yellow-400">{singleConverted.toFixed(2)} {mode === "wl-to-wn" ? "cm⁻¹" : "nm"}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">
          Freq: <span className="text-purple-400">{(mode === "wl-to-wn" ? 3e17 / singleValue : 3e10 * singleValue).toExponential(2)} Hz</span> | Energy: <span className="text-green-400">{(mode === "wl-to-wn" ? 1240 / singleValue : 1240 / singleConverted).toFixed(3)} eV</span>
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">ν̃ = 10⁷ / λ(nm)</span></p>
        <p><span className="text-green-400 font-mono">E = 1240 / λ(nm) eV</span></p>
        <p><span className="text-purple-400 font-mono">f = 3×10¹⁷ / λ(nm) Hz</span></p>
      </div>

      <SimpleLineChart title="Wavelength relationships" xLabel="Wavelength (nm)" yLabel="Value" yScale="log" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
