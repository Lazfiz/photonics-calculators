"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { binnedReadNoise, cameraNoise, framesForSnr } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const ROSE_SNR = 5;

export default function SignalToNoisePage() {
  const [signalRaw, setSignalPhotons] = useURLState("signalPhotons", 5000);
  const [backgroundRaw, setBackgroundPhotons] = useURLState("backgroundPhotons", 500);
  const [qeRaw, setQuantumEfficiency] = useURLState("quantumEfficiency", 0.7);
  const [readRaw, setReadNoise] = useURLState("readNoise", 1.5);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", 0.1);
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", 100);
  const [binningRaw, setBinning] = useURLState("binning", 1);
  const [binModeRaw, setBinMode] = useURLState("binningMode", "charge");
  const [framesRaw, setNumFrames] = useURLState("numFrames", 1);
  const [targetRaw, setTargetSnr] = useURLState("targetSnr", 100);

  const signalPhotons = clamp(signalRaw, 0, 1e7, 5000);
  const backgroundPhotons = clamp(backgroundRaw, 0, 1e7, 500);
  const qe = clamp(qeRaw, 0.01, 1, 0.7);
  const read = clamp(readRaw, 0, 100, 1.5);
  const darkRate = clamp(darkRaw, 0, 1e4, 0.1);
  const exposureMs = clamp(exposureRaw, 0.01, 3.6e6, 100);
  const binning = Math.round(clamp(binningRaw, 1, 8, 1));
  const binMode = binModeRaw === "digital" ? "digital" : "charge";
  const frames = Math.round(clamp(framesRaw, 1, 1e4, 1));
  const targetSnr = clamp(targetRaw, 1, 1e5, 100);

  // Per super-pixel and frame: b² pixels add their photoelectrons and dark charge.
  const pixels = binning ** 2;
  const readBinned = binnedReadNoise(read, binning, binMode);
  const dark = ((darkRate * exposureMs) / 1000) * pixels;
  const evaluate = (photons: number, bgPhotons: number) => {
    const signal = qe * photons * pixels;
    const noise = cameraNoise({ signal, background: qe * bgPhotons * pixels, dark, read: readBinned });
    return { signal, noise, snr: noise > 0 ? signal / noise : NaN };
  };
  const r = evaluate(signalPhotons, backgroundPhotons);
  const snrAveraged = r.snr * Math.sqrt(frames);
  const background = qe * backgroundPhotons * pixels;
  const framesNeeded = framesForSnr(r.snr, targetSnr);

  // Variance budget of one frame: each Poisson term adds its mean, the read noise its square.
  const budget = [
    { name: "Signal shot noise", variance: r.signal },
    { name: "Background shot noise", variance: background },
    { name: "Dark-charge shot noise", variance: dark },
    { name: "Read noise", variance: readBinned ** 2 },
  ];
  const totalVariance = r.noise ** 2;
  const dominant = budget.reduce((a, b) => (b.variance > a.variance ? b : a));

  // SNR against the number of averaged frames, 1 to 10⁴ on a log grid.
  const frameAxis = Array.from({ length: 41 }, (_, i) => 10 ** (i / 10));
  const framesChart = [
    {
      x: frameAxis, y: frameAxis.map(n => r.snr * Math.sqrt(n)),
      type: "scatter" as const, mode: "lines" as const, name: "SNR·√N", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: [1, 1e4], y: [targetSnr, targetSnr],
      type: "scatter" as const, mode: "lines" as const, name: `Target SNR ${fmt(targetSnr, 0)}`, line: { color: "#fbbf24", width: 1, dash: "dash" },
    },
    {
      x: [frames], y: [snrAveraged],
      type: "scatter" as const, mode: "markers" as const, name: `${frames} frame${frames > 1 ? "s" : ""}`,
      line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 },
    },
  ];

  const bgAxis = Array.from({ length: 201 }, (_, i) => 50 * i);
  const chartData = [
    {
      x: bgAxis, y: bgAxis.map(bg => evaluate(signalPhotons, bg).snr * Math.sqrt(frames)),
      type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: bgAxis, y: bgAxis.map(() => Math.sqrt(r.signal * frames)),
      type: "scatter" as const, mode: "lines" as const, name: "Shot-noise limit √(S·N)", line: { color: "#34d399", width: 1, dash: "dash" },
    },
    {
      x: [0, bgAxis[bgAxis.length - 1]], y: [ROSE_SNR, ROSE_SNR],
      type: "scatter" as const, mode: "lines" as const, name: "Rose criterion (SNR = 5)", line: { color: "#f87171", width: 1, dash: "dot" },
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal Photons (per pixel)" value={signalRaw} onChange={setSignalPhotons} min={0} max={10000000} />
        <ValidatedNumberInput label="Background Photons (per pixel)" value={backgroundRaw} onChange={setBackgroundPhotons} min={0} max={10000000} />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQuantumEfficiency} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Dark Current (e⁻/s/pixel)" value={darkRaw} onChange={setDarkCurrent} min={0} max={10000} />
        <ValidatedNumberInput label="Exposure Time (ms)" value={exposureRaw} onChange={setExposureTime} min={0.01} max={3600000} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Binning</span>
          <select value={binning} onChange={(e) => setBinning(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(b => <option key={b} value={b}>{b}×{b}</option>)}
          </select>
          <select value={binMode} onChange={(e) => setBinMode(e.target.value)} className="mt-2 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="charge">Charge binning (CCD): one read</option>
            <option value="digital">Digital sum (CMOS): B² reads</option>
          </select>
        </label>
        <ValidatedNumberInput label="Number of Frames (averaged)" value={framesRaw} onChange={setNumFrames} min={1} max={10000} />
        <ValidatedNumberInput label="Target SNR" value={targetRaw} onChange={setTargetSnr} min={1} max={100000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Signal" value={`${fmt(r.signal, 1)} e⁻`} subtext={`Background ${fmt(background, 1)} e⁻, dark ${fmt(dark, 3)} e⁻`} tone="green" />
        <ResultCard label="Read Noise per Super-Pixel" value={`${fmt(readBinned, 2)} e⁻`} subtext={binMode === "charge" ? "Charge binning: read once" : `Digital sum: ${binning}·σ_read`} tone="purple" />
        <ResultCard label="Total Noise (one frame)" value={`${fmt(r.noise, 2)} e⁻`} subtext={`Shot noise of the signal ${fmt(Math.sqrt(r.signal), 2)} e⁻`} tone="orange" />
        <ResultCard label="SNR (one frame)" value={fmt(r.snr, 3)} tone="blue" />
        <ResultCard label={`SNR (${frames} frame${frames > 1 ? "s" : ""} averaged)`} value={fmt(snrAveraged, 3)} subtext="SNR·√N" tone="blue" />
        <ResultCard
          label="Rose Criterion"
          value={snrAveraged >= ROSE_SNR ? "Detectable" : "Below SNR 5"}
          subtext="SNR ≥ 5 to see a feature reliably"
          tone={snrAveraged >= ROSE_SNR ? "green" : "red"}
        />
        <ResultCard
          label={`Frames for SNR ${fmt(targetSnr, 0)}`}
          value={Number.isFinite(framesNeeded) ? framesNeeded.toLocaleString("en-US") : "—"}
          subtext={Number.isFinite(framesNeeded) ? "⌈(SNR_target/SNR₁)²⌉, white noise" : "No signal: averaging can't reach any SNR"}
          tone="yellow"
        />
        <ResultCard
          label="Dominant Noise (one frame)"
          value={totalVariance > 0 ? dominant.name : "—"}
          subtext={totalVariance > 0 ? `${fmt((100 * dominant.variance) / totalVariance, 1)} % of the variance` : "No noise"}
          tone="gray"
        />
      </div>

      <ChartPanel data={chartData} layout={{ xaxis: { title: "Background (photons/pixel)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />

      <div className="bg-gray-900 rounded-lg p-4 mt-8">
        <h3 className="text-lg font-semibold mb-2">Noise Budget (one frame)</h3>
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400"><th className="py-1">Source</th><th className="py-1">σ (e⁻ rms)</th><th className="py-1">Share of variance</th></tr>
          </thead>
          <tbody className="font-mono">
            {budget.map(b => (
              <tr key={b.name}>
                <td className="py-1 font-sans">{b.name}</td>
                <td className="py-1">{fmt(Math.sqrt(b.variance), 2)}</td>
                <td className="py-1">{totalVariance > 0 ? `${fmt((100 * b.variance) / totalVariance, 1)} %` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-gray-400 mt-2">Independent sources add in quadrature, so the largest share of the variance sets the SNR.</p>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-2">Averaging Frames or Co-adding Scans</h3>
      <ChartPanel data={framesChart} layout={{ xaxis: { title: "Frames averaged N", type: "log", gridcolor: "#374151" }, yaxis: { title: "SNR", type: "log", gridcolor: "#374151" } }} />
      <p className="text-sm text-gray-400 mt-2">
        The same √N law holds for co-added spectra. It assumes noise that is independent from frame to frame; drift,
        fixed-pattern noise and 1/f noise are correlated and set a floor that averaging can&apos;t lower.
      </p>

      <div className="bg-gray-900 rounded-lg p-4 mt-8 text-sm text-gray-300 font-mono space-y-1">
        <p>S = QE·N_signal·B², S_bg = QE·N_bg·B², D = R_dark·t·B²</p>
        <p>SNR = S / √(S + S_bg + D + σ_read,B²); σ_read,B = σ_read (charge) or B·σ_read (digital)</p>
        <p>N averaged frames: SNR_N = √N·SNR; frames for a target: N = ⌈(SNR_target/SNR)²⌉; Rose criterion SNR ≥ 5</p>
      </div>
    </>
  );
}
