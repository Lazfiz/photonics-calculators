"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ChannelPMTPage() {
  const [numChannels, setNumChannels] = useState(16);
  const [channelGain, setChannelGain] = useState(1e4); // per channel
  const [quantumEff, setQuantumEff] = useState(0.25);
  const [darkCountRate, setDarkCountRate] = useState(500); // counts/s
  const [collectionEff, setCollectionEff] = useState(0.9);
  const [transitTimeSpread, setTransitTimeSpread] = useState(200); // ps

  const results = useMemo(() => {
    const totalGain = channelGain * numChannels;
    const singleElectronCharge = 1.6e-19;
    const chargePerPhoton = singleElectronCharge * totalGain * quantumEff * collectionEff;
    const anodeSensitivity = chargePerPhoton / singleElectronCharge; // electrons per photon
    const peakCurrent = chargePerPhoton / (transitTimeSpread * 1e-12);
    const energyRes = 2.355 / Math.sqrt(channelGain * quantumEff * collectionEff); // FWHM/E approx
    const snrDark = Math.sqrt(totalGain * quantumEff * collectionEff) / (Math.sqrt(totalGain * quantumEff * collectionEff + darkCountRate * 1));
    return { totalGain, chargePerPhoton, anodeSensitivity, peakCurrent, energyRes };
  }, [numChannels, channelGain, quantumEff, darkCountRate, collectionEff, transitTimeSpread]);

  const chartData = useMemo(() => {
    const channels = Array.from({ length: 50 }, (_, i) => 4 + i * 2);
    const totalGains = channels.map(n => channelGain * n);
    const energyRes = channels.map(n => 2.355 / Math.sqrt(channelGain * n * quantumEff * collectionEff));
    const chargeOut = channels.map(n => 1.6e-19 * channelGain * n * quantumEff * collectionEff);
    return [
      { x: channels, y: totalGains, type: "scatter", mode: "lines", name: "Total Gain", line: { color: "#60a5fa" } },
      { x: channels, y: energyRes.map(r => r * 100), type: "scatter", mode: "lines", name: "Energy Res. (%FWHM)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [channelGain, quantumEff, collectionEff]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Channel Photomultiplier (Multi-Channel PMT)</h1>
      <p className="text-gray-400 mb-8">Multi-channel PMT calculator. Models gain staging across independent channel multipliers, energy resolution, and timing.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Number of Channels</span>
          <input type="number" value={numChannels} onChange={e => setNumChannels(+e.target.value)} min="1" max="64" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Channel Gain (per channel)</span>
          <input type="number" value={channelGain} onChange={e => setChannelGain(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Collection Efficiency</span>
          <input type="number" value={collectionEff} onChange={e => setCollectionEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dark Count Rate (cps)</span>
          <input type="number" value={darkCountRate} onChange={e => setDarkCountRate(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Transit Time Spread (ps)</span>
          <input type="number" value={transitTimeSpread} onChange={e => setTransitTimeSpread(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total gain = <span className="text-blue-400 font-mono">{results.totalGain.toExponential(2)}</span></p>
        <p className="text-gray-300">Charge per photon = <span className="text-blue-400 font-mono">{results.chargePerPhoton.toExponential(3)} C</span></p>
        <p className="text-gray-300">Anode sensitivity = <span className="text-blue-400 font-mono">{results.anodeSensitivity.toExponential(2)} e⁻/photon</span></p>
        <p className="text-gray-300">Peak current (single photon) ≈ <span className="text-blue-400 font-mono">{results.peakCurrent.toExponential(2)} A</span></p>
        <p className="text-gray-300">Energy resolution ≈ <span className="text-blue-400 font-mono">{(results.energyRes * 100).toFixed(1)}% FWHM</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>G<sub>total</sub> = G<sub>channel</sub> · N<sub>channels</sub></p>
        <p>Q = e · G<sub>total</sub> · η · ε<sub>coll</sub></p>
        <p>ΔE/E (FWHM) ≈ 2.355 / √(G·η·ε)</p>
        <p>I<sub>peak</sub> = Q / τ<sub>TTS</sub></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Number of Channels", gridcolor: "#374151" },
        yaxis: { title: "Total Gain", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "Energy Res. (%FWHM)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 80 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
