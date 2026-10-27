"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cameraSnr } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const MIB = 1024 * 1024;

export default function HyperspectralMicroscopyPage() {
  const [startRaw, setStart] = useURLState("startNm", 400);
  const [endRaw, setEnd] = useURLState("endNm", 720);
  const [bandsRaw, setBands] = useURLState("spectralBands", 32);
  const [pixelsRaw, setPixels] = useURLState("spatialPixels", 256);
  const [bitDepthRaw, setBitDepth] = useURLState("bitDepth", 16);
  const [exposureRaw, setExposure] = useURLState("exposureMs", 100);
  const [framesRaw, setFrames] = useURLState("numFrames", 10);
  const [compressionRaw, setCompression] = useURLState("compression", 1);
  const [fluxRaw, setFlux] = useURLState("spectralFlux", 1000); // photons/pixel/s/nm at the camera
  const [qeRaw, setQe] = useURLState("quantumEff", 80); // %
  const [readRaw, setRead] = useURLState("readNoise", 1.5); // e⁻ rms
  const [darkRaw, setDark] = useURLState("darkCurrent", 0.5); // e⁻/pixel/s

  const start = clamp(startRaw, 300, 1000, 400);
  const end = Math.max(start + 1, clamp(endRaw, 400, 1200, 720));
  const bands = Math.round(clamp(bandsRaw, 1, 512, 32));
  const pixels = Math.round(clamp(pixelsRaw, 16, 4096, 256));
  const bitDepth = [8, 10, 12, 14, 16].includes(bitDepthRaw) ? bitDepthRaw : 16;
  const exposure = clamp(exposureRaw, 0.01, 1e5, 100) * 1e-3;
  const frames = Math.round(clamp(framesRaw, 1, 1e4, 10));
  const compression = clamp(compressionRaw, 1, 100, 1);
  const flux = clamp(fluxRaw, 0, 1e9, 1000);
  const qe = clamp(qeRaw, 1, 100, 80) / 100;
  const readNoise = clamp(readRaw, 0, 100, 1.5);
  const dark = clamp(darkRaw, 0, 1e4, 0.5);

  // Data cube, bits packed: N_x·N_y·N_λ·bits·frames/8 bytes.
  const bandwidth = (end - start) / bands;
  const bytes = (pixels * pixels * bands * bitDepth * frames) / 8;
  const sizeMiB = bytes / MIB;
  const totalTime = frames * bands * exposure;

  // Band-sequential acquisition with a flat spectrum: S = Φ_λ·Δλ·t·QE electrons per band and frame.
  const snrBand = (dl: number, t: number, nFrames = 1) => {
    const S = flux * dl * t * qe;
    // Summing n frames: signal n·S, variance n·(S + D) + n·σ_r², so SNR grows as √n.
    return Math.sqrt(nFrames) * cameraSnr({ signal: S, read: readNoise, dark: dark * t });
  };
  const signal = flux * bandwidth * exposure * qe;
  const snrFrame = snrBand(bandwidth, exposure);
  const snrSum = snrBand(bandwidth, exposure, frames);

  const bandGrid = (() => { const top = Math.max(256, 2 * bands); return Array.from({ length: 64 }, (_, i) => 1 + ((top - 1) * i) / 63); })();
  const range = end - start;
  const snrChart = [
    { x: bandGrid, y: bandGrid.map((n) => snrBand(range / n, exposure, frames)), type: "scatter" as const, mode: "lines" as const, name: "Same exposure per band", line: { color: "#60a5fa", width: 2 } },
    { x: bandGrid, y: bandGrid.map((n) => snrBand(range / n, (exposure * bands) / n, frames)), type: "scatter" as const, mode: "lines" as const, name: "Same total time", line: { color: "#f87171", width: 2 } },
    { x: [bands], y: [snrSum], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } },
  ];
  const sizeChart = [
    { x: bandGrid, y: bandGrid.map((n) => (pixels * pixels * n * bitDepth * frames) / 8 / MIB), type: "scatter" as const, mode: "lines" as const, name: "Raw cube", line: { color: "#a78bfa", width: 2 } },
    { x: [bands], y: [sizeMiB], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        {[
          ["Band width Δλ", fmt(bandwidth, 2, " nm"), "text-blue-400"],
          ["Raw data, all frames", fmt(sizeMiB, 1, " MiB"), "text-green-400"],
          ["One cube", fmt(sizeMiB / frames, 1, " MiB"), "text-green-300"],
          ["Acquisition time", fmt(totalTime, 1, " s"), "text-yellow-400"],
          ["SNR per band, frames summed", fmt(snrSum, 1), "text-purple-400"],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Start wavelength (nm)" value={startRaw} onChange={setStart} min={300} max={1000} />
        <ValidatedNumberInput label="End wavelength (nm)" value={endRaw} onChange={setEnd} min={400} max={1200} />
        <ValidatedNumberInput label="Spectral bands" value={bandsRaw} onChange={setBands} min={1} max={512} step="1" />
        <ValidatedNumberInput label="Spatial pixels per side" value={pixelsRaw} onChange={setPixels} min={16} max={4096} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bit depth (packed)</span>
          <select value={bitDepth} onChange={(e) => setBitDepth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {[8, 10, 12, 14, 16].map((b) => <option key={b} value={b}>{b}-bit</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Exposure per band (ms)" value={exposureRaw} onChange={setExposure} min={0.01} max={1e5} />
        <ValidatedNumberInput label="Frames (cubes) summed" value={framesRaw} onChange={setFrames} min={1} max={1e4} step="1" />
        <ValidatedNumberInput label="Compression ratio" value={compressionRaw} onChange={setCompression} min={1} max={100} step="0.5" />
        <ValidatedNumberInput label="Spectral photon flux (photons/pixel/s/nm)" value={fluxRaw} onChange={setFlux} min={0} max={1e9} />
        <ValidatedNumberInput label="Quantum efficiency (%)" value={qeRaw} onChange={setQe} min={1} max={100} />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readRaw} onChange={setRead} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Dark current (e⁻/pixel/s)" value={darkRaw} onChange={setDark} min={0} max={1e4} step="0.1" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2 text-sm">
          <h3 className="text-lg font-semibold mb-1">Per band</h3>
          {[
            ["Signal per band and frame", fmt(signal, 0, " e⁻")],
            ["SNR, one frame", fmt(snrFrame, 1)],
            [`SNR, ${frames} frames summed`, fmt(snrSum, 1)],
            ["Compressed size", fmt(sizeMiB / compression, 1, " MiB")],
            ["Raw data rate (exposure-limited)", fmt(sizeMiB / totalTime, 2, " MiB/s")],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">{label}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">SNR per band vs number of bands</h3>
          <ChartPanel data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Spectral bands", gridcolor: "#374151" }, yaxis: { title: "SNR, frames summed", gridcolor: "#374151", type: "log" },
            margin: { t: 30, r: 20, b: 50, l: 60 }, showlegend: true,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Data cube size vs bands</h3>
        <ChartPanel data={sizeChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Spectral bands", gridcolor: "#374151" }, yaxis: { title: "Raw size (MiB)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 }, showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-1 text-sm text-gray-300 font-mono">
          <p>V = N_x N_y N_λ bits N_frames / 8 bytes (1 MiB = 2²⁰ bytes), T = N_frames N_λ t</p>
          <p>Δλ = (λ_max − λ_min)/N_λ, S = Φ_λ Δλ t QE</p>
          <p>SNR = √N_frames · S / √(S + I_dark t + σ_read²)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Band-sequential acquisition (tunable filter or scanned bands) of a flat spectrum: each band collects the photons in
          its own width Δλ. At a fixed exposure per band, more bands means narrower bands and fewer photons each; at a fixed
          total time the exposure per band drops as well, so the shot-noise-limited SNR falls as 1/N_λ. Snapshot and
          line-scan (push-broom) spectrometers, filter transmission and the camera&apos;s full well are not modelled. Sizes
          assume bit-packed samples; most cameras store 12- and 14-bit data in 16-bit words.
        </p>
      </div>
    </>
  );
}
