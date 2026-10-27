"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  type DoseMode,
  coherentCutoffPeriod,
  fusedSnr,
  incoherentCutoffPeriod,
  singleViewSnr,
  spaceBandwidthGain,
  syntheticNa,
} from "../../../physics/imaging/computational-imaging";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

const MODES: DoseMode[] = ["perView", "totalDose"];
const MODE_LABELS: Record<DoseMode, string> = { perView: "Same signal per view", totalDose: "Same total dose" };
const nm = 1e-9;

export default function ComputationalImagingPage() {
  const [naRaw, setNa] = useURLState("na", 0.1);
  const [naIllRaw, setNaIll] = useURLState("naIll", 0.4);
  const [lambdaRaw, setWavelength] = useURLState("wavelength", 550);
  const [viewsRaw, setNumViews] = useURLState("numViews", 25);
  const [signalRaw, setPhotonCount] = useURLState("photonCount", 1000);
  const [bgRaw, setBgNoise] = useURLState("bgNoise", 10);
  const [readRaw, setReadNoise] = useURLState("readNoise", 2);
  const [modeRaw, setMode] = useURLState("dose", "perView");
  const na = clamp(naRaw, 0.01, 1.7, 0.1);
  const naIll = clamp(naIllRaw, 0, 1.7, 0.4);
  const lambda_nm = clamp(lambdaRaw, 100, 20000, 550);
  const views = Math.round(clamp(viewsRaw, 1, 10000, 25));
  const signal = clamp(signalRaw, 0, 1e9, 1000);
  const background = clamp(bgRaw, 0, 1e9, 10);
  const read = clamp(readRaw, 0, 1000, 2);
  const mode: DoseMode = MODES.find((m) => m === modeRaw) ?? "perView";

  const fusion = { signal, background, read, views, mode };
  const snr1 = singleViewSnr(fusion);
  const snrN = fusedSnr(fusion);
  const naSyn = syntheticNa(na, naIll);
  const pCoherent = coherentCutoffPeriod(lambda_nm * nm, na) / nm;
  const pSynthetic = coherentCutoffPeriod(lambda_nm * nm, naSyn) / nm;
  const pIncoherent = incoherentCutoffPeriod(lambda_nm * nm, na) / nm;
  const sbp = spaceBandwidthGain(na, naIll);

  const nMax = Math.max(100, 2 * views);
  const ns = Array.from(new Set(Array.from({ length: 121 }, (_, i) => Math.round(nMax ** (i / 120))))); // integers, log-spaced 1..nMax
  const snrChart = [
    { x: ns, y: ns.map((n) => fusedSnr({ ...fusion, views: n, mode: "perView" })), type: "scatter" as const, mode: "lines" as const, name: "Per view", line: { color: "#60a5fa", width: mode === "perView" ? 3 : 1.5 } },
    { x: ns, y: ns.map((n) => fusedSnr({ ...fusion, views: n, mode: "totalDose" })), type: "scatter" as const, mode: "lines" as const, name: "Total dose", line: { color: "#f87171", width: mode === "totalDose" ? 3 : 1.5 } },
    { x: [views], y: [snrN], type: "scatter" as const, mode: "markers" as const, name: "Current", line: { color: "#facc15" }, marker: { color: "#facc15", size: 10 } },
  ];

  const illMax = Math.max(1, 1.2 * naIll);
  const ills = Array.from({ length: 101 }, (_, i) => (i * illMax) / 100);
  const resolutionChart = [
    { x: ills, y: ills.map((a) => coherentCutoffPeriod(lambda_nm * nm, syntheticNa(na, a)) / nm), type: "scatter" as const, mode: "lines" as const, name: "Synthetic", line: { color: "#34d399", width: 2 } },
    { x: [0, illMax], y: [pIncoherent, pIncoherent], type: "scatter" as const, mode: "lines" as const, name: "Incoherent", line: { color: "#a78bfa", width: 1.5, dash: "dash" } },
    { x: [naIll], y: [pSynthetic], type: "scatter" as const, mode: "markers" as const, name: "Current", line: { color: "#facc15" }, marker: { color: "#facc15", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {card("Single-view SNR", fmt(snr1, 2), mode === "totalDose" ? `Each view gets 1/${views} of the signal and background` : "S / √(S + B + σ_r²)", "text-yellow-400")}
        {card(`Fused SNR, N = ${views}`, fmt(snrN, 2), mode === "totalDose" ? `S / √(S + B + N·σ_r²); ${fmt(snrN / fusedSnr({ ...fusion, views: 1 }) * 100, 1, " %")} of one exposure` : `√N × single view`, "text-blue-400")}
        {card("Synthetic NA", fmt(naSyn, 3), `Space-bandwidth gain ${fmt(sbp, 1)}× over one coherent image`, "text-green-400")}
        {card("Finest period, synthetic", fmt(pSynthetic, 0, " nm"), `Coherent, objective alone: ${fmt(pCoherent, 0, " nm")}; incoherent widefield: ${fmt(pIncoherent, 0, " nm")}`, "text-purple-400")}
      </div>

      <div role="group" aria-label="Dose" className="flex flex-wrap gap-2 mb-4">
        {MODES.map((m) => (
          <button key={m} onClick={() => setMode(m)} className={buttonClass(mode === m)}>{MODE_LABELS[m]}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Number of views N" value={viewsRaw} onChange={setNumViews} min={1} max={10000} step="1" />
        <ValidatedNumberInput label={mode === "totalDose" ? "Signal, total over N views (e⁻ per pixel)" : "Signal per view (e⁻ per pixel)"} value={signalRaw} onChange={setPhotonCount} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label={mode === "totalDose" ? "Background, total (mean e⁻ per pixel)" : "Background per view (mean e⁻ per pixel)"} value={bgRaw} onChange={setBgNoise} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Read noise per exposure (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.01} max={1.7} step="any" />
        <ValidatedNumberInput label="Illumination NA (largest LED angle)" value={naIllRaw} onChange={setNaIll} min={0} max={1.7} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setWavelength} min={100} max={20000} step="any" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Fused SNR vs number of views</h3>
          <ChartPanel data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Number of views N", type: "log", gridcolor: "#374151" },
            yaxis: { title: "SNR", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Finest resolved period vs illumination NA</h3>
          <ChartPanel data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Illumination NA", gridcolor: "#374151" },
            yaxis: { title: "Period (nm)", type: "log", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">One view:</span> SNR₁ = S / √(S + B + σ_r²)</p>
          <p><span className="text-blue-400">Same signal per view:</span> SNR_N = √N · SNR₁</p>
          <p><span className="text-blue-400">Same total dose:</span> SNR_N = S / √(S + B + N·σ_r²)</p>
          <p><span className="text-blue-400">Synthetic aperture:</span> NA_syn = NA_obj + NA_ill, finest period λ / NA_syn</p>
          <p><span className="text-blue-400">Space-bandwidth gain:</span> (NA_syn / NA_obj)²</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          The N views are independent and summed with equal weights after registration; B is the mean background under the
          signal, so it adds its shot noise. Splitting a fixed dose costs only read noise, so fusion is free in the
          shot-noise limit. The synthetic aperture is that of Fourier ptychography: coherent images under tilted plane-wave
          illumination stitched in Fourier space, which needs overlapping pupils and a phase-retrieval solver that
          converges. With NA_ill = NA_obj the coherent synthetic cutoff equals the incoherent widefield limit λ/(2NA_obj).
        </p>
      </div>
    </>
  );
}
