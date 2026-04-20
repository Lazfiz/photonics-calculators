"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function InterferometerPage() {
  const [armDiff, setArmDiff] = useURLState("armDiff", 10); // µm path difference
  const [wavelength, setWavelength] = useURLState("wavelength", 633); // nm
  const [reflectivity, setReflectivity] = useURLState("reflectivity", 0.9); // mirror R1
  const [reflectivity2, setReflectivity2] = useURLState("reflectivity2", 0.9); // mirror R2
  const [type, setType] = useState<"michelson" | "mz">("michelson");

  const calc = useMemo(() => {
    // Michelson: OPD = 2 × arm displacement (round trip)
    // Mach-Zehnder: OPD = arm length difference
    const opd_m = type === "michelson" ? 2 * armDiff * 1e-6 : armDiff * 1e-6;
    const delta = opd_m / (wavelength * 1e-9); // fringes
    const phase = (2 * Math.PI * delta) % (2 * Math.PI);
    // Visibility with unequal mirror reflectivities
    const V = 2 * Math.sqrt(reflectivity * reflectivity2) / (reflectivity + reflectivity2);
    const I = (1 + V * Math.cos(phase)) / 2; // normalized intensity
    return { delta, phase, V, I };
  }, [armDiff, wavelength, reflectivity]);

  const chartData = useMemo(() => {
    const deltas = Array.from({ length: 500 }, (_, i) => -2 + i * 0.008);
    const V = 2 * Math.sqrt(reflectivity * reflectivity2) / (reflectivity + reflectivity2);
    const intensities = deltas.map(d => {
      const opd = type === "michelson" ? 2 * d * wavelength / 1000 : d * wavelength / 1000; // µm
      const phi = 2 * Math.PI * opd * 1e-6 / (wavelength * 1e-9);
      return (1 + V * Math.cos(phi)) / 2;
    });
    const opd_um = type === "michelson" ? 2 * armDiff : armDiff;
    const currentI = (1 + V * Math.cos(2 * Math.PI * opd_um * 1e-6 / (wavelength * 1e-9))) / 2;

    return [
      { x: deltas.map(d => d * wavelength / 1000), y: intensities, type: "scatter" as const, mode: "lines" as const, name: "I(ΔL)", line: { color: "#60a5fa" } },
      { x: [armDiff], y: [currentI], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [armDiff, wavelength, reflectivity, calc]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Interferometer Visibility" description="Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Type</span>
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="michelson">Michelson</option>
            <option value="mz">Mach-Zehnder</option>
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} />
        <ValidatedNumberInput label="Path Difference ΔL (µm)" value={armDiff} onChange={setArmDiff} step="any" />
        <ValidatedNumberInput label="Mirror R₁" value={reflectivity} onChange={setReflectivity} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Mirror R₂" value={reflectivity2} onChange={setReflectivity2} min={0} max={1} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fringes</p>
          <p className="text-xl font-bold text-blue-400">{calc.delta.toFixed(2)} λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase</p>
          <p className="text-xl font-bold text-yellow-400">{((calc.phase * 180 / Math.PI + 360) % 360).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Visibility V</p>
          <p className="text-xl font-bold text-green-400">{(calc.V * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Normalized I</p>
          <p className="text-xl font-bold text-red-400">{(calc.I * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Path Difference (µm)", gridcolor: "#374151" },
          yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [0, 1.1] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
