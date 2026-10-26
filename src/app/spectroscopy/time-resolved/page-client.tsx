"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  amplitudeWeightedLifetime, convolvedDecay, decayIntensity, gaussianPulseBandwidth, intensityWeightedLifetime, periodicDecay,
  type DecayComponent,
} from "../../../physics/spectroscopy/fluorescence-lifetime";
import { GAUSSIAN_FWHM_PER_SIGMA } from "../../../physics/math";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
/** Values above 1e-5 of the peak only, rounded for the log axis; others become gaps. */
const logY = (x: number) => (Number.isFinite(x) && x > 1e-5 ? Number(x.toPrecision(6)) : NaN);
const FWHM_TO_SIGMA = 1 / GAUSSIAN_FWHM_PER_SIGMA;
const ns = 1e-9;

export default function TimeResolvedPage() {
  const [repRaw, setRep] = useURLState("laserRepRate", 80);
  const [pulseRaw, setPulse] = useURLState("pulseWidthFs", 100);
  const [laserNmRaw, setLaserNm] = useURLState("laserWavelength", 800);
  const [irfRaw, setIrf] = useURLState("instrumentResponse", 200);
  const [t0Raw, setT0] = useURLState("irfDelay", 0.5);
  const [tau1Raw, setTau1] = useURLState("lifetime", 2);
  const [tau2Raw, setTau2] = useURLState("lifetime2", 8);
  const [a2Raw, setA2] = useURLState("fraction2", 0);
  const [rangeRaw, setRange] = useURLState("timeRange", 10);

  const rep = clamp(repRaw, 1e-3, 1e4, 80) * 1e6;
  const period = 1 / rep;
  const pulse = clamp(pulseRaw, 1, 1e9, 100) * 1e-15;
  const laserNm = clamp(laserNmRaw, 100, 1e4, 800);
  const irf = clamp(irfRaw, 0, 1e6, 200) * 1e-12;
  const sigma = irf * FWHM_TO_SIGMA;
  const t0 = clamp(t0Raw, 0, 1e4, 0.5) * ns;
  const tau1 = clamp(tau1Raw, 1e-3, 1e5, 2) * ns;
  const tau2 = clamp(tau2Raw, 1e-3, 1e5, 8) * ns;
  const a2 = clamp(a2Raw, 0, 1, 0);
  const range = clamp(rangeRaw, 0.01, 1e5, 10) * ns;

  const components: DecayComponent[] = a2 > 0 ? [{ amplitude: 1 - a2, lifetime: tau1 }, { amplitude: a2, lifetime: tau2 }] : [{ amplitude: 1, lifetime: tau1 }];
  const tauInt = intensityWeightedLifetime(components);
  const tauAmp = amplitudeWeightedLifetime(components);
  const tauLong = Math.max(...components.map((c) => c.lifetime));
  const leftover = Math.exp(-period / tauLong);
  // photons of one pulse emitted after the next pulse: Σ αᵢτᵢ e^(−T/τᵢ) / Σ αᵢτᵢ
  const lateFraction = components.reduce((s, c) => s + c.amplitude * c.lifetime * Math.exp(-period / c.lifetime), 0)
    / components.reduce((s, c) => s + c.amplitude * c.lifetime, 0);
  const bw = gaussianPulseBandwidth(pulse, laserNm * 1e-9);

  // uniform grid plus a dense window around the IRF, so a narrow IRF is drawn
  const uniform = Array.from({ length: 601 }, (_, i) => (i / 600) * range);
  const dense = sigma > 0 ? Array.from({ length: 201 }, (_, i) => t0 + (i / 100 - 1) * 5 * sigma).filter((t) => t >= 0 && t <= range) : [];
  const times = [...uniform, ...dense].sort((x, y) => x - y);
  const single = times.map((t) => convolvedDecay(components, t, sigma, t0));
  const train = times.map((t) => periodicDecay(components, t, sigma, t0, period));
  const intrinsic = times.map((t) => (t >= t0 ? decayIntensity(components, t - t0) : NaN));
  const irfCurve = times.map((t) => (sigma > 0 ? Math.exp(-((t - t0) ** 2) / (2 * sigma * sigma)) : NaN));
  const peakIdx = single.reduce((b, v, i) => (v > single[b] ? i : b), 0);
  const tNs = times.map((t) => Number((t / ns).toPrecision(6)));

  const chart = [
    { x: tNs, y: single.map(logY), type: "scatter", mode: "lines", name: "IRF ⊗ decay, one pulse", line: { color: "#60a5fa", width: 2 } },
    { x: tNs, y: train.map(logY), type: "scatter", mode: "lines", name: `IRF ⊗ decay, ${fmt(rep / 1e6, 3)} MHz`, line: { color: "#a78bfa", width: 2, dash: "dash" } },
    { x: tNs, y: intrinsic.map(logY), type: "scatter", mode: "lines", name: "Intrinsic decay", line: { color: "#f59e0b", dash: "dot" } },
    ...(sigma > 0 ? [{ x: tNs, y: irfCurve.map(logY), type: "scatter", mode: "lines", name: "IRF", line: { color: "#f87171", dash: "dot" } }] : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser Repetition Rate (MHz)" value={repRaw} onChange={setRep} min={0.001} max={10000} step="1" />
        <ValidatedNumberInput label="Laser Pulse FWHM (fs)" value={pulseRaw} onChange={setPulse} min={1} max={1e9} step="10" />
        <ValidatedNumberInput label="Laser Wavelength (nm)" value={laserNmRaw} onChange={setLaserNm} min={100} max={10000} step="10" />
        <ValidatedNumberInput label="IRF FWHM (ps)" value={irfRaw} onChange={setIrf} min={0} max={1e6} step="10" />
        <ValidatedNumberInput label="IRF Centre t₀ (ns)" value={t0Raw} onChange={setT0} min={0} max={10000} step="0.1" />
        <ValidatedNumberInput label="Time Window (ns)" value={rangeRaw} onChange={setRange} min={0.01} max={1e5} step="1" />
        <ValidatedNumberInput label="Lifetime τ₁ (ns)" value={tau1Raw} onChange={setTau1} min={0.001} max={1e5} step="0.1" />
        <ValidatedNumberInput label="Lifetime τ₂ (ns)" value={tau2Raw} onChange={setTau2} min={0.001} max={1e5} step="0.5" />
        <ValidatedNumberInput label="Amplitude Fraction α₂ (0 = single exponential)" value={a2Raw} onChange={setA2} min={0} max={1} step="0.05" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Pulse Period 1/f" value={`${fmt(period / ns, 4)} ns`} tone={leftover > 0.01 ? "orange" : "green"}
          subtext={`decay left at the next pulse e^(−T/τ) = ${fmt(leftover, 3)}; ${fmt(lateFraction * 100, 3)} % of the photons arrive after it`} />
        <ResultCard label="Centroid Shift ⟨t⟩ − t₀" value={`${fmt(tauInt / ns, 4)} ns`} tone="blue"
          subtext={`= intensity-weighted ⟨τ⟩ (one pulse, full decay); amplitude-weighted ${fmt(tauAmp / ns, 4)} ns`} />
        <ResultCard label="Measured Peak After t₀" value={`${fmt((times[peakIdx] - t0) / ns * 1e3, 3)} ps`} tone="purple"
          subtext={`IRF σ = ${fmt(sigma * 1e12, 3)} ps; τ₁/FWHM = ${irf > 0 ? fmt(tau1 / irf, 3) : "∞"}`} />
        <ResultCard label="Transform-Limited Bandwidth" value={`${fmt(bw.hz / 1e12, 4)} THz`} tone="cyan"
          subtext={`${fmt(bw.lambda * 1e9, 4)} nm at ${fmt(laserNm, 4)} nm (Gaussian, Δν·Δt = 0.4413)`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>IRF: Gaussian R(t) of FWHM w centred at t₀ (σ = w/2.3548). Measured: I(t) = R ⊗ Σ αᵢ e^(−t/τᵢ), computed in closed form as the exponentially modified Gaussian ½ e^(σ²/2τ² − (t−t₀)/τ) erfc((σ²/τ − (t − t₀))/(σ√2)).</p>
        <p>At repetition rate f the decay of earlier pulses adds: I_f(t) = Σₙ I(t + n/f). The centroid of a complete single-pulse decay is shifted from the IRF centre by the intensity-weighted lifetime Σαᵢτᵢ²/Σαᵢτᵢ (method of moments).</p>
        <p className="text-gray-400">The IRF combines laser pulse, detector jitter and electronics; the curves are noiseless, without pile-up of photon counts (count rate ≪ f assumed) and without background.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "TCSPC Decay with IRF (log scale)", font: { color: "white" } },
          xaxis: { title: "Time (ns)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (peak of the intrinsic decay = 1)", type: "log", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </>
  );
}
