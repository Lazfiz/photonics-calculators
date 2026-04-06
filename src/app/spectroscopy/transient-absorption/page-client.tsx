"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function TransientAbsorptionPage() {
  const [pumpWavelength, setPumpWavelength] = useState(400);
  const [probeRangeMin, setProbeRangeMin] = useState(400);
  const [probeRangeMax, setProbeRangeMax] = useState(800);
  const [gsAbsorption, setGsAbsorption] = useState(550); // nm, ground state
  const [esAbsorption, setEsAbsorption] = useState(650); // nm, excited state
  const [seCenter, setSeCenter] = useState(480); // nm, stimulated emission
  const [delays, setDelays] = useState("0.1,0.5,1,2,5,10"); // ps

  const chartData = useMemo(() => {
    const N = 300;
    const wavelengths = Array.from({ length: N }, (_, i) => probeRangeMin + (i / N) * (probeRangeMax - probeRangeMin));
    const delayArr = delays.split(",").map(Number).filter(d => !isNaN(d));

    const traces: any[] = [];
    const colors = ["#60a5fa", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#fb7185", "#38bdf8", "#4ade80"];

    delayArr.forEach((delay, idx) => {
      // Ground state bleach (recovers with time)
      const gsbSigma = 30;
      const gsb = wavelengths.map(wl => -0.8 * Math.exp(-(delay / 5)) * Math.exp(-((wl - gsAbsorption) ** 2) / (2 * gsbSigma * gsbSigma)));

      // Excited state absorption (grows then decays)
      const esaSigma = 40;
      const esaBuildup = 1 - Math.exp(-delay / 0.3);
      const esaDecay = Math.exp(-delay / 3);
      const esa = wavelengths.map(wl => 0.6 * esaBuildup * esaDecay * Math.exp(-((wl - esAbsorption) ** 2) / (2 * esaSigma * esaSigma)));

      // Stimulated emission
      const seSigma = 25;
      const se = wavelengths.map(wl => -0.5 * esaBuildup * esaDecay * Math.exp(-((wl - seCenter) ** 2) / (2 * seSigma * seSigma)));

      const total = wavelengths.map((_, i) => gsb[i] + esa[i] + se[i]);

      traces.push({
        x: wavelengths, y: total, type: "scatter", mode: "lines",
        name: `${delay} ps`,
        line: { color: colors[idx % colors.length], width: delay === 0.1 ? 2.5 : 1.5 },
      });
    });

    return traces;
  }, [pumpWavelength, probeRangeMin, probeRangeMax, gsAbsorption, esAbsorption, seCenter, delays]);

  // Kinetic traces at key wavelengths
  const kineticData = useMemo(() => {
    const delayArr = delays.split(",").map(Number).filter(d => !isNaN(d));
    const tTrace = delayArr.map(d => {
      const gsb = -0.8 * Math.exp(-(d / 5));
      const esa = 0.6 * (1 - Math.exp(-d / 0.3)) * Math.exp(-d / 3);
      return gsb + esa;
    });

    return [
      { x: delayArr, y: tTrace, type: "scatter", mode: "lines+markers", name: "Kinetic @ GS band",
        line: { color: "#60a5fa" }, marker: { size: 6 } },
    ];
  }, [delays, gsAbsorption, esAbsorption]);

  const pumpE = 1240 / pumpWavelength;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Transient Absorption Spectroscopy" description="ΔA spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pump Wavelength (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={200} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Probe Range Min (nm)</span>
          <input type="number" value={probeRangeMin} onChange={e => setProbeRangeMin(+e.target.value)} min={200} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Probe Range Max (nm)</span>
          <input type="number" value={probeRangeMax} onChange={e => setProbeRangeMax(+e.target.value)} min={200} max={3000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">GS Absorption Peak (nm)</span>
          <input type="number" value={gsAbsorption} onChange={e => setGsAbsorption(+e.target.value)} min={200} max={3000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">ES Absorption Peak (nm)</span>
          <input type="number" value={esAbsorption} onChange={e => setEsAbsorption(+e.target.value)} min={200} max={3000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">SE Center (nm)</span>
          <input type="number" value={seCenter} onChange={e => setSeCenter(+e.target.value)} min={200} max={3000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Delay Times (ps, comma-separated)</span>
          <input type="text" value={delays} onChange={e => setDelays(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">ΔA:</span> ΔA = −log₁₀(T_pumped / T_unpumped)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">ΔA &lt; 0:</span> GSB + SE (more transmission)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">ΔA &gt; 0:</span> ESA (new absorption from excited state)</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Global analysis:</span> ΔA(λ,t) = Σᵢ Aᵢ(λ) · Cᵢ(t) + ε</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Info</h3>
        <p className="text-sm text-gray-300"><span className="text-green-400">Pump energy:</span> {pumpE.toFixed(2)} eV ({pumpWavelength} nm)</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Probe range:</span> {probeRangeMin}–{probeRangeMax} nm</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Transient Absorption ΔA Spectra", font: { color: "white" } },
          xaxis: { title: "Probe Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "ΔA (a.u.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={kineticData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Kinetic Trace at Ground State Band", font: { color: "white" } },
          xaxis: { title: "Delay (ps)", gridcolor: "#374151" },
          yaxis: { title: "ΔA (a.u.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>
    </CalculatorShell>
  );
}
