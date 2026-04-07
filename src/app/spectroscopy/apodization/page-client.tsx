"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ApodizationPage() {
  const [nPoints, setNPoints] = useURLState("nPoints", 256);
  const [peakWidth, setPeakWidth] = useURLState("peakWidth", 5); // spectral resolution in points

  const chartData = useMemo(() => {
    const N = nPoints;
    const x = Array.from({ length: N }, (_, i) => i - N / 2);
    const k = Array.from({ length: N }, (_, i) => i - N / 2);

    // Window functions
    const boxcar = x.map(xi => 1);
    const hanning = x.map(xi => 0.5 * (1 + Math.cos(2 * Math.PI * xi / N)));
    const blackman = x.map(xi => 0.42 + 0.5 * Math.cos(2 * Math.PI * xi / N) + 0.08 * Math.cos(4 * Math.PI * xi / N));

    // Simulated spectrum: delta function broadened by window
    // ILS (instrument line shape) = |FT(window)|²
    const computeILS = (window: number[]) => {
      const result = k.map(ki => {
        let real = 0, imag = 0;
        for (let j = 0; j < N; j++) {
          const phase = (2 * Math.PI * ki * j) / N;
          real += window[j] * Math.cos(phase);
          imag -= window[j] * Math.sin(phase);
        }
        return (real * real + imag * imag) / (N * N);
      });
      return result;
    };

    const ilsBoxcar = computeILS(boxcar);
    const ilsHanning = computeILS(hanning);
    const ilsBlackman = computeILS(blackman);

    // Normalize
    const norm = (arr: number[]) => {
      const max = Math.max(...arr);
      return max > 0 ? arr.map(v => v / max) : arr;
    };

    return [
      { x, y: boxcar, type: "scatter" as const, mode: "lines" as const, name: "Boxcar", line: { color: "#60a5fa" } },
      { x, y: hanning, type: "scatter" as const, mode: "lines" as const, name: "Hanning", line: { color: "#34d399" } },
      { x, y: blackman, type: "scatter" as const, mode: "lines" as const, name: "Blackman", line: { color: "#f87171" } },
      { x: k, y: norm(ilsBoxcar), type: "scatter" as const, mode: "lines" as const, name: "Boxcar ILS", line: { color: "#60a5fa" }, xaxis: "x2", yaxis: "y2" },
      { x: k, y: norm(ilsHanning), type: "scatter" as const, mode: "lines" as const, name: "Hanning ILS", line: { color: "#34d399" }, xaxis: "x2", yaxis: "y2" },
      { x: k, y: norm(ilsBlackman), type: "scatter" as const, mode: "lines" as const, name: "Blackman ILS", line: { color: "#f87171" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [nPoints]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Apodization Functions" description="Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Points" value={nPoints} onChange={setNPoints} min={4} max={2048} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300"><span className="text-blue-400 font-mono">Boxcar:</span> Best resolution, worst sidelobes (−13 dB)</p>
        <p className="text-gray-300"><span className="text-green-400 font-mono">Hanning:</span> Moderate resolution, good sidelobes (−31 dB)</p>
        <p className="text-gray-300"><span className="text-red-400 font-mono">Blackman:</span> Worst resolution, best sidelobes (−58 dB)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 1, columns: 2, pattern: "independent" },
        xaxis: { title: "Point", gridcolor: "#374151", domain: [0, 0.47] },
        yaxis: { title: "Amplitude", gridcolor: "#374151", range: [-0.1, 1.1] },
        xaxis2: { title: "Frequency Point", gridcolor: "#374151", domain: [0.53, 1] },
        yaxis2: { title: "ILS (norm)", gridcolor: "#374151", anchor: "x2", range: [-0.05, 1.1] },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: false
      }} />
    </CalculatorShell>
  );
}
