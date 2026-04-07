"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function WellCapacityPage() {
  const [wellCapacity, setWellCapacity] = useURLState("wellCapacity", 50000); // e-
  const [readNoise, setReadNoise] = useURLState("readNoise", 5); // e- rms
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 5); // μm
  const [voltageSwing, setVoltageSwing] = useURLState("voltageSwing", 1.5); // V

  const chartData = useMemo(() => {
    const wells = Array.from({ length: 200 }, (_, i) => 1000 + (i / 200) * 199000);
    const dr = wells.map(w => 20 * Math.log10(w / readNoise));
    const capacitance = wells.map(w => (w * 1.6e-19) / voltageSwing);
    return [
      { x: wells, y: dr, type: "scatter" as const, mode: "lines" as const, name: "Dynamic range (dB)", line: { color: "#f87171" }, yaxis: "y" },
      { x: wells, y: capacitance, type: "scatter" as const, mode: "lines" as const, name: "Capacitance (F)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [wellCapacity, readNoise, pixelSize, voltageSwing]);

  const dynamicRange = 20 * Math.log10(wellCapacity / readNoise);
  const capacitance = (wellCapacity * 1.6e-19) / voltageSwing;
  const fullWellElectronsPerArea = wellCapacity / (pixelSize * pixelSize);
  const minDetectable = 3 * readNoise;
  const usableBits = Math.log2(wellCapacity / readNoise);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Well Capacity & Dynamic Range" description="DR = 20·log₁₀(Nwell/σread). C = Nwell·q/Vswing. Larger wells → more DR but slower charge transfer.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Well capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} step="1000" />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} step="1" />
        <ValidatedNumberInput label="Pixel size (μm)" value={pixelSize} onChange={setPixelSize} step="0.5" />
        <ValidatedNumberInput label="Voltage swing (V)" value={voltageSwing} onChange={setVoltageSwing} step="0.1" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{dynamicRange.toFixed(1)} dB</span></p>
        <p className="text-gray-300">Pixel capacitance = <span className="text-blue-400 font-mono">{(capacitance * 1e15).toFixed(2)} fF</span></p>
        <p className="text-gray-300">Full well density = <span className="text-blue-400 font-mono">{fullWellElectronsPerArea.toFixed(0)} e⁻/μm²</span></p>
        <p className="text-gray-300">Usable bits = <span className="text-blue-400 font-mono">{usableBits.toFixed(1)} bits</span></p>
        <p className="text-gray-300">Min detectable (3σ) = <span className="text-blue-400 font-mono">{minDetectable} e⁻</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Well capacity (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Dynamic range (dB)", gridcolor: "#374151" },
        yaxis2: { title: "Capacitance (F)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 70 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
