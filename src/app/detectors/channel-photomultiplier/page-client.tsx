"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ChannelPMTPage() {
  const [numChannels, setNumChannels] = useURLState("numChannels", 16);
  const [channelGain, setChannelGain] = useURLState("channelGain", 1e4);
  const [quantumEff, setQuantumEff] = useURLState("quantumEff", 0.25);
  const [darkCountRate, setDarkCountRate] = useURLState("darkCountRate", 500);
  const [collectionEff, setCollectionEff] = useURLState("collectionEff", 0.9);
  const [transitTimeSpread, setTransitTimeSpread] = useURLState("transitTimeSpread", 200);

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
        <ValidatedNumberInput label="Number of Channels" value={numChannels} onChange={setNumChannels} min={1} max={64} />
        <ValidatedNumberInput label="Channel Gain" value={channelGain} onChange={setChannelGain} />
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Collection Efficiency" value={collectionEff} onChange={setCollectionEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Dark Count Rate (cps)" value={darkCountRate} onChange={setDarkCountRate} />
        <ValidatedNumberInput label="Transit Time Spread (ps)" value={transitTimeSpread} onChange={setTransitTimeSpread} />
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
