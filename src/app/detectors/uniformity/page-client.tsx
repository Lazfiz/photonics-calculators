"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function UniformityPage() {
  const [meanSignal, setMeanSignal] = useState(50000); // e-
  const [prnuPercent, setPrnuPercent] = useState(1.0); // %
  const [dsnuPercent, setDsnuPercent] = useState(0.3); // %
  const [readNoise, setReadNoise] = useState(5); // e-
  const [arraySize, setArraySize] = useState(1920); // pixels per side

  const chartData = useMemo(() => {
    const N = 80;
    // Generate a 2D PRNU map
    const x: number[] = [], y: number[] = [], z: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const xi = i / N, yj = j / N;
        // Simulate gradual non-uniformity pattern
        const gradient = 0.3 * (xi - 0.5) + 0.2 * (yj - 0.5);
        const hotSpot = 0.4 * Math.exp(-((xi-0.3)**2 + (yj-0.7)**2) / 0.02);
        const val = meanSignal * (1 + (prnuPercent/100) * (gradient + hotSpot + 0.5*Math.sin(6*xi)*Math.cos(4*yj)));
        x.push(i);
        y.push(j);
        z.push(val);
      }
    }
    return [{ x, y, z, type: "heatmap" as const, colorscale: "Viridis", name: "Signal (e⁻)" }];
  }, [meanSignal, prnuPercent]);

  // Histogram of pixel values
  const histogramData = useMemo(() => {
    const N = 10000;
    const sigma = (prnuPercent / 100) * meanSignal;
    // Normal distribution of pixel values
    const bins = 50;
    const binWidth = 4 * sigma / bins;
    const xH: number[] = [], yH: number[] = [];
    for (let i = 0; i < bins; i++) {
      const center = meanSignal - 2 * sigma + (i + 0.5) * binWidth;
      const val = Math.exp(-0.5 * Math.pow((center - meanSignal) / sigma, 2));
      xH.push(center);
      yH.push(val);
    }
    return [{ x: xH, y: yH, type: "bar" as const, name: "Pixel value distribution", marker: { color: "#60a5fa" } }];
  }, [meanSignal, prnuPercent]);

  const prnuNoise = (prnuPercent / 100) * meanSignal;
  const dsnuNoise = (dsnuPercent / 100) * meanSignal;
  const shotNoise = Math.sqrt(meanSignal);
  const totalNoise = Math.sqrt(prnuNoise**2 + dsnuNoise**2 + readNoise**2 + shotNoise**2);
  const snr = meanSignal / totalNoise;
  const prnuInDN = prnuNoise / (meanSignal / (Math.pow(2, 16) - 1));

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Photoresponse Non-Uniformity" description="PRNU measures the spatial variation in pixel sensitivity across the sensor array. σPRNU = PRNU% × mean signal.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Mean Signal (e⁻)" value={meanSignal} onChange={setMeanSignal} />
        <ValidatedNumberInput label="PRNU (%)" value={prnuPercent} onChange={setPrnuPercent} />
        <ValidatedNumberInput label="DSNU (%)" value={dsnuPercent} onChange={setDsnuPercent} />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">PRNU noise = <span className="text-blue-400 font-mono">{prnuNoise.toFixed(0)} e⁻</span> ({prnuPercent}%)</p>
        <p className="text-gray-300">DSNU noise = <span className="text-blue-400 font-mono">{dsnuNoise.toFixed(0)} e⁻</span></p>
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{shotNoise.toFixed(1)} e⁻</span></p>
        <p className="text-gray-300">Total noise = <span className="text-blue-400 font-mono">{totalNoise.toFixed(1)} e⁻</span> | SNR = <span className="text-blue-400 font-mono">{(20*Math.log10(snr)).toFixed(1)} dB</span></p>
        <p className="text-gray-300 text-sm mt-1">σ<sub>total</sub> = √(σ²<sub>PRNU</sub> + σ²<sub>DSNU</sub> + σ²<sub>shot</sub> + σ²<sub>read</sub>)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "x (pixel)", gridcolor: "#374151" },
        yaxis: { title: "y (pixel)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true
      }} className="w-full mb-6" />

      <ChartPanel data={histogramData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel value (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Count", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true, bargap: 0.05
      }} />
    </CalculatorShell>
  );
}
