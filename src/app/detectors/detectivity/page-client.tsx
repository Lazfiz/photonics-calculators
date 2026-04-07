"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
const h = 6.626e-34, c = 3e8, q = 1.602e-19, kB = 1.381e-23;

export default function DetectivityPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 850);
  const [qe, setQe] = useURLState("qe", 0.7);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 1);
  const [area, setArea] = useURLState("area", 1);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 1);
  const [temperature, setTemperature] = useURLState("temperature", 293);
  const [loadResistance, setLoadResistance] = useURLState("loadResistance", 50);
  const [excessNoiseFactor, setExcessNoiseFactor] = useURLState("excessNoiseFactor", 1);

  const lambda = wavelength * 1e-9;
  const responsivity = qe * lambda * q / (h * c);
  const areaM2 = area * 1e-6;
  const shotNoiseDark = Math.sqrt(2 * q * darkCurrent * 1e-9 * excessNoiseFactor * bandwidth * 1e6);
  const thermalNoise = Math.sqrt(4 * kB * temperature * bandwidth * 1e6 / loadResistance);
  const totalNoise = Math.sqrt(shotNoiseDark ** 2 + thermalNoise ** 2);
  const nep = totalNoise / responsivity;
  const detectivity = Math.sqrt(areaM2 * bandwidth * 1e6) / nep;

  const spectralChart = useMemo(() => {
    const wl = Array.from({ length: 200 }, (_, i) => 400 + i * 1.2);
    return [{ x: wl, y: wl.map(w => { const R = qe * w * 1e-9 * q / (h * c); return R > 1e-10 ? Math.sqrt(areaM2 * bandwidth * 1e6) / (totalNoise / R) : 0; }), type: "scatter", mode: "lines", name: "D*", line: { color: "#60a5fa", width: 2 } }];
  }, [qe, darkCurrent, area, bandwidth, temperature, loadResistance, excessNoiseFactor, shotNoiseDark, thermalNoise, areaM2, totalNoise]);

  const tempChart = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => 200 + i * 2);
    return [{ x: temps, y: temps.map(T => { const Idd = darkCurrent * 1e-9 * Math.pow(2, (T - temperature) / 7); const sn = Math.sqrt(2 * q * Idd * excessNoiseFactor * bandwidth * 1e6); const tn = Math.sqrt(4 * kB * T * bandwidth * 1e6 / loadResistance); const in2 = Math.sqrt(sn ** 2 + tn ** 2); return responsivity > 1e-10 ? Math.sqrt(areaM2 * bandwidth * 1e6) / (in2 / responsivity) : 0; }), type: "scatter", mode: "lines", name: "D*", line: { color: "#f87171", width: 2 } }];
  }, [darkCurrent, temperature, bandwidth, loadResistance, excessNoiseFactor, responsivity, areaM2]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Detectivity (D*)" description="Specific detectivity from NEP, area, and bandwidth. D* = √(A·Δf) / NEP" maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={3000} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qe} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Dark Current (nA)" value={darkCurrent} onChange={setDarkCurrent} min={0} step="0.1" />
        <ValidatedNumberInput label="Area (mm²)" value={area} onChange={setArea} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidth} onChange={setBandwidth} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={77} step="1" />
        <ValidatedNumberInput label="Load R (Ω)" value={loadResistance} onChange={setLoadResistance} min={1} step="10" />
        <ValidatedNumberInput label="Excess Noise Factor" value={excessNoiseFactor} onChange={setExcessNoiseFactor} min={1} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${responsivity.toFixed(3)} A/W`} tone="blue" />
        <ResultCard label="NEP" value={`${nep.toExponential(3)} W/√Hz`} tone="red" />
        <ResultCard label="Shot Noise" value={shotNoiseDark.toExponential(3) + " A"} tone="yellow" />
        <ResultCard label="Thermal Noise" value={thermalNoise.toExponential(3) + " A"} tone="orange" />
        <ResultCard label="Detectivity D*" value={`${detectivity.toExponential(3)} cm·Hz^½/W`} tone="green" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={spectralChart} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" } }} title="D* vs Wavelength" />
        <ChartPanel data={tempChart} layout={{ xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" } }} title="D* vs Temperature" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1"><p>D* = √(A·Δf) / NEP</p><p>NEP = i_n / R,  R = η·q·λ / (h·c)</p><p>i²_shot = 2·q·I_d·F·Δf,  i²_thermal = 4·k·T·Δf / R_L</p></div>
    </CalculatorShell>
  );
}
