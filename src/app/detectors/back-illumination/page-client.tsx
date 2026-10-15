"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { qeRatioSnrGain } from "../../../physics/detectors/noise";

const REGIMES = ["shot", "read"] as const;
type Regime = (typeof REGIMES)[number];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");

// Schematic spectral shape: a Gaussian about 550 nm (σ = 150 nm) scaled to the peak QE; front-illuminated pixels lose
// 70 % below 400 nm in the gate stack. A shape for illustration, not a measured or modelled spectrum.
const shape = (nm: number) => Math.exp(-((nm - 550) ** 2) / (2 * 150 ** 2));
const gateLoss = (nm: number) => (nm < 400 ? 0.3 : 1);

export default function BackIlluminationPage() {
  const [fiRaw, setFiQE] = useURLState("fiQE", 0.4);
  const [biRaw, setBiQE] = useURLState("biQE", 0.95);
  const [cfaRaw, setCfaTransmission] = useURLState("cfaTransmission", 0.25);
  const [gainRaw, setMicrolensGain] = useURLState("microlensGain", 1.3);
  const [regimeRaw, setRegime] = useURLState("regime", "shot");
  const fiQE = clamp(fiRaw, 0, 1, 0.4);
  const biQE = clamp(biRaw, 0, 1, 0.95);
  const cfa = clamp(cfaRaw, 0, 1, 0.25);
  const microlensGain = clamp(gainRaw, 1, 3, 1.3);
  const regime: Regime = REGIMES.find((r) => r === regimeRaw) ?? "shot";

  // The microlens gain cannot push the effective QE above 1.
  const effectiveFi = Math.min(1, fiQE * microlensGain) * cfa;
  const effectiveBi = Math.min(1, biQE * microlensGain) * cfa;
  const qeRatio = effectiveFi > 0 ? effectiveBi / effectiveFi : NaN;
  const snrGain = qeRatioSnrGain(qeRatio, regime);
  const snrGainDb = 20 * Math.log10(snrGain);

  const wl = Array.from({ length: 141 }, (_, i) => 300 + i * 5);
  const fi = wl.map((w) => effectiveFi * shape(w) * gateLoss(w));
  const bi = wl.map((w) => effectiveBi * shape(w));
  const chartData = [
    { x: wl, y: fi.map((v) => v * 100), type: "scatter", mode: "lines", name: "Front-illuminated (schematic)", line: { color: "#f87171" } },
    { x: wl, y: bi.map((v) => v * 100), type: "scatter", mode: "lines", name: "Back-illuminated (schematic)", line: { color: "#60a5fa" } },
    { x: wl, y: wl.map((_, i) => (fi[i] > 0 ? bi[i] / fi[i] : NaN)), type: "scatter", mode: "lines", name: "QE ratio BI/FI", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Front-illuminated peak QE" value={fiRaw} onChange={setFiQE} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Back-illuminated peak QE" value={biRaw} onChange={setBiQE} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="CFA transmission" value={cfaRaw} onChange={setCfaTransmission} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Microlens fill factor gain" value={gainRaw} onChange={setMicrolensGain} min={1} max={3} step="0.1" />
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span>Noise regime:</span>
        {REGIMES.map((r) => (
          <button key={r} onClick={() => setRegime(r)} className={`rounded-full border px-3 py-1 transition ${regime === r ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {r === "shot" ? "Shot-noise limited (SNR ∝ √QE)" : "Read-noise limited (SNR ∝ QE)"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Effective FI QE" value={pct(effectiveFi)} tone="red" />
        <ResultCard label="Effective BI QE" value={pct(effectiveBi)} tone="blue" />
        <ResultCard label="QE Improvement" value={Number.isFinite(qeRatio) ? `${qeRatio.toFixed(2)}×` : "—"} tone="green" subtext={Number.isFinite(qeRatio) ? undefined : "front-side QE is 0"} />
        <ResultCard label="SNR Improvement" value={Number.isFinite(snrGain) ? `${snrGain.toFixed(2)}×` : "—"} tone="yellow" subtext={Number.isFinite(snrGainDb) ? `${snrGainDb.toFixed(2)} dB (20·log₁₀)` : "needs both QEs > 0"} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>QE_eff = min(1, QE·microlens gain)·CFA; SNR gain = √(QE ratio) shot-limited, QE ratio read-limited</p>
        <p>SNR is an amplitude ratio: dB = 20·log₁₀(SNR gain) (QE ratio 4 → 2× → 6.02 dB shot-limited)</p>
        <p>Both sensors share the same CFA and microlens; the BI advantage is the removal of the gate and metal stack</p>
        <p>The spectra are schematic: a Gaussian shape about 550 nm, with a 70 % front-side loss below 400 nm</p>
      </div>
      <ChartPanel data={chartData} layout={{ title: { text: "Schematic spectral response", font: { size: 12 } }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "QE (%)", gridcolor: "#374151" }, yaxis2: { title: "QE ratio", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </>
  );
}
