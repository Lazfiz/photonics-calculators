"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function IntensifiedCCDPage() {
  const [intensifierGain, setIntensifierGain] = useState(10000);
  const [gateTime, setGateTime] = useState(10); // ns
  const [quantumEff, setQuantumEff] = useState(0.5);
  const [ccdWellDepth, setCcdWellDepth] = useState(20000); // e⁻
  const [ccdReadNoise, setCcdReadNoise] = useState(10); // e⁻
  const [ccdDarkCurrent, setCcdDarkCurrent] = useState(0.001); // e⁻/pixel/s
  const [ccdPixelSize, setCcdPixelSize] = useState(13); // µm
  const [mcpGain, setMcpGain] = useState(1000);

  const results = useMemo(() => {
    const totalGain = intensifierGain * mcpGain;
    const photonsForSat = ccdWellDepth / (totalGain * quantumEff);
    const gateTimeSec = gateTime * 1e-9;
    const darkElectrons = ccdDarkCurrent * gateTimeSec;
    const snrSingle = totalGain * quantumEff / Math.sqrt(totalGain * quantumEff + darkElectrons + ccdReadNoise ** 2);
    const minDetectablePhotons = 3 * Math.sqrt(darkElectrons + ccdReadNoise ** 2) / (quantumEff * Math.sqrt(totalGain));
    const dynamicRange = ccdWellDepth / Math.sqrt(2 * ccdReadNoise ** 2);
    return { totalGain, photonsForSat, darkElectrons, snrSingle, minDetectablePhotons, dynamicRange };
  }, [intensifierGain, gateTime, quantumEff, ccdWellDepth, ccdReadNoise, ccdDarkCurrent, ccdPixelSize, mcpGain]);

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 100 }, (_, i) => Math.pow(10, 2 + i * 0.03));
    const tg = gateTime * 1e-9;
    const de = ccdDarkCurrent * tg;
    const photonsAtSat = gains.map(g => ccdWellDepth / (g * quantumEff));
    const snr = gains.map(g => {
      const signal = g * quantumEff;
      return signal / Math.sqrt(signal + de + ccdReadNoise ** 2);
    });
    const minPh = gains.map(g => 3 * Math.sqrt(de + ccdReadNoise ** 2) / (quantumEff * Math.sqrt(g)));
    return [
      { x: gains, y: snr, type: "scatter", mode: "lines", name: "SNR (single photon equiv.)", line: { color: "#60a5fa" } },
      { x: gains, y: minPh, type: "scatter", mode: "lines", name: "Min detectable photons", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [intensifierGain, gateTime, quantumEff, ccdWellDepth, ccdReadNoise, ccdDarkCurrent, mcpGain]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Intensified CCD (ICCD)</h1>
      <p className="text-gray-400 mb-8">ICCD design calculator. Models intensifier gain chain, gating, SNR, dynamic range, and minimum detectable signal for gated intensified cameras.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Intensifier Gain (phosphor/screen)</span>
          <input type="number" value={intensifierGain} onChange={e => setIntensifierGain(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">MCP Gain</span>
          <input type="number" value={mcpGain} onChange={e => setMcpGain(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Gate Time (ns)</span>
          <input type="number" value={gateTime} onChange={e => setGateTime(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Photocathode QE</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CCD Well Depth (e⁻)</span>
          <input type="number" value={ccdWellDepth} onChange={e => setCcdWellDepth(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CCD Read Noise (e⁻)</span>
          <input type="number" value={ccdReadNoise} onChange={e => setCcdReadNoise(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CCD Dark Current (e⁻/pix/s)</span>
          <input type="number" value={ccdDarkCurrent} onChange={e => setCcdDarkCurrent(+e.target.value)} step="0.001" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CCD Pixel Size (µm)</span>
          <input type="number" value={ccdPixelSize} onChange={e => setCcdPixelSize(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total gain (MCP × phosphor) = <span className="text-blue-400 font-mono">{results.totalGain.toExponential(2)}</span></p>
        <p className="text-gray-300">Photons to saturate CCD = <span className="text-blue-400 font-mono">{results.photonsForSat.toExponential(2)}</span></p>
        <p className="text-gray-300">Dark electrons in gate = <span className="text-blue-400 font-mono">{results.darkElectrons.toExponential(3)} e⁻</span></p>
        <p className="text-gray-300">SNR (single photon equivalent) = <span className="text-blue-400 font-mono">{results.snrSingle.toFixed(1)}</span></p>
        <p className="text-gray-300">Min detectable photons (3σ) ≈ <span className="text-blue-400 font-mono">{results.minDetectablePhotons.toExponential(2)}</span></p>
        <p className="text-gray-300">CCD dynamic range = <span className="text-blue-400 font-mono">{results.dynamicRange.toFixed(0)}</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>G<sub>total</sub> = G<sub>MCP</sub> × G<sub>phosphor</sub></p>
        <p>N<sub>sat</sub> = W<sub>CCD</sub> / (G<sub>total</sub> · η)</p>
        <p>SNR = G·η / √(G·η + n<sub>dark</sub> + n<sub>read</sub>²)</p>
        <p>N<sub>min</sub> = 3·√(n<sub>dark</sub> + n<sub>read</sub>²) / (η·√G)</p>
        <p>DR = W<sub>CCD</sub> / √(2·n<sub>read</sub>²)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Total Gain", type: "log", gridcolor: "#374151" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        yaxis2: { title: "Min Detectable Photons", type: "log", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 80 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
