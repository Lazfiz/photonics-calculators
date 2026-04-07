"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function ExtinctionRatioPage() {
  const [erdB, setErdB] = useState(30);
  const [inputPower, setInputPower] = useState(1); // mW
  const [numPolarizers, setNumPolarizers] = useState(1);

  const results = useMemo(() => {
    const ratio = Math.pow(10, erdB / 10);
    const transmittedPower = inputPower / ratio;
    const rejectedPower = inputPower - transmittedPower;
    const tLinear = 1 / Math.sqrt(ratio); // amplitude transmission
    const malusMax = 1; // aligned
    const malusCross = 1 / ratio; // crossed

    // Cascaded polarizers
    const totalER = numPolarizers > 1 ? erdB * numPolarizers : erdB;
    const cascadedRatio = Math.pow(10, totalER / 10);
    const cascadedTransmission = 1 / Math.sqrt(cascadedRatio);

    // Malus's law: I = I0 * cos²(θ)
    const angles = Array.from({ length: 91 }, (_, i) => i);
    const transmitted = angles.map((a) => inputPower * Math.pow(Math.cos((a * Math.PI) / 180), 2));
    const rejected = angles.map((a) => inputPower - transmitted[a]);

    // ER vs wavelength (typical crystal polarizer)
    const wavelengths = Array.from({ length: 100 }, (_, i) => 400 + i * 3);
    const erVsWavelength = wavelengths.map((wl) => {
      // Simple model: ER peaks at design wavelength
      const center = 650;
      const width = 200;
      const variation = 5 * Math.exp(-Math.pow(wl - center, 2) / (2 * width * width));
      return erdB - variation;
    });

    return { ratio, transmittedPower, rejectedPower, tLinear, malusMax, malusCross, totalER, cascadedTransmission, angles, transmitted, rejected, wavelengths, erVsWavelength };
  }, [erdB, inputPower, numPolarizers]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Extinction Ratio" description="Calculate polarizer extinction ratio, transmission, and cascaded performance.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Extinction Ratio (dB)", val: erdB, set: setErdB, min: 0, max: 80 },
            { label: "Input Power (mW)", val: inputPower, set: setInputPower, min: 0.001, max: 10000 },
            { label: "Number of Cascaded Polarizers", val: numPolarizers, set: setNumPolarizers, min: 1, max: 10 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step={label.includes("Number") ? 1 : 0.1} min={min} max={max} value={val} onChange={(e) => set(parseFloat(e.target.value) || min)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Extinction Ratio (linear)" value={results.ratio.toExponential(3)} />
            <ResultRow label="Transmitted Power (crossed)" value={`${results.transmittedPower.toExponential(3)} mW`} />
            <ResultRow label="Rejected Power" value={`${results.rejectedPower.toFixed(6)} mW`} />
            <ResultRow label="Amplitude Transmission" value={results.tLinear.toFixed(6)} />
            <ResultRow label="Cascaded Total ER" value={`${results.totalER.toFixed(1)} dB`} />
            <ResultRow label="Cascaded Amplitude Trans." value={results.cascadedTransmission.toFixed(6)} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Malus&apos;s Law: Transmission vs Angle</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.angles, y: results.transmitted, name: "Transmitted", line: { color: "#3b82f6" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.angles, y: results.rejected, name: "Rejected", line: { color: "#ef4444" } },
            ]}
            layout={{
              xaxis: { title: "Angle (°)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Power (mW)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">ER vs Wavelength (typical crystal polarizer)</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.erVsWavelength, line: { color: "#22c55e" } }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Extinction Ratio (dB)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
