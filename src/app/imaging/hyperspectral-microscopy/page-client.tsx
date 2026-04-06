"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function HyperspectralMicroscopyPage() {
  const [startNm, setStartNm] = useState(400);
  const [endNm, setEndNm] = useState(720);
  const [spectralBands, setSpectralBands] = useState(32);
  const [spatialPixels, setSpatialPixels] = useState(256);
  const [bitDepth, setBitDepth] = useState(16);
  const [exposureMs, setExposureMs] = useState(100);
  const [numFrames, setNumFrames] = useState(10);
  const [snrDb, setSnrDb] = useState(40);
  const [compression, setCompression] = useState(1);

  const bandwidthNm = (endNm - startNm) / spectralBands;
  const dataSizeMb = (spatialPixels * spatialPixels * spectralBands * bitDepth * numFrames) / (8 * 1024 * 1024);
  const compressedMb = dataSizeMb / compression;
  const acquisitionTime = numFrames * exposureMs / 1000;
  const wavelengthStep = (endNm - startNm) / spectralBands;

  // Simulate 3 endmember spectra for the hyperspectral cube
  const endmemberSpectra = useMemo(() => {
    const wavelengths = Array.from({ length: spectralBands }, (_, i) => startNm + i * wavelengthStep);
    const em1 = wavelengths.map(w => Math.exp(-0.5 * ((w - 520) / 25) ** 2));
    const em2 = wavelengths.map(w => 0.7 * Math.exp(-0.5 * ((w - 580) / 20) ** 2));
    const em3 = wavelengths.map(w => 0.5 * Math.exp(-0.5 * ((w - 650) / 30) ** 2));
    const noise = wavelengths.map(() => 0.05 * (1 / Math.pow(10, snrDb / 20)));
    const mixed = wavelengths.map((_, i) => em1[i] + em2[i] + em3[i] + noise[i]);
    return [
      { x: wavelengths, y: em1, type: "scatter", mode: "lines" as const, name: "Endmember 1 (520nm)", line: { color: "#34d399", width: 2 } },
      { x: wavelengths, y: em2, type: "scatter", mode: "lines" as const, name: "Endmember 2 (580nm)", line: { color: "#fbbf24", width: 2 } },
      { x: wavelengths, y: em3, type: "scatter", mode: "lines" as const, name: "Endmember 3 (650nm)", line: { color: "#f87171", width: 2 } },
      { x: wavelengths, y: mixed, type: "scatter", mode: "lines" as const, name: "Mixed Signal", line: { color: "#60a5fa", width: 2, dash: "dash" } },
    ];
  }, [startNm, endNm, spectralBands, wavelengthStep, snrDb]);

  const dataCubeViz = useMemo(() => {
    // Show a single spectral slice visualization
    const sliceWavelengths = Array.from({ length: 8 }, (_, i) => startNm + i * (endNm - startNm) / 7);
    const intensities = sliceWavelengths.map(w => {
      const val = Math.exp(-0.5 * ((w - 560) / 40) ** 2);
      return val * (1 + 0.1 * Math.sin(w * 0.1));
    });
    return [{
      x: sliceWavelengths, y: intensities, type: "bar" as const,
      marker: { color: sliceWavelengths.map(w => {
        const r = w < 500 ? 0.3 : w < 580 ? (w - 500) / 80 : 1;
        const g = w < 500 ? (w - 400) / 100 : w < 580 ? 1 : Math.max(0, 1 - (w - 580) / 80);
        const b = w < 500 ? 1 : Math.max(0, 1 - (w - 500) / 100);
        return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
      }) },
      name: "Data Cube Slice",
    }];
  }, [startNm, endNm]);

  const sizeData = useMemo(() => {
    const bands = Array.from({ length: 30 }, (_, i) => 8 + i * 8);
    const sizes = bands.map(b => (spatialPixels * spatialPixels * b * bitDepth) / (8 * 1024 * 1024));
    return [{
      x: bands, y: sizes, type: "scatter", mode: "lines" as const,
      name: "Data Cube Size", line: { color: "#a78bfa", width: 2 },
    }, {
      x: [spectralBands], y: [dataSizeMb], type: "scatter", mode: "markers" as const,
      name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [spectralBands, spatialPixels, bitDepth, dataSizeMb]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Hyperspectral Microscopy" description="Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth per Band</p>
          <p className="text-2xl font-bold text-blue-400">{bandwidthNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Raw Data Cube</p>
          <p className="text-2xl font-bold text-green-400">{dataSizeMb.toFixed(1)} MB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Acquisition Time</p>
          <p className="text-2xl font-bold text-yellow-400">{acquisitionTime.toFixed(1)} s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Compressed Size</p>
          <p className="text-2xl font-bold text-purple-400">{compressedMb.toFixed(1)} MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Start Wavelength (nm)" value={startNm} onChange={setStartNm} min={300} max={1000} />
        <ValidatedNumberInput label="End Wavelength (nm)" value={endNm} onChange={setEndNm} min={400} max={1200} />
        <ValidatedNumberInput label="Spectral Bands" value={spectralBands} onChange={setSpectralBands} min={4} max={512} />
        <ValidatedNumberInput label="Spatial Pixels (×)" value={spatialPixels} onChange={setSpatialPixels} min={64} max={4096} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bit Depth</span>
          <select value={bitDepth} onChange={e => setBitDepth(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={8}>8-bit</option><option value={12}>12-bit</option><option value={14}>14-bit</option><option value={16}>16-bit</option>
          </select>
        </label>
        <ValidatedNumberInput label="Exposure per Band (ms)" value={exposureMs} onChange={setExposureMs} min={1} />
        <ValidatedNumberInput label="Number of Frames" value={numFrames} onChange={setNumFrames} min={1} />
        <ValidatedNumberInput label="SNR (dB)" value={snrDb} onChange={setSnrDb} min={0} max={60} />
        <ValidatedNumberInput label="Compression Ratio" value={compression} onChange={setCompression} min={1} max={100} step="0.5" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Endmember Spectra & Mixed Signal</h3>
          <ChartPanel data={endmemberSpectra} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 9 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Data Cube Size vs Bands</h3>
          <ChartPanel data={sizeData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Spectral Bands", gridcolor: "#374151" }, yaxis: { title: "Data Size (MB)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Spectral Slice Visualization</h3>
        <ChartPanel data={dataCubeViz} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 50 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Data cube size:</span> V = N_x × N_y × N_λ × B × N_frames / 8</p>
          <p><span className="text-blue-400">Bandwidth:</span> Δλ = (λ_max − λ_min) / N_bands</p>
          <p><span className="text-blue-400">Acquisition time:</span> T = N_frames × t_exposure</p>
          <p><span className="text-blue-400">Mixed signal:</span> S(λ) = Σᵢ aᵢ · Eᵢ(λ) + noise</p>
          <p><span className="text-blue-400">SNR:</span> SNR(dB) = 20 · log₁₀(Signal / Noise)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
