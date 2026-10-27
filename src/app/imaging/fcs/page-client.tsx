"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  fcsAutocorrelation, fcsDiffusionCoefficient, fcsDiffusionCorrelation, fcsEffectiveVolume, fcsMeanNumber, koppelSnr,
} from "../../../physics/imaging/fluorescence-dynamics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function FCSPage() {
  const [w0Raw, setW0] = useURLState("w0", 0.3); // µm, lateral 1/e² radius
  const [z0Raw, setZ0] = useURLState("z0", 1.5); // µm, axial 1/e² radius
  const [tauDRaw, setTauD] = useURLState("tauD", 0.05); // ms
  const [brightnessRaw, setBrightness] = useURLState("brightnessKHz", 30); // kHz per molecule
  const [concRaw, setConc] = useURLState("concentration", 50); // nM
  const [tripletRaw, setTriplet] = useURLState("tripletFrac", 0.1);
  const [tauTRaw, setTauT] = useURLState("tripletTauUs", 5); // µs
  const [binRaw, setBin] = useURLState("binUs", 1); // µs, shortest lag channel
  const [timeRaw, setTime] = useURLState("time", 10); // s, measurement time
  const w0 = clamp(w0Raw, 0.1, 2, 0.3);
  const z0 = clamp(z0Raw, 0.1, 10, 1.5);
  const tauD_ms = clamp(tauDRaw, 0.001, 1000, 0.05);
  const brightness_kHz = clamp(brightnessRaw, 0.1, 1000, 30);
  const conc_nM = clamp(concRaw, 0.01, 10000, 50);
  const T = clamp(tripletRaw, 0, 0.9, 0.1);
  const tauT_us = clamp(tauTRaw, 0.1, 1000, 5);
  const bin_us = clamp(binRaw, 0.01, 1000, 1);
  const time = clamp(timeRaw, 0.1, 10000, 10);

  const tauD = tauD_ms * 1e-3;
  const kappa = z0 / w0;
  const V = fcsEffectiveVolume(w0 * 1e-6, z0 * 1e-6);
  const N = fcsMeanNumber(conc_nM * 1e-6, V);
  const D = fcsDiffusionCoefficient(w0 * 1e-6, tauD);
  const p = { N, tauD, kappa, T, tauT: tauT_us * 1e-6 };
  const G0 = fcsDiffusionCorrelation(0, p);
  const G0plus = fcsAutocorrelation(0, p);
  const countRate = N * brightness_kHz; // kHz
  const snr = koppelSnr(brightness_kHz * 1e3, bin_us * 1e-6, time, N);
  const countsPerBin = brightness_kHz * 1e3 * bin_us * 1e-6;
  const fluctuationRatio = brightness_kHz * 1e3 * countsPerBin * tauD; // ε²Δτ τ_D: number-fluctuation vs shot-noise variance

  const warnings: string[] = [];
  if (N < 0.5) warnings.push(`N = ${N.toFixed(2)} is below one molecule: number fluctuations dominate the noise and the shot-noise SNR is optimistic.`);
  if (N > 1000) warnings.push(`N = ${N.toFixed(0)}: G(0) = ${G0.toExponential(1)} is buried under background and detector afterpulsing in practice.`);
  if (countsPerBin > 0.1) warnings.push(`ε·Δτ = ${countsPerBin.toFixed(2)} counts per molecule per channel: Koppel's shot-noise limit assumes ≪ 1.`);
  if (fluctuationRatio > 0.1) warnings.push(`ε²·Δτ·τ_D = ${fluctuationRatio.toPrecision(2)}: number fluctuations add to the shot noise, so the SNR shown is an upper bound.`);
  if (bin_us * 1e-6 > tauD / 10) warnings.push("The lag channel is not much shorter than τ_D, so G has already decayed within it.");

  // Lag grid log-spaced from min(0.1 µs, τ_T/10) to max(1 s, 1000 κ² τ_D) so the whole decay is shown; in ms on the chart.
  const lagLo = Math.min(1e-7, (tauT_us * 1e-6) / 10);
  const lagHi = Math.max(1, 1e3 * kappa * kappa * tauD);
  const lagDecades = Math.log10(lagHi / lagLo);
  const lags = Array.from({ length: 241 }, (_, i) => lagLo * 10 ** ((i * lagDecades) / 240));
  const chart = [
    { x: lags.map((t) => t * 1e3), y: lags.map((t) => fcsAutocorrelation(t, p)), type: "scatter" as const, mode: "lines" as const, name: "G(τ), diffusion + triplet", line: { color: "#60a5fa" } },
    { x: lags.map((t) => t * 1e3), y: lags.map((t) => fcsDiffusionCorrelation(t, p)), type: "scatter" as const, mode: "lines" as const, name: "Diffusion only", line: { color: "#f87171", dash: "dash" } },
  ];

  const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
  const sig = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toPrecision(digits)}${unit}` : "—");

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Lateral 1/e² radius w₀ (µm)" value={w0Raw} onChange={setW0} min={0.1} max={2} step="0.01" />
          <ValidatedNumberInput label="Axial 1/e² radius z₀ (µm)" value={z0Raw} onChange={setZ0} min={0.1} max={10} step="0.1" />
          <ValidatedNumberInput label="Diffusion time τ_D (ms)" value={tauDRaw} onChange={setTauD} min={0.001} max={1000} step="0.01" />
          <ValidatedNumberInput label="Concentration (nM)" value={concRaw} onChange={setConc} min={0.01} max={10000} />
          <ValidatedNumberInput label="Molecular brightness ε (kHz per molecule)" value={brightnessRaw} onChange={setBrightness} min={0.1} max={1000} />
          <ValidatedNumberInput label="Triplet fraction T" value={tripletRaw} onChange={setTriplet} min={0} max={0.9} step="0.01" />
          <ValidatedNumberInput label="Triplet relaxation time τ_T (µs)" value={tauTRaw} onChange={setTauT} min={0.1} max={1000} step="0.1" />
          <ValidatedNumberInput label="Lag channel width Δτ (µs)" value={binRaw} onChange={setBin} min={0.01} max={1000} step="0.1" />
          <ValidatedNumberInput label="Measurement time (s)" value={timeRaw} onChange={setTime} min={0.1} max={10000} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Structure parameter κ = z₀/w₀", fmt(kappa, 2))}
          {row("Effective volume V_eff", fmt(V * 1e18, 4, " fL"), "text-blue-400")}
          {row("Molecules in V_eff, N", fmt(N, 2), "text-green-400")}
          {row("G(0) = 1/N (diffusion)", sig(G0, 4), "text-yellow-400")}
          {row("G(0⁺) with triplet", sig(G0plus, 4), "text-yellow-400")}
          {row("Diffusion coefficient D", sig(D * 1e12, 4, " µm²/s"), "text-purple-400")}
          {row("Mean count rate N·ε", fmt(countRate, 0, " kHz"))}
          {row("SNR of G at the shortest lag", fmt(snr, 1), "text-red-400")}
          {warnings.map((w) => (
            <p key={w} className="text-yellow-400 text-sm">{w}</p>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Autocorrelation curve</h2>
        <ChartPanel
          data={chart}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 70, r: 20, t: 20, b: 60 },
            xaxis: { title: "Lag time τ (ms)", type: "log", gridcolor: "#333" }, yaxis: { title: "G(τ)", gridcolor: "#333" }, showlegend: true,
          }}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>V_eff = π^(3/2) w₀² z₀, N = c·N_A·V_eff, D = w₀²/(4τ_D)</p>
          <p>G(τ) = (1/N)(1 + τ/τ_D)⁻¹(1 + τ/(κ²τ_D))^(−1/2) [1 + T/(1 − T)·e^(−τ/τ_T)]</p>
          <p>SNR = ε √(Δτ · T_meas) / √(1 + 1/N)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          3D Gaussian detection volume (Hess &amp; Webb 2002) with the triplet term of Widengren, Mets &amp; Rigler (1995);
          T is the mean fraction of molecules in the triplet state, so G(0⁺) = 1/(N(1 − T)). The SNR is Koppel&apos;s (1974)
          shot-noise limit for the shortest lag channel (εΔτ ≪ 1, ε²Δτ τ_D ≪ 1): it grows with the brightness per
          molecule and, for N ≫ 1, does not depend on N. Background light, afterpulsing and the deviation of a real confocal
          volume from a Gaussian (larger at high NA or with a mismatched pinhole) are not included.
        </p>
      </div>
    </>
  );
}
