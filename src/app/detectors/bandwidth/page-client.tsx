"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BandwidthPage() {
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 1e6);
  const [capacitancePF, setCapacitancePF] = useURLState("capacitance", 10);
  const capacitance = capacitancePF * 1e-12;
  const [feedbackR, setFeedbackR] = useURLState("feedbackR", 1e3);
  const [photoCurrent, setPhotoCurrent] = useURLState("photoCurrent", 1e-6);
  const [temperature, setTemperature] = useURLState("temperature", 300);

  const q = 1.6e-19;
  const kB = 1.381e-23;

  const chartData = useMemo(() => {
    const bws = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e7, i / 200));
    // TIA model: Johnson noise from feedback resistor Rf appears at output
    // v_Johnson = sqrt(4*kB*T*Rf*BW)
    const johnsonNoise = bws.map(BW => Math.sqrt(4 * kB * temperature * feedbackR * BW));
    // Shot noise current through TIA: i_shot = sqrt(2*q*I*BW), v_out = i_shot * Rf
    const shotNoise = bws.map(BW => Math.sqrt(2 * q * photoCurrent * BW) * feedbackR);
    const totalNoise = bws.map((BW, i) => Math.sqrt(johnsonNoise[i] ** 2 + shotNoise[i] ** 2));
    return [
      { x: bws, y: johnsonNoise, type: "scatter" as const, mode: "lines" as const, name: "Johnson (Rf)", line: { color: "#f87171" } },
      { x: bws, y: shotNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot", line: { color: "#34d399" } },
      { x: bws, y: totalNoise, type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#60a5fa" } },
    ];
  }, [bandwidth, capacitance, feedbackR, photoCurrent, temperature]);

  // TIA output noise voltages
  const vJohnson = Math.sqrt(4 * kB * temperature * feedbackR * bandwidth);
  const vShot = Math.sqrt(2 * q * photoCurrent * bandwidth) * feedbackR;
  const vTotal = Math.sqrt(vJohnson ** 2 + vShot ** 2);
  // RC bandwidth of detector junction
  const bw3dB = 1 / (2 * Math.PI * feedbackR * capacitance);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Bandwidth vs Noise Trade-off" description="Noise increases with √Δf. Wider bandwidth = faster response but more noise.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Measurement Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} min={1} />
        <ValidatedNumberInput label="Junction Capacitance (pF)" value={capacitancePF} onChange={setCapacitancePF} min={0.1} />
        <ValidatedNumberInput label="Feedback Resistance Rf (Ω)" value={feedbackR} onChange={setFeedbackR} min={1} />
        <ValidatedNumberInput label="Photocurrent (A)" value={photoCurrent} onChange={setPhotoCurrent} min={1e-12} step="1e-7" />
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={4} max={500} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="RC 3dB Bandwidth" value={bw3dB.toExponential(3) + " Hz"} tone="blue" />
        <ResultCard label="Johnson Noise (V)" value={vJohnson.toExponential(3)} tone="red" />
        <ResultCard label="Shot Noise (V)" value={vShot.toExponential(3)} tone="green" />
        <ResultCard label="Total Noise (V)" value={vTotal.toExponential(3)} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>TIA model: Johnson noise from feedback resistor Rf at output</p>
        <p>v_Johnson = √(4·kB·T·Rf·Δf)</p>
        <p>v_Shot = √(2·q·I·Δf) · Rf</p>
        <p>RC bandwidth: f_3dB = 1/(2π·Rf·C) — set by feedback R and detector capacitance</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Bandwidth (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Output Noise Voltage (V)", type: "log", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
