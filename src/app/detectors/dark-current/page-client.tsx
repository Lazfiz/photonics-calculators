"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DarkCurrentPage() {
  const [darkCurrent25, setDarkCurrent25] = useURLState("darkCurrent25", 0.1);
  const [tempFactor, setTempFactor] = useURLState("tempFactor", 6);
  const [tempMin, setTempMin] = useState(-80);
  const [tempMax, setTempMax] = useURLState("tempMax", 40);
  const [readNoise, setReadNoise] = useURLState("readNoise", 5);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1);

  const darkCurrentAtT = (T: number) => darkCurrent25 * Math.pow(2, (T - 25) / tempFactor);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    return [
      { x: temps, y: temps.map(darkCurrentAtT), type: "scatter" as const, mode: "lines" as const, name: "Dark Current", line: { color: "#f87171" }, yaxis: "y" },
      { x: temps, y: temps.map(T => darkCurrentAtT(T) * exposureTime), type: "scatter" as const, mode: "lines" as const, name: "Dark e⁻ (exposure)", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: temps, y: temps.map(T => Math.sqrt(darkCurrentAtT(T) * exposureTime)), type: "scatter" as const, mode: "lines" as const, name: "Shot Noise", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
      { x: [tempMin, tempMax], y: [readNoise, readNoise], type: "scatter" as const, mode: "lines" as const, name: "Read Noise", line: { color: "#fbbf24", dash: "dot" }, yaxis: "y2" },
    ];
  }, [darkCurrent25, tempFactor, tempMin, tempMax, exposureTime, readNoise]);

  const crossoverTemp = 25 + tempFactor * Math.log2(readNoise * readNoise / (darkCurrent25 * exposureTime));
  const dcAtMin = darkCurrentAtT(tempMin);
  const dcAtMax = darkCurrentAtT(tempMax);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Dark Current vs Temperature" description="Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ · 2^((T−T₀)/T_d).">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Dark Current at 25°C (e⁻/pix/s)" value={darkCurrent25} onChange={setDarkCurrent25} min={0.001} step="0.01" />
        <ValidatedNumberInput label="Doubling Temperature (°C)" value={tempFactor} onChange={setTempFactor} min={3} max={12} step="0.5" />
        <ValidatedNumberInput label="Read Noise (e⁻)" value={readNoise} onChange={setReadNoise} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Dark @ ${tempMin}°C`} value={dcAtMin.toExponential(2) + " e⁻/s"} tone="blue" />
        <ResultCard label={`Dark @ ${tempMax}°C`} value={dcAtMax.toExponential(2) + " e⁻/s"} tone="red" />
        <ResultCard label={`Ratio (${tempMax}/${tempMin}°C)`} value={`×${(dcAtMax / dcAtMin).toExponential(1)}`} tone="yellow" />
        <ResultCard label="Noise Crossover" value={isFinite(crossoverTemp) && crossoverTemp >= tempMin && crossoverTemp <= tempMax ? `${crossoverTemp.toFixed(1)}°C` : "Outside range"} tone="purple" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>I_dark(T) = I₀ · 2^((T − T₀) / T_d)</p><p>σ_dark = √(I_dark · t_exp)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (e⁻/pix/s)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Electrons (e⁻)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" } }} />
    </CalculatorShell>
  );
}
