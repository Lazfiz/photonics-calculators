"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

const kB = 8.617e-5;

export default function CoolingBenefitPage() {
  const [egSi, setEgSi] = useState(1.12);
  const [egInGaAs, setEgInGaAs] = useState(0.75);
  const [darkCurrent25Si, setDarkCurrent25Si] = useState(0.1);
  const [darkCurrent25InGaAs, setDarkCurrent25InGaAs] = useState(1000);
  const [readNoise, setReadNoise] = useState(3);
  const [exposureTime, setExposureTime] = useState(1);
  const [coolTemp, setCoolTemp] = useState(-40);

  const darkCurrentAtT = (T_C: number, I0: number, Eg: number) => {
    const T = T_C + 273.15; const Tref = 298.15;
    return I0 * Math.pow(T / Tref, 1.5) * Math.exp(-Eg / (2 * kB * T)) / Math.exp(-Eg / (2 * kB * Tref));
  };

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => -100 + i * 140 / 300);
    const siDark = temps.map(T => darkCurrentAtT(T, darkCurrent25Si, egSi));
    const inGaAsDark = temps.map(T => darkCurrentAtT(T, darkCurrent25InGaAs, egInGaAs));
    const siSNR = temps.map(T => { const d = darkCurrentAtT(T, darkCurrent25Si, egSi) * exposureTime; return 1000 / Math.sqrt(1000 + d + readNoise * readNoise); });
    const inGaAsSNR = temps.map(T => { const d = darkCurrentAtT(T, darkCurrent25InGaAs, egInGaAs) * exposureTime; return 1000 / Math.sqrt(1000 + d + readNoise * readNoise); });
    return [
      { x: temps, y: siDark, type: "scatter" as const, mode: "lines" as const, name: "Si Dark", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: temps, y: inGaAsDark, type: "scatter" as const, mode: "lines" as const, name: "InGaAs Dark", line: { color: "#fb923c" }, yaxis: "y" },
      { x: temps, y: siSNR, type: "scatter" as const, mode: "lines" as const, name: "Si SNR", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
      { x: temps, y: inGaAsSNR, type: "scatter" as const, mode: "lines" as const, name: "InGaAs SNR", line: { color: "#fb923c", dash: "dash" }, yaxis: "y2" },
    ];
  }, [egSi, egInGaAs, darkCurrent25Si, darkCurrent25InGaAs, exposureTime, readNoise]);

  const siReduction = darkCurrent25Si / darkCurrentAtT(coolTemp, darkCurrent25Si, egSi);
  const inGaAsReduction = darkCurrent25InGaAs / darkCurrentAtT(coolTemp, darkCurrent25InGaAs, egInGaAs);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Cooling Benefit Calculator" description="Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Si Bandgap (eV)" value={egSi} onChange={setEgSi} min={0.5} max={2} step="0.01" />
        <ValidatedNumberInput label="InGaAs Bandgap (eV)" value={egInGaAs} onChange={setEgInGaAs} min={0.3} max={1.5} step="0.01" />
        <ValidatedNumberInput label="Si Dark @ 25°C (e⁻/s)" value={darkCurrent25Si} onChange={setDarkCurrent25Si} min={0.001} step="0.01" />
        <ValidatedNumberInput label="InGaAs Dark @ 25°C (e⁻/s)" value={darkCurrent25InGaAs} onChange={setDarkCurrent25InGaAs} min={1} step="10" />
        <ValidatedNumberInput label="Read Noise (e⁻)" value={readNoise} onChange={setReadNoise} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Cooling Target (°C)" value={coolTemp} onChange={setCoolTemp} min={-150} step="5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Si Dark Reduction" value={`×${siReduction.toExponential(1)}`} tone="blue" />
        <ResultCard label="InGaAs Dark Reduction" value={`×${inGaAsReduction.toExponential(1)}`} tone="orange" />
        <ResultCard label={`Si Dark @ ${coolTemp}°C`} value={darkCurrentAtT(coolTemp, darkCurrent25Si, egSi).toExponential(2) + " e⁻/s"} tone="green" />
        <ResultCard label={`InGaAs Dark @ ${coolTemp}°C`} value={darkCurrentAtT(coolTemp, darkCurrent25InGaAs, egInGaAs).toExponential(2) + " e⁻/s"} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>I_dark(T) = I₀ · (T/T₀)^(3/2) · exp(−E_g/(2k_B·T))</p><p>SNR = S / √(S + I_dark·t + σ_read²)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (e⁻/pix/s)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
