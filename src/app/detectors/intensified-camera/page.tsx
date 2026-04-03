"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// ICCD: Intensified CCD
// MCP gain × CCD QE, gated operation
// SNR = G·QE·S / sqrt(G·QE·S + G²·QE·(S+D)·F² + σ_read²)
// where F = excess noise factor of MCP (~1.5-2), G = MCP gain
export default function IntensifiedCameraPage() {
  const [mcpGain, setMcpGain] = useState(1000);
  const [ccdQE, setCcdQE] = useState(0.5);
  const [excessNoiseFactor, setExcessNoiseFactor] = useState(1.6);
  const [photonRate, setPhotonRate] = useState(100); // photons/pix/frame
  const [darkRate, setDarkRate] = useState(0.01); // e-/pix/frame
  const [ccdReadNoise, setCcdReadNoise] = useState(10); // e-
  const [gateWidth, setGateWidth] = useState(10); // ns
  const [phosphorEfficiency, setPhosphorEfficiency] = useState(0.3);
  const [fiberOpticCoupling, setFiberOpticCoupling] = useState(0.6);

  const totalSystemQE = ccdQE * phosphorEfficiency * fiberOpticCoupling;
  const effectiveGain = mcpGain * totalSystemQE;
  const signalOut = photonRate * effectiveGain;
  const enoisedSignal = photonRate * effectiveGain * excessNoiseFactor ** 2;
  const darkOut = darkRate * effectiveGain * excessNoiseFactor ** 2;
  const totalNoise = Math.sqrt(enoisedSignal + darkOut + ccdReadNoise ** 2);
  const snr = signalOut / totalNoise;

  // SNR vs MCP gain
  const snrVsGain = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 10 + i * 50);
    const vals = gains.map(g => {
      const eg = g * totalSystemQE;
      const sig = photonRate * eg;
      const noise = Math.sqrt(photonRate * eg * excessNoiseFactor ** 2 + darkRate * eg * excessNoiseFactor ** 2 + ccdReadNoise ** 2);
      return sig / noise;
    });
    return { gains, vals };
  }, [photonRate, totalSystemQE, excessNoiseFactor, darkRate, ccdReadNoise]);

  // SNR vs gate width
  const snrVsGate = useMemo(() => {
    const gates = Array.from({ length: 200 }, (_, i) => 1 + i * 0.5);
    const vals = gates.map(gw => {
      const timeFrac = gw / 10; // relative to reference 10ns
      const photons = photonRate * timeFrac;
      const sig = photons * effectiveGain;
      const noise = Math.sqrt(photons * effectiveGain * excessNoiseFactor ** 2 + darkRate * effectiveGain * excessNoiseFactor ** 2 + ccdReadNoise ** 2);
      return sig / noise;
    });
    return { gates, vals };
  }, [photonRate, effectiveGain, excessNoiseFactor, darkRate, ccdReadNoise]);

  // Timing budget
  const gateTime = gateWidth * 1e-9;
  const minRepetitionRate = 1 / (gateTime + 10e-6); // 10us min decay

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">ICCD Design Calculator</h1>
      <p className="text-gray-400 mb-8">Intensified CCD — MCP gain, gating, system QE, and SNR analysis.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">MCP Gain</span>
          <input type="number" value={mcpGain} onChange={e => setMcpGain(+e.target.value)} min="10" step="100"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">CCD Quantum Efficiency</span>
          <input type="number" value={ccdQE} onChange={e => setCcdQE(+e.target.value)} min="0.01" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">MCP Excess Noise Factor</span>
          <input type="number" value={excessNoiseFactor} onChange={e => setExcessNoiseFactor(+e.target.value)} min="1" max="3" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Photon Rate (photons/pix/frame)</span>
          <input type="number" value={photonRate} onChange={e => setPhotonRate(+e.target.value)} min="0.1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Gate Width (ns)</span>
          <input type="number" value={gateWidth} onChange={e => setGateWidth(+e.target.value)} min="0.5" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Phosphor Efficiency</span>
          <input type="number" value={phosphorEfficiency} onChange={e => setPhosphorEfficiency(+e.target.value)} min="0.01" max="1" step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Optic Coupling</span>
          <input type="number" value={fiberOpticCoupling} onChange={e => setFiberOpticCoupling(+e.target.value)} min="0.01" max="1" step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">CCD Read Noise (e⁻)</span>
          <input type="number" value={ccdReadNoise} onChange={e => setCcdReadNoise(+e.target.value)} min="0.5" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">System QE</p>
          <p className="text-xl font-bold text-blue-400">{(totalSystemQE * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR</p>
          <p className="text-xl font-bold text-green-400">{snr.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Signal Output (e⁻)</p>
          <p className="text-xl font-bold text-yellow-400">{signalOut.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Rep Rate</p>
          <p className="text-xl font-bold text-purple-400">{(minRepetitionRate / 1e3).toFixed(0)} kHz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>System QE = QE<sub>CCD</sub> · η<sub>phosphor</sub> · η<sub>fiber</sub></p>
        <p>G<sub>eff</sub> = G<sub>MCP</sub> · System QE</p>
        <p>SNR = G<sub>eff</sub>·S / √(G<sub>eff</sub>·S·F² + G<sub>eff</sub>·D·F² + σ<sub>read</sub>²)</p>
        <p>ICCD advantage: nanosecond gating for time-resolved imaging</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={[{ x: snrVsGain.gains, y: snrVsGain.vals, type: "scatter" as const, mode: "lines" as const,
          name: "SNR", line: { color: "#60a5fa" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs MCP Gain", font: { size: 12 } },
          xaxis: { title: "MCP Gain", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 50 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />

        <Plot data={[{ x: snrVsGate.gates, y: snrVsGate.vals, type: "scatter" as const, mode: "lines" as const,
          name: "SNR", line: { color: "#34d399" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Gate Width", font: { size: 12 } },
          xaxis: { title: "Gate Width (ns)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 50 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
