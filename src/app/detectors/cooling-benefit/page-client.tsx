"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
const kB = 8.617e-5;

export default function CoolingBenefitPage() {
  const [egSi, setEgSi] = useURLState("egSi", 1.12);
  const [egInGaAs, setEgInGaAs] = useURLState("egInGaAs", 0.75);
  const [darkCurrent25Si, setDarkCurrent25Si] = useURLState("darkCurrent25Si", 0.1);
  const [darkCurrent25InGaAs, setDarkCurrent25InGaAs] = useURLState("darkCurrent25InGaAs", 1000);
  const [readNoise, setReadNoise] = useURLState("readNoise", 3);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1);
  const [coolTemp, setCoolTemp] = useState(-40);

  // Generation-recombination (depletion region): I ∝ n_i ∝ T^1.5 · exp(-Eg/2kT) — used for Si
  const darkCurrentGen = (T_C: number, I0: number, Eg: number) => {
    const T = T_C + 273.15; const Tref = 298.15;
    return I0 * Math.pow(T / Tref, 1.5) * Math.exp(-Eg / (2 * kB * T)) / Math.exp(-Eg / (2 * kB * Tref));
  };
  // Diffusion-limited: I ∝ n_i² ∝ T^3 · exp(-Eg/kT) — used for InGaAs
  const darkCurrentDiff = (T_C: number, I0: number, Eg: number) => {
    const T = T_C + 273.15; const Tref = 298.15;
    return I0 * Math.pow(T / Tref, 3) * Math.exp(-Eg / (kB * T)) / Math.exp(-Eg / (kB * Tref));
  };

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => -100 + i * 140 / 300);
    const siDark = temps.map(T => darkCurrentGen(T, darkCurrent25Si, egSi));
    const inGaAsDark = temps.map(T => darkCurrentDiff(T, darkCurrent25InGaAs, egInGaAs));
    const siSNR = temps.map(T => { const d = darkCurrentGen(T, darkCurrent25Si, egSi) * exposureTime; return 1000 / Math.sqrt(1000 + d + readNoise * readNoise); });
    const inGaAsSNR = temps.map(T => { const d = darkCurrentDiff(T, darkCurrent25InGaAs, egInGaAs) * exposureTime; return 1000 / Math.sqrt(1000 + d + readNoise * readNoise); });
    return [
      { x: temps, y: siDark, type: "scatter" as const, mode: "lines" as const, name: "Si Dark", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: temps, y: inGaAsDark, type: "scatter" as const, mode: "lines" as const, name: "InGaAs Dark", line: { color: "#fb923c" }, yaxis: "y" },
      { x: temps, y: siSNR, type: "scatter" as const, mode: "lines" as const, name: "Si SNR", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
      { x: temps, y: inGaAsSNR, type: "scatter" as const, mode: "lines" as const, name: "InGaAs SNR", line: { color: "#fb923c", dash: "dash" }, yaxis: "y2" },
    ];
  }, [egSi, egInGaAs, darkCurrent25Si, darkCurrent25InGaAs, exposureTime, readNoise]);

  const siReduction = darkCurrent25Si / darkCurrentGen(coolTemp, darkCurrent25Si, egSi);
  const inGaAsReduction = darkCurrent25InGaAs / darkCurrentDiff(coolTemp, darkCurrent25InGaAs, egInGaAs);

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
        <ResultCard label={`Si Dark @ ${coolTemp}°C`} value={darkCurrentGen(coolTemp, darkCurrent25Si, egSi).toExponential(2) + " e⁻/s"} tone="green" />
        <ResultCard label={`InGaAs Dark @ ${coolTemp}°C`} value={darkCurrentDiff(coolTemp, darkCurrent25InGaAs, egInGaAs).toExponential(2) + " e⁻/s"} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>Si (generation-recombination): I ∝ T^(3/2) · exp(−E_g/2kT)</p><p>InGaAs (diffusion-limited): I ∝ T³ · exp(−E_g/kT)</p><p>SNR = S / √(S + I_dark·t + σ_read²)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (e⁻/s)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
