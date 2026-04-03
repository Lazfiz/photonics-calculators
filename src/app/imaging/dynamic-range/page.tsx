"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DynamicRangePage() {
  const [fullWellCapacity, setFullWellCapacity] = useState(30000);
  const [readNoise, setReadNoise] = useState(2);
  const [darkCurrent, setDarkCurrent] = useState(0.05);
  const [exposureTime, setExposureTime] = useState(100);
  const [bitDepth, setBitDepth] = useState(14);
  const [prnu, setPrnu] = useState(0.01);
  const [dsnu, setDsnu] = useState(0.005);

  const results = useMemo(() => {
    const darkElectrons = darkCurrent * exposureTime / 1000;
    const totalReadNoise = Math.sqrt(readNoise * readNoise + darkElectrons + dsnu * dsnu * fullWellCapacity);
    const drDB = 20 * Math.log10(fullWellCapacity / totalReadNoise);
    const drStops = Math.log2(fullWellCapacity / totalReadNoise);
    const drBits = drDB / 6.02;
    const maxDN = Math.pow(2, bitDepth) - 1;
    const systemDR = Math.min(drStops, bitDepth);
    const adcLimited = bitDepth < drStops;
    const snrAtHalf = (fullWellCapacity / 2) / Math.sqrt(fullWellCapacity / 2 + totalReadNoise * totalReadNoise);

    const signals: number[] = [];
    const snrVals: number[] = [];
    for (let s = 0.1; s <= fullWellCapacity; s += fullWellCapacity / 500) {
      signals.push(s);
      const noise = Math.sqrt(s + totalReadNoise * totalReadNoise + (prnu * s) * (prnu * s));
      snrVals.push(s / noise);
    }

    return { darkElectrons, totalReadNoise, drDB, drStops, drBits, maxDN, systemDR, adcLimited, snrAtHalf, signals, snrVals };
  }, [fullWellCapacity, readNoise, darkCurrent, exposureTime, bitDepth, prnu, dsnu]);

  const plotData = useMemo(() => [
    {
      x: results.signals, y: results.snrVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "SNR vs signal", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: [results.signals[0], results.signals[results.signals.length - 1]],
      y: [1, 1], type: "scatter" as const, mode: "lines" as const,
      name: "SNR = 1 (floor)", line: { color: "#f87171", width: 1, dash: "dash" },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Signal (e⁻)", gridcolor: "#374151" },
    yaxis: { title: "SNR", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Dynamic Range Calculator" description="Imaging system dynamic range, noise floor, and ADC-limited performance analysis.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Well Capacity (e⁻)</label>
            <input type="number" step={100} min={100} max={500000} value={fullWellCapacity} onChange={e => setFullWellCapacity(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Read Noise (e⁻ rms)</label>
            <input type="number" step={0.1} min={0.1} max={100} value={readNoise} onChange={e => setReadNoise(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dark Current (e⁻/s/pixel)</label>
            <input type="number" step={0.01} min={0} max={100} value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exposure Time (ms)</label>
            <input type="number" step={1} min={1} max={60000} value={exposureTime} onChange={e => setExposureTime(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ADC Bit Depth</label>
            <input type="number" step={1} min={8} max={24} value={bitDepth} onChange={e => setBitDepth(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">PRNU (%)</label>
            <input type="number" step={0.1} min={0} max={10} value={prnu} onChange={e => setPrnu(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">DSNU (%)</label>
            <input type="number" step={0.1} min={0} max={10} value={dsnu} onChange={e => setDsnu(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Total Read Noise</div>
              <div className="text-xl font-mono text-red-400">{results.totalReadNoise.toFixed(2)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dark Electrons</div>
              <div className="text-xl font-mono text-yellow-400">{results.darkElectrons.toFixed(3)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Sensor DR</div>
              <div className="text-xl font-mono text-green-400">{results.drDB.toFixed(1)} dB ({results.drStops.toFixed(1)} stops)</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">System DR (min)</div>
              <div className="text-xl font-mono text-blue-400">{results.systemDR.toFixed(1)} stops</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">ADC Limited?</div>
              <div className="text-xl font-mono text-purple-400">{results.adcLimited ? "YES ⚠️" : "No ✓"}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">SNR at Half FWC</div>
              <div className="text-xl font-mono text-yellow-400">{results.snrAtHalf.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>σ_total = √(σ²_read + N_dark + DSNU²·FWC)</p>
          <p>DR = 20·log₁₀(FWC / σ_total) [dB]</p>
          <p>DR_stops = log₂(FWC / σ_total)</p>
          <p>SNR = S / √(S + σ²_total + (PRNU·S)²)</p>
          <p>System DR = min(DR_sensor, bit_depth)</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Dynamic range defines the ratio between the largest and smallest detectable signal. PRNU (photo response non-uniformity) and DSNU (dark signal non-uniformity) are fixed-pattern noise sources that can limit DR at high signal levels.</p>
          <p>When ADC bit depth is less than the sensor DR in stops, the system is ADC-limited and loses information. High-end sCMOS sensors (~30,000 e⁻ FWC, ~1.5 e⁻ read noise) achieve ~84 dB, exceeding 14-bit ADC (84 dB) but fitting within 16-bit (96 dB).</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
