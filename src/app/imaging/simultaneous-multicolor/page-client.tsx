"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

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
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Simultaneous Multicolor Imaging" description="Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.">
            
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
        <ValidatedNumberInput label="Number of Channels (1–6)" value={numChannels} onChange={setNumChannels} min={1} max={6} />
        <ValidatedNumberInput label="Base Crosstalk (%)" value={crosstalk} onChange={setCrosstalk} min={0} max={50} step="0.5" />
        <ValidatedNumberInput label="Exposure Time (ms)" value={exposureMs} onChange={setExposureMs} min={1} step="1" />
        <ValidatedNumberInput label="Pixel Size (µm)" value={pixelSize} onChange={setPixelSize} min={1} step="0.1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Binning</span>
          <select value={binning} onChange={e => setBinning(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1×1</option><option value={2}>2×2</option><option value={4}>4×4</option>
          </select>
        </label>
        <ValidatedNumberInput label="Quantum Efficiency (%)" value={quantumEff} onChange={setQuantumEff} min={10} max={100} />
        <ValidatedNumberInput label="Read Noise (e⁻)" value={readNoise} onChange={setReadNoise} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Dark Current (e⁻/pix/s)" value={darkCurrent} onChange={setDarkCurrent} min={0} step="0.001" />
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
          <ChartPanel data={spectralData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Crosstalk Matrix (%)</h3>
          <ChartPanel data={crosstalkData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Detector Channel" }, yaxis: { title: "Dye Channel" },
            margin: { t: 30, r: 80, b: 50, l: 50 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Frame Rate vs Exposure Time</h3>
        <ChartPanel data={timingData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Exposure (ms)", gridcolor: "#374151" }, yaxis: { title: "Max Frame Rate (fps)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 },
        }} />
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
    </CalculatorShell>
  );
}
