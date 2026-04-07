"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AttosecondPulsePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm, driving laser
  const [duration, setDuration] = useURLState("duration", 5); // fs, driving pulse
  const [intensity, setIntensity] = useURLState("intensity", 2e14); // W/cm²
  const [cutoffOrder, setCutoffOrder] = useURLState("cutoffOrder", 50);

  const photonEnergy = 1240 / wavelength; // eV
  const cutoffEnergy = 3.17 * photonEnergy + 0; // Up = Ip negligible for display
  const up = 9.33e-14 * intensity * Math.pow(wavelength * 1e-9, 2); // ponderomotive in eV (approx)
  const cutoffE = 3.17 * up + 13.6; // Ip of H
  const shortestWavelength = 1240 / cutoffE; // nm
  const minPulseDuration = 0.122 / cutoffE * 1000; // time-bandwidth limit in as (approx)

  const chartData = useMemo(() => {
    const harmonics = Array.from({ length: 100 }, (_, i) => i + 1);
    const spectrum = harmonics.map(q => {
      if (q < 3) return 0;
      const decay = Math.exp(-(q - 3) / 15);
      const cutoff = q < cutoffOrder ? 1 : Math.exp(-Math.pow(q - cutoffOrder, 2) / 20);
      return decay * cutoff;
    });
    return [
      { x: harmonics, y: spectrum, type: "scatter" as const, mode: "lines" as const, name: "HHG Spectrum", line: { color: "#60a5fa", width: 2 } },
      { x: [cutoffOrder, cutoffOrder], y: [0, Math.max(...spectrum)], type: "scatter" as const, mode: "lines" as const, name: "Cutoff", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [cutoffOrder]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Attosecond Pulse Generation" description="High-harmonic generation and isolated attosecond pulse parameters.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Driving Wavelength λ (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Pulse Duration (fs)" value={duration} onChange={setDuration} step="any" />
        <ValidatedNumberInput label="Peak Intensity (W/cm²)" value={intensity} onChange={setIntensity} step="any" />
        <ValidatedNumberInput label="Cutoff Harmonic Order" value={cutoffOrder} onChange={setCutoffOrder} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cutoff Energy (Ip + 3.17 Up)</p>
          <p className="text-xl font-bold text-blue-400">{cutoffE.toFixed(1)} eV</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shortest Wavelength</p>
          <p className="text-xl font-bold text-green-400">{shortestWavelength.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Photon Energy (fundamental)</p>
          <p className="text-xl font-bold text-orange-400">{photonEnergy.toFixed(3)} eV</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min Pulse Duration (TL)</p>
          <p className="text-xl font-bold text-purple-400">{minPulseDuration.toFixed(1)} as</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">E<sub>cutoff</sub> = I<sub>p</sub> + 3.17 · U<sub>p</sub> &nbsp;|&nbsp; U<sub>p</sub> = e²E₀²/(4mω²) &nbsp;|&nbsp; τ<sub>min</sub> ≈ 0.122/E<sub>cutoff</sub></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Harmonic Order q", gridcolor: "#374151" },
          yaxis: { title: "Relative Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
