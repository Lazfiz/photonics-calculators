"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function WaveplateOrderPage() {
  const [wavelength, setWavelength] = useState(550); // nm
  const [birefringence, setBirefringence] = useState(0.009); // Δn
  const [thickness, setThickness] = useState(100); // μm

  const results = useMemo(() => {
    const ret = birefringence * thickness * 1e3; // nm retardation
    const phase = (2 * Math.PI * ret) / wavelength; // radians
    const order = ret / wavelength; // fractional order
    const integerOrder = Math.floor(order);
    const fractionalOrder = order - integerOrder;
    const orderType = integerOrder === 0 ? "Zero-order" : integerOrder === 1 ? "First-order" : `${integerOrder}-th order`;
    const waveplateType = Math.abs(fractionalOrder - 0.5) < 0.01 ? "Half-wave (λ/2)" : Math.abs(fractionalOrder - 0.25) < 0.01 ? "Quarter-wave (λ/4)" : "Other";

    // Transmission vs wavelength (for waveplate between crossed polarizers)
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 4);
    const transmission = wls.map((wl) => {
      const r = birefringence * thickness * 1e3;
      const ph = (2 * Math.PI * r) / wl;
      return Math.pow(Math.sin(ph / 2), 2); // crossed polarizer transmission
    });

    // Phase vs wavelength
    const phaseVsWl = wls.map((wl) => ((birefringence * thickness * 1e3 / wl) * 360) % 360);

    return { ret, phase, order, integerOrder, fractionalOrder, orderType, waveplateType, wls, transmission, phaseVsWl };
  }, [wavelength, birefringence, thickness]);

  // Calculate required thickness for specific waveplate types
  const thicknessFor = useMemo(() => {
    const qwp = (wavelength / 4) / (birefringence * 1e3); // mm
    const hwp = (wavelength / 2) / (birefringence * 1e3);
    return { qwp, hwp };
  }, [wavelength, birefringence]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Waveplate Order" description="Calculate waveplate order, retardation, and wavelength-dependent performance.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Birefringence Δn", val: birefringence, set: setBirefringence },
            { label: "Thickness (μm)", val: thickness, set: setThickness },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Retardation" value={`${results.ret.toFixed(2)} nm`} />
            <ResultRow label="Phase Retardation" value={`${results.phase.toFixed(2)} rad (${(results.phase * 180 / Math.PI).toFixed(1)}°)`} />
            <ResultRow label="Order (Γ/λ)" value={results.order.toFixed(4)} />
            <ResultRow label="Integer Order" value={results.integerOrder.toString()} />
            <ResultRow label="Fractional Order" value={results.fractionalOrder.toFixed(4)} />
            <ResultRow label="Order Type" value={results.orderType} />
            <ResultRow label="Waveplate Type" value={results.waveplateType} />
            <ResultRow label="QWP Thickness" value={`${(thicknessFor.qwp * 1e6).toFixed(1)} μm`} />
            <ResultRow label="HWP Thickness" value={`${(thicknessFor.hwp * 1e6).toFixed(1)} μm`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Transmission Between Crossed Polarizers</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.wls, y: results.transmission, line: { color: "#3b82f6", width: 2 }, fill: "tozeroy", fillcolor: "rgba(59,130,246,0.1)" }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Transmission", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.05] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Phase Retardation vs Wavelength</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.wls, y: results.phaseVsWl, line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Phase (°)", color: "#9ca3af", gridcolor: "#374151", range: [0, 360] },
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
