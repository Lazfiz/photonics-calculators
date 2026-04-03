"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function GainTemperaturePage() {
  const [gainRef, setGainRef] = useState(100);
  const [tempRef, setTempRef] = useState(25);
  const [tempCoeff, setTempCoeff] = useState(0.003);
  const [tempMin, setTempMin] = useState(-40);
  const [tempMax, setTempMax] = useState(80);
  const [detectorType, setDetectorType] = useState<"apd" | "pmt">("apd");
  const [pmtCoeff, setPmtCoeff] = useState(-0.003);

  const gainAtT = (T: number) => detectorType === "apd" ? gainRef / (1 + tempCoeff * (T - tempRef)) : gainRef * Math.exp(pmtCoeff * (T - tempRef));

  const gainAtMin = gainAtT(tempMin);
  const gainAtMax = gainAtT(tempMax);
  const gainVariation = gainAtMax / gainAtMin;

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    return [
      { x: temps, y: temps.map(gainAtT), type: "scatter", mode: "lines", name: "Gain", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: temps, y: temps.map(T => 20 * Math.log10(gainAtT(T))), type: "scatter", mode: "lines", name: "Gain (dB)", line: { color: "#fbbf24", width: 2, dash: "dash" }, yaxis: "y2" },
    ];
  }, [detectorType, gainRef, tempCoeff, pmtCoeff, tempRef, tempMin, tempMax]);

  const stabilityChart = useMemo(() => {
    const deltaT = Array.from({ length: 100 }, (_, i) => -20 + i * 40 / 100);
    return [{ x: deltaT, y: deltaT.map(dT => detectorType === "apd" ? ((gainRef / (1 + tempCoeff * dT) - gainRef) / gainRef) * 100 : (Math.exp(pmtCoeff * dT) - 1) * 100), type: "scatter", mode: "lines", name: "Gain Change (%)", line: { color: "#f87171", width: 2 } }];
  }, [detectorType, gainRef, tempCoeff, pmtCoeff]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Gain vs Temperature" description="Temperature dependence of detector gain for APDs and PMTs." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4"><label className="block text-sm text-gray-300">Detector Type</label><select value={detectorType} onChange={e => setDetectorType(e.target.value as any)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"><option value="apd">APD</option><option value="pmt">PMT</option></select></div>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Gain at {tempRef}°C</span><input type="number" value={gainRef} onChange={e => setGainRef(+e.target.value)} min="1" step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        {detectorType === "apd" ? (
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">APD Temp Coeff (/°C)</span><input type="number" value={tempCoeff} onChange={e => setTempCoeff(+e.target.value)} min="0.0001" max="0.02" step="0.001" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        ) : (
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">PMT Temp Coeff (%/°C)</span><input type="number" value={pmtCoeff * 100} onChange={e => setPmtCoeff(+e.target.value / 100)} min="-2" max="0" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        )}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4"><label className="block text-sm text-gray-300">Temp Range (°C)</label><div className="flex gap-2 mt-3"><input type="number" value={tempMin} onChange={e => setTempMin(+e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /><input type="number" value={tempMax} onChange={e => setTempMax(+e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Gain @ ${tempMin}°C`} value={gainAtMin.toFixed(1)} tone="blue" />
        <ResultCard label={`Gain @ ${tempMax}°C`} value={gainAtMax.toFixed(1)} tone="red" />
        <ResultCard label="Gain Ratio" value={`×${gainVariation.toFixed(3)}`} tone="yellow" />
        <ResultCard label="Temp Stability" value={detectorType === "apd" ? `±${(tempCoeff * 100).toFixed(1)}%/°C` : `${(pmtCoeff * 100).toFixed(1)}%/°C`} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>APD: M(T) = M_ref / (1 + α·ΔT)</p><p>PMT: M(T) = M₀ · exp(β·ΔT)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Gain", gridcolor: "#374151" }, yaxis2: { title: "Gain (dB)", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
      <ChartPanel data={stabilityChart} layout={{ xaxis: { title: "ΔT from Reference (°C)", gridcolor: "#374151" }, yaxis: { title: "Gain Change (%)", gridcolor: "#374151" } }} title="Gain Change vs ΔT" />
    </CalculatorShell>
  );
}
