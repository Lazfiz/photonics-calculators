"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import { useURLState } from "../../../hooks/use-url-state";
import { photonsPerJoule, responsivity as responsivityAW } from "../../../physics/detectors/responsivity";

const wavelengthPresets = [405, 532, 850, 1310, 1550];
const qePresets = [0.2, 0.5, 0.8, 0.95];
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function ResponsivityPage() {
  const [qeRaw, setQuantumEfficiency] = useURLState("quantumEfficiency", 0.8);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550);
  const quantumEfficiency = clamp(qeRaw, 0, 1, 0.8);
  const wavelength = clamp(wavelengthRaw, 200, 2000, 1550);

  const responsivity = responsivityAW(quantumEfficiency, wavelength * 1e-9);
  const photonsPerWatt = photonsPerJoule(wavelength * 1e-9);
  const photocurrentAt1mW_uA = responsivity * 1e-3 * 1e6;
  const idealResponsivity = responsivityAW(1, wavelength * 1e-9);

  const wls = Array.from({ length: 250 }, (_, i) => 200 + i * 7.3);
  const chartSeries = [
    { name: `η = ${quantumEfficiency}`, color: "#60a5fa", points: wls.map((x) => ({ x, y: responsivityAW(quantumEfficiency, x * 1e-9) })) },
    { name: "η = 1 (limit)", color: "#9ca3af", points: wls.map((x) => ({ x, y: responsivityAW(1, x * 1e-9) })) },
    { name: "Current point", color: "#22c55e", showPoints: true, points: [{ x: wavelength, y: responsivity }] },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={`w-${preset}`} onClick={() => setWavelength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} nm</button>
        ))}
        {qePresets.map((preset) => (
          <button key={`q-${preset}`} onClick={() => setQuantumEfficiency(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${quantumEfficiency === preset ? "border-green-400 bg-green-500/15 text-green-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>QE {preset}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Quantum efficiency" value={qeRaw} onChange={setQuantumEfficiency} min={0} max={1} step={0.01} />
        <InputSlider label="Wavelength" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${fmt(responsivity, 4)} A/W`} tone="blue" subtext={`η = 1 limit ${fmt(idealResponsivity, 4)} A/W`} />
        <ResultCard label="Photons per watt" value={Number.isFinite(photonsPerWatt) ? `${photonsPerWatt.toExponential(3)} /s` : "—"} tone="green" />
        <ResultCard label="Current @ 1 mW" value={`${fmt(photocurrentAt1mW_uA, 1)} µA`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>ℛ = η·q·λ / (h·c) = η · λ[µm] / 1.23984 A/W</p>
        <p>
          At fixed quantum efficiency the responsivity rises linearly with wavelength, because each watt carries more
          photons. Without internal gain η ≤ 1, so a datasheet responsivity above the η = 1 line is impossible for a PIN
          photodiode. Real detectors have η(λ) that falls at short and long wavelengths; see the spectral-response page.
        </p>
      </div>

      <SimpleLineChart title="Responsivity vs wavelength" xLabel="Wavelength (nm)" yLabel="Responsivity (A/W)" series={chartSeries} />
    </>
  );
}
