"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GeigerModeAPDPage() {
  const [breakdownVoltage, setBreakdownVoltage] = useState(150); // V
  const [overbias, setOverbias] = useState(2); // V above breakdown
  const [temperature, setTemperature] = useState(25); // °C
  const [tempCoeff, setTempCoeff] = useState(50); // mV/°C
  const [deadTime, setDeadTime] = useState(100); // ns
  const [darkCountRate, setDarkCountRate] = useState(1000); // counts/s

  const results = useMemo(() => {
    const bvShift = tempCoeff * 1e-3 * (temperature - 25);
    const effectiveOverbias = overbias - bvShift;
    const pde = Math.min(0.75, 0.3 + 0.15 * effectiveOverbias); // simplified PDE model
    const dt = deadTime * 1e-9;
    const maxCountRate = 1 / dt;
    const dcrTempFactor = Math.pow(2, (temperature - 25) / 10); // doubles per 10°C
    const effectiveDCR = darkCountRate * dcrTempFactor;
    const afterpulseRate = effectiveDCR * 0.02;
    return { bvShift, effectiveOverbias, pde, maxCountRate, effectiveDCR, afterpulseRate, dcrTempFactor };
  }, [breakdownVoltage, overbias, temperature, tempCoeff, deadTime, darkCountRate]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => -40 + i * 1.5);
    const bvShifts = temps.map(t => tempCoeff * 1e-3 * (t - 25));
    const effectiveOB = temps.map(t => overbias - tempCoeff * 1e-3 * (t - 25));
    const dcr = temps.map(t => darkCountRate * Math.pow(2, (t - 25) / 10));
    const pde = effectiveOB.map(ob => Math.min(0.75, 0.3 + 0.15 * ob));
    return [
      { x: temps, y: bvShifts, type: "scatter", mode: "lines", name: "Vbr shift (V)", line: { color: "#f87171" } },
      { x: temps, y: pde, type: "scatter", mode: "lines", name: "PDE", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: temps, y: dcr, type: "scatter", mode: "lines", name: "Dark count rate", line: { color: "#a78bfa" }, yaxis: "y3" },
    ];
  }, [overbias, tempCoeff, darkCountRate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Geiger-Mode APD</h1>
      <p className="text-gray-400 mb-8">Geiger-mode avalanche photodiode calculator. Models breakdown voltage, overbias, temperature effects, PDE, and dark count rate.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Breakdown Voltage (V)</span>
          <input type="number" value={breakdownVoltage} onChange={e => setBreakdownVoltage(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Overbias (V)</span>
          <input type="number" value={overbias} onChange={e => setOverbias(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Temperature (°C)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Vbr Temp Coefficient (mV/°C)</span>
          <input type="number" value={tempCoeff} onChange={e => setTempCoeff(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dead Time (ns)</span>
          <input type="number" value={deadTime} onChange={e => setDeadTime(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dark Count Rate @25°C (counts/s)</span>
          <input type="number" value={darkCountRate} onChange={e => setDarkCountRate(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Vbr shift from 25°C = <span className="text-blue-400 font-mono">{results.bvShift.toFixed(2)} V</span></p>
        <p className="text-gray-300">Effective overbias = <span className="text-blue-400 font-mono">{results.effectiveOverbias.toFixed(2)} V</span></p>
        <p className="text-gray-300">Estimated PDE = <span className="text-blue-400 font-mono">{(results.pde * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">Max count rate = <span className="text-blue-400 font-mono">{(results.maxCountRate / 1e6).toFixed(1)} Mcps</span></p>
        <p className="text-gray-300">Effective DCR = <span className="text-blue-400 font-mono">{results.effectiveDCR.toExponential(2)} counts/s</span></p>
        <p className="text-gray-300">Afterpulse contribution ≈ <span className="text-blue-400 font-mono">{results.afterpulseRate.toExponential(2)} counts/s</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>ΔV<sub>br</sub> = k<sub>T</sub> · (T - T<sub>ref</sub>)</p>
        <p>V<sub>over</sub>(eff) = V<sub>over</sub> - ΔV<sub>br</sub></p>
        <p>R<sub>max</sub> = 1 / τ<sub>dead</sub></p>
        <p>DCR(T) = DCR<sub>25</sub> · 2^((T-25)/10)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Vbr Shift (V)", gridcolor: "#374151" },
        yaxis2: { title: "PDE", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 1] },
        yaxis3: { title: "DCR (counts/s)", type: "log", gridcolor: "#374151", overlaying: "y", side: "right", anchor: "free", position: 0.95 },
        margin: { t: 20, b: 40, l: 70, r: 120 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
