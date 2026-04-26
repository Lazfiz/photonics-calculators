"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { calculateGeigerMode } from "../../../lib/geiger-mode-avalanche";
export default function GeigerModeAPDPage() {
  const [overbias, setOverbias] = useURLState("overbias", 2);
  const [temperature, setTemperature] = useURLState("temperature", 25);
  const [tempCoeff, setTempCoeff] = useURLState("tempCoeff", 50);
  const [deadTime, setDeadTime] = useURLState("deadTime", 100);
  const [darkCountRate, setDarkCountRate] = useURLState("darkCountRate", 1000);

  const results = useMemo(
    () => calculateGeigerMode({ overbias, temperature, tempCoeff, deadTime, darkCountRate }),
    [overbias, temperature, tempCoeff, deadTime, darkCountRate],
  );

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => -40 + i * 1.5);
    return [
      { x: temps, y: temps.map(t => tempCoeff * 1e-3 * (t - 25)), type: "scatter", mode: "lines", name: "Vbr shift (V)", line: { color: "#f87171" } },
      { x: temps, y: temps.map(t => { const eo = overbias - tempCoeff * 1e-3 * (t - 25); return eo <= 0 ? 0 : Math.min(0.75, 0.15 * eo); }), type: "scatter", mode: "lines", name: "PDE", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: temps, y: temps.map(t => { const eo = overbias - tempCoeff * 1e-3 * (t - 25); return eo <= 0 ? 0 : darkCountRate * Math.pow(2, (t - 25) / 10) * (eo / overbias); }), type: "scatter", mode: "lines", name: "DCR", line: { color: "#a78bfa" }, yaxis: "y3" },
    ];
  }, [overbias, tempCoeff, darkCountRate]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Geiger-Mode APD" description="SPAD: breakdown voltage, overbias, temperature effects, PDE, and dark count rate.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Overbias (V)" value={overbias} onChange={setOverbias} step="0.1" />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} />
        <ValidatedNumberInput label="Vbr Temp Coeff (mV/°C)" value={tempCoeff} onChange={setTempCoeff} />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTime} onChange={setDeadTime} />
        <ValidatedNumberInput label="DCR @25°C (cps)" value={darkCountRate} onChange={setDarkCountRate} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Vbr Shift" value={`${results.bvShift.toFixed(2)} V`} tone="red" />
        <ResultCard label="Eff. Overbias" value={`${results.effectiveOverbias.toFixed(2)} V`} tone="blue" />
        <ResultCard label="PDE" value={`${(results.pde * 100).toFixed(1)}%`} tone="green" />
        <ResultCard label="Max Count Rate" value={`${(results.maxCountRate / 1e6).toFixed(1)} Mcps`} tone="yellow" />
        <ResultCard label="Eff. DCR" value={results.effectiveDCR.toExponential(2) + " cps"} tone="purple" />
        <ResultCard label="Afterpulse ≈" value={results.afterpulseRate.toExponential(2) + " cps"} tone="orange" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>ΔVbr = β·(T−Tref)</p><p>PDE ≈ 0.15·V_over(eff), PDE=0 at breakdown</p><p>R_max = 1/τ_dead, DCR(T) = DCR₀·2^((T−25)/10)·(Veff/Vref)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Vbr Shift (V)", gridcolor: "#374151" }, yaxis2: { title: "PDE", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 1] }, yaxis3: { title: "DCR (cps)", type: "log", gridcolor: "#374151", overlaying: "y", side: "right", anchor: "free", position: 0.95 } }} />
    </CalculatorShell>
  );
}
