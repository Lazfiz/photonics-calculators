"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// SPAD: Single-Photon Avalanche Diode
// PDE = η · P_geiger · P_quench
// Afterpulsing probability, dead time, DCR model
export default function SPADPage() {
  const [pde, setPde] = useState(0.4); // peak PDE
  const [dcr, setDcr] = useState(100); // dark count rate per second
  const [deadTime, setDeadTime] = useState(50); // ns
  const [afterpulseProb, setAfterpulseProb] = useState(0.02); // probability
  const [opticalPower, setOpticalPower] = useState(-60); // dBm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [temp, setTemp] = useState(-20); // °C

  const powerW = Math.pow(10, opticalPower / 10) * 1e-3;
  const photonEnergy = (6.626e-34 * 3e8) / (wavelength * 1e-9);
  const photonsPerSec = powerW / photonEnergy;

  const deadTimeFrac = 1 - Math.exp(-photonsPerSec * deadTime * 1e-9);
  const effectivePDE = pde * (1 - deadTimeFrac) * (1 - afterpulseProb);
  const detectionRate = photonsPerSec * effectivePDE;
  const snr = detectionRate > 0 ? detectionRate / Math.sqrt(detectionRate + dcr) : 0;

  // DCR vs temperature
  const dcrVsTemp = useMemo(() => {
    const temps = Array.from({ length: 200 }, (_, i) => -80 + i * 0.8);
    const dcrVals = temps.map(T => dcr * Math.pow(2, (T - temp) / 6));
    return { temps, dcrVals };
  }, [dcr, temp]);

  // SNR vs optical power
  const snrVsPower = useMemo(() => {
    const pwrDbm = Array.from({ length: 200 }, (_, i) => -90 + i * 0.5);
    const snrVals = pwrDbm.map(p => {
      const pw = Math.pow(10, p / 10) * 1e-3;
      const ph = pw / photonEnergy;
      const dt = 1 - Math.exp(-ph * deadTime * 1e-9);
      const epde = pde * (1 - dt) * (1 - afterpulseProb);
      const dr = ph * epde;
      return dr > 0 ? dr / Math.sqrt(dr + dcr) : 0;
    });
    return { pwrDbm, snrVals };
  }, [pde, dcr, deadTime, afterpulseProb, photonEnergy]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">SPAD Detector Calculator</h1>
      <p className="text-gray-400 mb-8">Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Peak PDE</span>
          <input type="number" value={pde} onChange={e => setPde(+e.target.value)} min="0.01" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Count Rate (counts/s)</span>
          <input type="number" value={dcr} onChange={e => setDcr(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dead Time (ns)</span>
          <input type="number" value={deadTime} onChange={e => setDeadTime(+e.target.value)} min="1" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Afterpulsing Probability</span>
          <input type="number" value={afterpulseProb} onChange={e => setAfterpulseProb(+e.target.value)} min="0" max="0.5" step="0.005"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Optical Power (dBm)</span>
          <input type="number" value={opticalPower} onChange={e => setOpticalPower(+e.target.value)} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Photon Rate</p>
          <p className="text-xl font-bold text-blue-400">{photonsPerSec.toExponential(2)} /s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Detection Rate</p>
          <p className="text-xl font-bold text-green-400">{detectionRate.toExponential(2)} /s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR</p>
          <p className="text-xl font-bold text-yellow-400">{snr.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective PDE</p>
          <p className="text-xl font-bold text-purple-400">{(effectivePDE * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>PDE<sub>eff</sub> = PDE · (1 − P<sub>dead</sub>) · (1 − P<sub>AP</sub>)</p>
        <p>Photon rate: R<sub>ph</sub> = P / (hc/λ)</p>
        <p>SNR = R<sub>det</sub> / √(R<sub>det</sub> + DCR)</p>
        <p>DCR(T) ≈ DCR(T₀) · 2<sup>(T−T₀)/6</sup></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={[
          { x: dcrVsTemp.temps, y: dcrVsTemp.dcrVals, type: "scatter", mode: "lines",
            name: "DCR", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Dark Count Rate vs Temperature", font: { size: 12 } },
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "DCR (counts/s)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />

        <Plot data={[
          { x: snrVsPower.pwrDbm, y: snrVsPower.snrVals, type: "scatter", mode: "lines",
            name: "SNR", line: { color: "#34d399" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Optical Power", font: { size: 12 } },
          xaxis: { title: "Power (dBm)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
