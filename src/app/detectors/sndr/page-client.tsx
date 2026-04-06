"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SNDRPage() {
  const [signalPower, setSignalPower] = useState(1); // W (normalized)
  const [noisePower, setNoisePower] = useState(0.01);
  const [distortionPower, setDistortionPower] = useState(0.001);
  const [bits, setBits] = useState(12);

  const chartData = useMemo(() => {
    const bitRange = Array.from({ length: 14 }, (_, i) => i + 4);
    const snrForBits = bitRange.map(b => {
      const qLevel = Math.pow(2, b);
      const sqnr = 6.02 * b + 1.76;
      return sqnr;
    });
    const sndrForBits = bitRange.map(b => {
      const sqnr = 6.02 * b + 1.76;
      // Subtract distortion
      return sqnr - 3; // typical 3dB loss from distortion
    });
    return [
      { x: bitRange, y: snrForBits, type: "scatter" as const, mode: "lines+markers" as const, name: "SQNR (ideal)", line: { color: "#60a5fa" } },
      { x: bitRange, y: sndrForBits, type: "scatter" as const, mode: "lines+markers" as const, name: "SNDR (with distortion)", line: { color: "#f87171" } },
    ];
  }, [signalPower, noisePower, distortionPower, bits]);

  const snr = 10 * Math.log10(signalPower / noisePower);
  const sndr = 10 * Math.log10(signalPower / (noisePower + distortionPower));
  const sfdr = 10 * Math.log10(signalPower / distortionPower);
  const thd = 10 * Math.log10(distortionPower / signalPower);
  const enob = (sndr - 1.76) / 6.02;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="SNDR Calculator" description="Signal-to-Noise-and-Distortion Ratio. SNDR = Psignal/(Pnoise + Pdistortion).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Signal Power (W)</span>
          <input type="number" value={signalPower} onChange={e => setSignalPower(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Noise Power (W)</span>
          <input type="number" value={noisePower} onChange={e => setNoisePower(+e.target.value)} step="0.001" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Distortion Power (W)</span>
          <input type="number" value={distortionPower} onChange={e => setDistortionPower(+e.target.value)} step="0.0001" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">ADC Bits</span>
          <input type="number" value={bits} onChange={e => setBits(+e.target.value)} min={1} max={24} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{snr.toFixed(2)} dB</span></p>
        <p className="text-gray-300">SNDR = <span className="text-blue-400 font-mono">{sndr.toFixed(2)} dB</span></p>
        <p className="text-gray-300">SFDR = <span className="text-blue-400 font-mono">{sfdr.toFixed(2)} dB</span></p>
        <p className="text-gray-300">THD = <span className="text-blue-400 font-mono">{thd.toFixed(2)} dB</span></p>
        <p className="text-gray-300">ENOB = <span className="text-blue-400 font-mono">{enob.toFixed(2)} bits</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "ADC Bits", gridcolor: "#374151", dtick: 2 }, yaxis: { title: "dB", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
