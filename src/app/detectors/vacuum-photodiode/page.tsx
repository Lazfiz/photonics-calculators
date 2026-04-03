"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function VacuumPhotodiodePage() {
  const [quantumEff, setQuantumEff] = useState(0.25);
  const [anodeVoltage, setAnodeVoltage] = useState(100); // V
  const [cathodeArea, setCathodeArea] = useState(100); // mm²
  const [wavelength, setWavelength] = useState(300); // nm (UV)
  const [incidentPower, setIncidentPower] = useState(1e-6); // W
  const [loadResistance, setLoadResistance] = useState(50); // Ω
  const [temperature, setTemperature] = useState(25); // °C

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c);
    const iPhoto = incidentPower * resp;
    const vOut = iPhoto * loadResistance;
    // Dark current for vacuum photodiode (thermionic + leakage)
    const thermionicCurrent = 1.2e6 * cathodeArea * 1e-6 * Math.exp(-11600 * 1.2 / (273.15 + temperature)); // Richardson-Dushman simplified
    const darkCurrent = Math.max(thermionicCurrent, 1e-12);
    const snr = iPhoto / Math.sqrt(2 * q * (iPhoto + darkCurrent) * 1e9 / (2 * Math.PI * loadResistance * cathodeArea * 1e-6 * 1e-12));
    const transitTime = 0.1 * Math.sqrt(cathodeArea * 1e-6) / 1e5 * 1e12; // ps, rough
    const bandwidth = 0.35 / (transitTime * 1e-12); // Hz
    return { resp, iPhoto, vOut, darkCurrent, transitTime, bandwidth };
  }, [quantumEff, anodeVoltage, cathodeArea, wavelength, incidentPower, loadResistance, temperature]);

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 150 + i * 2.5);
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    // Simple QE model: rises at cutoff, peaks mid-band
    const cutoff = 1100; // nm for Si photocathode
    const qe = wavelengths.map(l => {
      if (l > cutoff) return 0;
      const uvPeak = 0.25 * Math.exp(-0.5 * ((l - 300) / 200) ** 2);
      const visResp = 0.15 * Math.exp(-0.5 * ((l - 450) / 150) ** 2);
      return Math.min(quantumEff / 0.25, uvPeak + visResp);
    });
    const resp = wavelengths.map((l, i) => (qe[i] * q * l * 1e-9) / (h * c));
    return [
      { x: wavelengths, y: qe, type: "scatter", mode: "lines", name: "QE", line: { color: "#60a5fa" } },
      { x: wavelengths, y: resp.map(r => r * 1e3), type: "scatter", mode: "lines", name: "Responsivity (mA/W)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [quantumEff]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Vacuum Photodiode</h1>
      <p className="text-gray-400 mb-8">Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Anode Voltage (V)</span>
          <input type="number" value={anodeVoltage} onChange={e => setAnodeVoltage(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Cathode Area (mm²)</span>
          <input type="number" value={cathodeArea} onChange={e => setCathodeArea(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Incident Power (W)</span>
          <input type="number" value={incidentPower} onChange={e => setIncidentPower(+e.target.value)} step="1e-9" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Load Resistance (Ω)</span>
          <input type="number" value={loadResistance} onChange={e => setLoadResistance(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Responsivity = <span className="text-blue-400 font-mono">{(results.resp * 1e3).toFixed(3)} mA/W</span></p>
        <p className="text-gray-300">Photocurrent = <span className="text-blue-400 font-mono">{(results.iPhoto * 1e6).toFixed(3)} µA</span></p>
        <p className="text-gray-300">Voltage across load = <span className="text-blue-400 font-mono">{(results.vOut * 1e3).toFixed(3)} mV</span></p>
        <p className="text-gray-300">Dark current ≈ <span className="text-blue-400 font-mono">{results.darkCurrent.toExponential(2)} A</span></p>
        <p className="text-gray-300">Transit time ≈ <span className="text-blue-400 font-mono">{results.transitTime.toFixed(1)} ps</span></p>
        <p className="text-gray-300">Est. bandwidth ≈ <span className="text-blue-400 font-mono">{(results.bandwidth / 1e9).toFixed(1)} GHz</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ / (h·c)</p>
        <p>I<sub>photo</sub> = P · R</p>
        <p>J<sub>th</sub> = A<sub>RD</sub>·T² · exp(-eφ / k<sub>B</sub>T)  [Richardson-Dushman]</p>
        <p>τ<sub>transit</sub> ≈ d / v<sub>drift</sub></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Quantum Efficiency", gridcolor: "#374151", range: [0, 0.4] },
        yaxis2: { title: "Responsivity (mA/W)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 80 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
