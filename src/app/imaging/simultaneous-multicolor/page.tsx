"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const COLORS = ["#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];

export default function SimultaneousMulticolorPage() {
  const [numChannels, setNumChannels] = useState(3);
  const [excitationNm, setExcitationNm] = useState([488, 561, 640]);
  const [emissionCenter, setEmissionCenter] = useState([525, 580, 680]);
  const [emissionBW, setEmissionBW] = useState([30, 30, 30]);
  const [crosstalk, setCrosstalk] = useState(5);
  const [frameRate, setFrameRate] = useState(30);
  const [pixelSize, setPixelSize] = useState(6.5);
  const [binning, setBinning] = useState(1);
  const [readNoise, setReadNoise] = useState(1.5);
  const [darkCurrent, setDarkCurrent] = useState(0.01);
  const [quantumEff, setQuantumEff] = useState(90);
  const [exposureMs, setExposureMs] = useState(20);

  const effectivePixel = pixelSize * binning;
  const maxFramerate = 1000 / (exposureMs + 2);
  const signalPerChannel = 500 * (quantumEff / 100);
  const snrPerChannel = signalPerChannel / Math.sqrt(signalPerChannel + readNoise ** 2 + darkCurrent * exposureMs / 1000);

  const spectralData = useMemo(() => {
    const x = Array.from({ length: 300 }, (_, i) => 400 + i * 1.5);
    const traces: any[] = [];
    for (let c = 0; c < Math.min(numChannels, 6); c++) {
      const em = emissionCenter[c] || 500;
      const bw = emissionBW[c] || 30;
      const y = x.map(v => Math.exp(-0.5 * ((v - em) / (bw / 2)) ** 2));
      traces.push({
        x, y, type: "scatter", mode: "lines" as const,
        name: `Channel ${c + 1} (${em} nm)`,
        line: { color: COLORS[c], width: 2 },
        fill: "tozeroy", fillcolor: COLORS[c] + "20",
      });
    }
    return traces;
  }, [numChannels, emissionCenter, emissionBW]);

  const crosstalkData = useMemo(() => {
    const channels = Array.from({ length: Math.min(numChannels, 6) }, (_, i) => i + 1);
    const crosstalkMatrix = channels.map((_, i) =>
      channels.map((_, j) => i === j ? 100 : (j < channels.length ? crosstalk * Math.exp(-0.3 * Math.abs(i - j)) : 0))
    );
    const z = crosstalkMatrix;
    return [{
      z, x: channels.map(c => `Ch ${c}`), y: channels.map(c => `Ch ${c}`),
      type: "heatmap" as const, colorscale: "YlOrRd", showscale: true,
      colorbar: { title: "Signal %" },
    }];
  }, [numChannels, crosstalk]);

  const timingData = useMemo(() => {
    const exposures = Array.from({ length: 20 }, (_, i) => 5 + i * 5);
    const maxRates = exposures.map(e => 1000 / (e + 2));
    return [{
      x: exposures, y: maxRates, type: "scatter", mode: "lines" as const,
      name: "Max Frame Rate", line: { color: "#60a5fa", width: 2 },
    }, {
      x: [exposureMs], y: [maxFramerate], type: "scatter", mode: "markers" as const,
      name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [exposureMs, maxFramerate]);

  const handleChannelChange = (idx: number, field: "exc" | "em" | "bw", value: number) => {
    if (field === "exc") {
      const n = [...excitationNm]; n[idx] = value; setExcitationNm(n.length < numChannels ? [...n, ...Array(numChannels - n.length).fill(500)] : n);
    } else if (field === "em") {
      const n = [...emissionCenter]; n[idx] = value; setEmissionCenter(n.length < numChannels ? [...n, ...Array(numChannels - n.length).fill(500)] : n);
    } else {
      const n = [...emissionBW]; n[idx] = value; setEmissionBW(n.length < numChannels ? [...n, ...Array(numChannels - n.length).fill(30)] : n);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Simultaneous Multicolor Imaging</h1>
      <p className="text-gray-400 mb-6">Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Pixel</p>
          <p className="text-2xl font-bold text-blue-400">{effectivePixel.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Frame Rate</p>
          <p className="text-2xl font-bold text-green-400">{Math.min(frameRate, maxFramerate).toFixed(1)} fps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR per Channel</p>
          <p className="text-2xl font-bold text-yellow-400">{snrPerChannel.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Channels</p>
          <p className="text-2xl font-bold text-purple-400">{numChannels}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Channels (1–6)</span>
          <input type="number" value={numChannels} onChange={e => setNumChannels(Math.max(1, Math.min(6, +e.target.value)))} min={1} max={6}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Base Crosstalk (%)</span>
          <input type="number" value={crosstalk} onChange={e => setCrosstalk(+e.target.value)} min={0} max={50} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (ms)</span>
          <input type="number" value={exposureMs} onChange={e => setExposureMs(+e.target.value)} min={1} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Size (µm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={1} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Binning</span>
          <select value={binning} onChange={e => setBinning(+e.target.value)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1×1</option><option value={2}>2×2</option><option value={4}>4×4</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Quantum Efficiency (%)</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} min={10} max={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Read Noise (e⁻)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min={0.1} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min={0} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Channel Configuration</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: numChannels }, (_, i) => (
            <div key={i} className="bg-gray-800 rounded p-3" style={{ borderLeft: `3px solid ${COLORS[i]}` }}>
              <p className="text-sm font-medium mb-2">Channel {i + 1}</p>
              <label className="block text-xs text-gray-400">Excitation (nm)
                <input type="number" value={excitationNm[i] || 500} onChange={e => handleChannelChange(i, "exc", +e.target.value)}
                  className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block text-xs text-gray-400 mt-1">Emission Center (nm)
                <input type="number" value={emissionCenter[i] || 500} onChange={e => handleChannelChange(i, "em", +e.target.value)}
                  className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block text-xs text-gray-400 mt-1">Bandwidth (nm)
                <input type="number" value={emissionBW[i] || 30} onChange={e => handleChannelChange(i, "bw", +e.target.value)}
                  className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Emission Spectra & Separation</h3>
          <Plot data={spectralData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 10 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Crosstalk Matrix (%)</h3>
          <Plot data={crosstalkData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Detector Channel" }, yaxis: { title: "Dye Channel" },
            margin: { t: 30, r: 80, b: 50, l: 50 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Frame Rate vs Exposure Time</h3>
        <Plot data={timingData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Exposure (ms)", gridcolor: "#374151" }, yaxis: { title: "Max Frame Rate (fps)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Effective pixel:</span> p_eff = p_pixel × binning</p>
          <p><span className="text-blue-400">Max frame rate:</span> f_max = 1000 / (t_exp + t_read)</p>
          <p><span className="text-blue-400">SNR:</span> SNR = S / √(S + σ_read² + I_dark × t_exp)</p>
          <p><span className="text-blue-400">Crosstalk:</span> CT(i,j) = overlap(Emission_i, Filter_j) × 100%</p>
        </div>
      </div>
    </div>
  );
}
