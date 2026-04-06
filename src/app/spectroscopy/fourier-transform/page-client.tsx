"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function FourierTransformPage() {
  const [freq1, setFreq1] = useURLState("freq1", 10);
  const [freq2, setFreq2] = useURLState("freq2", 25);
  const [amp1, setAmp1] = useURLState("amp1", 1.0);
  const [amp2, setAmp2] = useURLState("amp2", 0.5);
  const [noise, setNoise] = useURLState("noise", 0.1);
  const [nPoints, setNPoints] = useURLState("nPoints", 256);

  const chartData = useMemo(() => {
    const N = nPoints;
    const dt = 1 / 100; // sampling interval
    const time = Array.from({ length: N }, (_, i) => i * dt);
    const signal = time.map(t => amp1 * Math.sin(2 * Math.PI * freq1 * t) + amp2 * Math.sin(2 * Math.PI * freq2 * t) + noise * (Math.random() - 0.5));

    // DFT magnitude
    const freqs = Array.from({ length: N / 2 }, (_, i) => i / (N * dt));
    const magnitude = freqs.map((_, k) => {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const phase = (2 * Math.PI * k * n) / N;
        real += signal[n] * Math.cos(phase);
        imag -= signal[n] * Math.sin(phase);
      }
      return Math.sqrt(real * real + imag * imag) / N;
    });

    return [
      { x: time, y: signal, type: "scatter" as const, mode: "lines" as const, name: "Signal", line: { color: "#60a5fa" } },
      { x: freqs, y: magnitude, type: "scatter" as const, mode: "lines" as const, name: "Magnitude", line: { color: "#f87171" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [freq1, freq2, amp1, amp2, noise, nPoints]);

  const nyquist = 100 / 2;
  const resolution = 100 / nPoints;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fourier Transform Basics" description="Decompose a composite time-domain signal into its frequency components via DFT.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Frequency 1 (Hz)" value={freq1} onChange={setFreq1} min={0.1} />
        <ValidatedNumberInput label="Frequency 2 (Hz)" value={freq2} onChange={setFreq2} min={0.1} />
        <ValidatedNumberInput label="Amplitude 1" value={amp1} onChange={setAmp1} min={0} />
        <ValidatedNumberInput label="Amplitude 2" value={amp2} onChange={setAmp2} min={0} />
        <ValidatedNumberInput label="Noise Level" value={noise} onChange={setNoise} min={0} />
        <ValidatedNumberInput label="N Points" value={nPoints} onChange={setNPoints} min={4} max={1024} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nyquist Frequency</p>
          <p className="text-xl font-bold text-blue-400">{nyquist.toFixed(1)} Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Frequency Resolution</p>
          <p className="text-xl font-bold text-green-400">{resolution.toFixed(3)} Hz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">X(f) = ∫ x(t)·e^(−j2πft) dt</span></p>
        <p className="text-sm text-gray-300"><span className="text-green-400 font-mono">Δf = f_s / N</span> — resolution improves with more points or lower sampling rate.</p>
        <p className="text-sm text-gray-300"><span className="text-red-400 font-mono">f_Nyquist = f_s / 2</span> — max detectable frequency.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 2, columns: 1, pattern: "independent" },
        xaxis: { title: "Time (s)", gridcolor: "#374151" },
        yaxis: { title: "Amplitude", gridcolor: "#374151" },
        xaxis2: { title: "Frequency (Hz)", gridcolor: "#374151" },
        yaxis2: { title: "Magnitude", gridcolor: "#374151" },
        height: 700, margin: { t: 30, b: 40 },
      }} />
    </CalculatorShell>
  );
}
