"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function ChannelPMTPage() {
  const [numChannels, setNumChannels] = useState(16);
  const [channelGain, setChannelGain] = useState(1e4);
  const [quantumEff, setQuantumEff] = useState(0.25);
  const [darkCountRate, setDarkCountRate] = useState(500);
  const [collectionEff, setCollectionEff] = useState(0.9);
  const [transitTimeSpread, setTransitTimeSpread] = useState(200);

  const results = useMemo(() => {
    const totalGain = channelGain * numChannels;
    const chargePerPhoton = 1.6e-19 * totalGain * quantumEff * collectionEff;
    const anodeSensitivity = chargePerPhoton / 1.6e-19;
    const peakCurrent = chargePerPhoton / (transitTimeSpread * 1e-12);
    const energyRes = 2.355 / Math.sqrt(channelGain * quantumEff * collectionEff);
    return { totalGain, chargePerPhoton, anodeSensitivity, peakCurrent, energyRes };
  }, [numChannels, channelGain, quantumEff, darkCountRate, collectionEff, transitTimeSpread]);

  const chartData = useMemo(() => {
    const channels = Array.from({ length: 50 }, (_, i) => 4 + i * 2);
    const totalGains = channels.map(n => channelGain * n);
    const energyRes = channels.map(n => 2.355 / Math.sqrt(channelGain * n * quantumEff * collectionEff));
    return [
      { x: channels, y: totalGains, type: "scatter", mode: "lines", name: "Total Gain", line: { color: "#60a5fa" } },
      { x: channels, y: energyRes.map(r => r * 100), type: "scatter", mode: "lines", name: "Energy Res. (%FWHM)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [channelGain, quantumEff, collectionEff]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Channel Photomultiplier (Multi-Channel PMT)" description="Multi-channel PMT: gain staging, energy resolution, and timing.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Number of Channels</span><input type="number" value={numChannels} onChange={e => setNumChannels(+e.target.value)} min="1" max="64" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Channel Gain</span><input type="number" value={channelGain} onChange={e => setChannelGain(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Quantum Efficiency</span><input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Collection Efficiency</span><input type="number" value={collectionEff} onChange={e => setCollectionEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dark Count Rate (cps)</span><input type="number" value={darkCountRate} onChange={e => setDarkCountRate(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Transit Time Spread (ps)</span><input type="number" value={transitTimeSpread} onChange={e => setTransitTimeSpread(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Total Gain" value={results.totalGain.toExponential(2)} tone="blue" />
        <ResultCard label="Charge/Photon" value={results.chargePerPhoton.toExponential(3) + " C"} tone="green" />
        <ResultCard label="Anode Sensitivity" value={results.anodeSensitivity.toExponential(2) + " e⁻/photon"} tone="yellow" />
        <ResultCard label="Peak Current" value={results.peakCurrent.toExponential(2) + " A"} tone="red" />
        <ResultCard label="Energy Resolution" value={`${(results.energyRes * 100).toFixed(1)}% FWHM`} tone="purple" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>G_total = G_channel · N_channels</p><p>Q = e · G_total · η · ε_coll</p><p>ΔE/E (FWHM) ≈ 2.355 / √(G·η·ε)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Number of Channels", gridcolor: "#374151" }, yaxis: { title: "Total Gain", type: "log", gridcolor: "#374151" }, yaxis2: { title: "Energy Res. (%FWHM)", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
