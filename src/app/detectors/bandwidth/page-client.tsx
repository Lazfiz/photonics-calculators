"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import ValidatedNumberInput from "../../../components/validated-number-input";
export default function BandwidthPage() {
  const [bandwidth, setBandwidth] = useState(1e6);
  const [capacitance, setCapacitance] = useState(10e-12);
  const [resistance, setResistance] = useState(50);
  const [transimpedance, setTransimpedance] = useState(1e3);
  const [q] = useState(1.6e-19);
  const [kB] = useState(1.381e-23);
  const [temperature] = useState(300);

  const chartData = useMemo(() => {
    const bws = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e7, i / 200));
    const johnsonNoise = bws.map(BW => Math.sqrt(4 * kB * temperature * resistance * BW) * transimpedance / resistance);
    const Iphoto = 1e-6;
    const shotNoise = bws.map(BW => Math.sqrt(2 * q * Iphoto * BW) * transimpedance);
    const totalNoise = bws.map((BW, i) => Math.sqrt(johnsonNoise[i] ** 2 + shotNoise[i] ** 2));
    return [
      { x: bws, y: johnsonNoise, type: "scatter" as const, mode: "lines" as const, name: "Johnson", line: { color: "#f87171" } },
      { x: bws, y: shotNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot", line: { color: "#34d399" } },
      { x: bws, y: totalNoise, type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#60a5fa" } },
    ];
  }, [bandwidth, capacitance, resistance, transimpedance]);

  const vJohnson = Math.sqrt(4 * kB * temperature * resistance * bandwidth) * transimpedance / resistance;
  const Iphoto = 1e-6;
  const vShot = Math.sqrt(2 * q * Iphoto * bandwidth) * transimpedance;
  const vTotal = Math.sqrt(vJohnson ** 2 + vShot ** 2);
  const bw3dB = 1 / (2 * Math.PI * resistance * capacitance);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Bandwidth vs Noise Trade-off" description="Noise increases with √Δf. Wider bandwidth = faster response but more noise.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} />
        <ValidatedNumberInput label="Capacitance (pF)" value={capacitance} onChange={setCapacitance} />
        <ValidatedNumberInput label="Resistance (Ω)" value={resistance} onChange={setResistance} />
        <ValidatedNumberInput label="Transimpedance (V/A)" value={transimpedance} onChange={setTransimpedance} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="RC 3dB BW" value={bw3dB.toExponential(3) + " Hz"} tone="blue" />
        <ResultCard label="Johnson Noise" value={vJohnson.toExponential(3) + " V"} tone="red" />
        <ResultCard label="Shot Noise" value={vShot.toExponential(3) + " V"} tone="green" />
        <ResultCard label="Total Noise" value={vTotal.toExponential(3) + " V"} tone="yellow" />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Bandwidth (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Output Noise Voltage (V)", type: "log", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
