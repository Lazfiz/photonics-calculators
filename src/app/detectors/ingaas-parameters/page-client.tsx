"use client";

import { useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
const k = 1.381e-23, q = 1.602e-19, h = 6.626e-34, c = 3e8;

export default function IngaasParametersPage() {
  const [temperature, setTemperature] = useURLState("temperature", 293);
  const [indiumFraction, setIndiumFraction] = useURLState("indiumFraction", 0.53);
  const [thickness, setThickness] = useURLState("thickness", 3);
  const [area, setArea] = useURLState("area", 0.1);
  const [biasVoltage, setBiasVoltage] = useURLState("biasVoltage", 0.5);
  const [idealityFactor, setIdealityFactor] = useURLState("idealityFactor", 1.2);

  const Eg = indiumFraction * 0.36 + (1 - indiumFraction) * 1.424 - 0.477 * indiumFraction * (1 - indiumFraction);
  const EgT = Eg - 2.7e-4 * (temperature - 300) * (Eg - 0.5) / Eg;
  const cutoff = 1240 / EgT;
  const R_surface = 0.02;
  const alpha0 = 1e4;

  const alpha = (wl: number) => { const Ep = 1240 / wl; return Ep > EgT ? alpha0 * Math.sqrt(Ep - EgT) : 0; };
  const calcQE = (wl: number) => (1 - R_surface) * (1 - Math.exp(-alpha(wl) * thickness * 1e-4));
  const resp = (wl: number) => calcQE(wl) * wl * 1e-9 * q / (h * c);

  const areaCm2 = area * 1e-2;
  const Vt = k * temperature / q;
  const diffDark = areaCm2 * 1e-8 * (1 - Math.exp(-Math.abs(biasVoltage) / (idealityFactor * Vt)));
  const grDark = areaCm2 * 1e-6 * Math.pow(temperature / 300, 1.5) * Math.exp(-EgT * q / (2 * k * temperature));
  const totalDark = diffDark + grDark;
  const R1550 = resp(1550);
  const nep1550 = Math.sqrt(2 * q * totalDark) / R1550;
  const Dstar1550 = nep1550 > 0 ? Math.sqrt(areaCm2) / nep1550 : 0;

  const spectralQE = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => 800 + i * 1.2);
    return [
      { x: wl, y: wl.map(w => calcQE(w) * 100), type: "scatter", mode: "lines", name: "QE (%)", line: { color: "#60a5fa", width: 2 } },
      { x: [cutoff, cutoff], y: [0, 100], type: "scatter", mode: "lines", name: `λ_c=${cutoff.toFixed(0)}nm`, line: { color: "#f87171", dash: "dash" } },
    ];
  }, [temperature, indiumFraction, thickness, EgT, cutoff]);

  const darkVsTemp = useMemo(() => {
    const temps = Array.from({ length: 150 }, (_, i) => 200 + i * 200 / 150);
    return [{ x: temps, y: temps.map(T => { const egt = Eg - 2.7e-4 * (T - 300) * (Eg - 0.5) / Eg; const vt = k * T / q; const d = areaCm2 * 1e-8 * (1 - Math.exp(-Math.abs(biasVoltage) / (idealityFactor * vt))); const g = areaCm2 * 1e-6 * Math.pow(T / 300, 1.5) * Math.exp(-egt * q / (2 * k * T)); return (d + g) * 1e9; }), type: "scatter", mode: "lines", name: "I_dark", line: { color: "#fbbf24", width: 2 } }];
  }, [Eg, biasVoltage, idealityFactor, areaCm2]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="InGaAs Detector Parameters" description="InₓGa₁₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={200} max={400} step="5" />
        <ValidatedNumberInput label="Indium Fraction (x)" value={indiumFraction} onChange={setIndiumFraction} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Thickness (µm)" value={thickness} onChange={setThickness} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Area (mm²)" value={area} onChange={setArea} min={0.01} step="0.01" />
        <ValidatedNumberInput label="Bias (V)" value={biasVoltage} onChange={setBiasVoltage} min={-5} step="0.1" />
        <ValidatedNumberInput label="Ideality Factor" value={idealityFactor} onChange={setIdealityFactor} min={1} max={2} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Bandgap E_g" value={`${EgT.toFixed(3)} eV`} tone="blue" />
        <ResultCard label="Cutoff λ_c" value={`${cutoff.toFixed(0)} nm`} tone="green" />
        <ResultCard label="QE @ 1300nm" value={`${(calcQE(1300) * 100).toFixed(1)}%`} tone="yellow" />
        <ResultCard label="Dark Current" value={totalDark.toExponential(3) + " A"} tone="red" />
        <ResultCard label="R @ 1550nm" value={`${R1550.toFixed(3)} A/W`} tone="purple" />
        <ResultCard label="NEP @ 1550nm" value={nep1550.toExponential(3) + " W/√Hz"} tone="orange" />
        <ResultCard label="D* @ 1550nm" value={`${Dstar1550.toExponential(3)} cm·Hz^½/W`} tone="cyan" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>E_g(x) = 1.424 − 1.541x + 0.477x²</p><p>λ_c = 1240/E_g, QE = (1−R)·(1−exp(−α·d))</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={spectralQE} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "QE (%)", gridcolor: "#374151" } }} title="Spectral QE" />
        <ChartPanel data={darkVsTemp} layout={{ xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "I_dark (nA)", type: "log", gridcolor: "#374151" } }} title="Dark vs Temperature" />
      </div>
    </CalculatorShell>
  );
}
