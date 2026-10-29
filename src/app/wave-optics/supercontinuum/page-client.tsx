"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  dispersionLength, dispersiveWaveShift, dispersiveWaveShiftNonlinear, fissionLength, fundamentalSolitonPower, sechPeakPower, sechT0, solitonOrder,
} from "../../../physics/wave-optics/soliton";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

// Large N: noise-seeded modulation instability competes with fission and coherence is lost (Dudley et al. 2006).
const MI_ORDER = 16;

// Defaults: the 835 nm photonic-crystal-fibre example of Dudley et al. 2006 (50 fs sech², 10 kW peak, 15 cm).
export default function SupercontinuumPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 835); // nm
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 0.567); // nJ
  const [fwhmRaw, setFwhm] = useURLState("pulseDuration", 50); // fs, sech² FWHM
  const [lengthRaw, setLength] = useURLState("fiberLength", 15); // cm
  const [gammaRaw, setGamma] = useURLState("gamma", 110); // 1/(W·km)
  const [beta2Raw, setBeta2] = useURLState("beta2", -11.83); // ps²/km
  const [beta3Raw, setBeta3] = useURLState("beta3", 0.081); // ps³/km

  const lambda = clamp(wavelengthRaw, 200, 5000, 835) * 1e-9;
  const energy = clamp(energyRaw, 0, 1e6, 0.567) * 1e-9;
  const fwhm = clamp(fwhmRaw, 1, 1e5, 50) * 1e-15;
  const fibre = clamp(lengthRaw, 0, 1e7, 15) * 1e-2;
  const gamma = clamp(gammaRaw, 0.01, 1e5, 110) * 1e-3;
  const beta2 = clamp(beta2Raw, -1000, 1000, -11.83) * 1e-27;
  const beta3 = clamp(beta3Raw, -100, 100, 0.081) * 1e-39;

  const t0 = sechT0(fwhm);
  const peak = sechPeakPower(energy, t0);
  const LD = dispersionLength(t0, beta2);
  const P1 = fundamentalSolitonPower(beta2, gamma, t0);
  const N = solitonOrder(peak, beta2, gamma, t0);
  const Lfiss = fissionLength(t0, beta2, N);
  const anomalous = beta2 < 0;
  const omega0 = (2 * Math.PI * c) / lambda;
  const shift0 = dispersiveWaveShift(beta2, beta3);
  // Phase matching to the soliton's nonlinear wavenumber γP/2 with the input peak power; the leading order drops it.
  const shift = dispersiveWaveShiftNonlinear(beta2, beta3, gamma, peak);
  const toWavelength = (w: number) => (anomalous && omega0 + w > 0 ? (2 * Math.PI * c) / (omega0 + w) : NaN);
  const lambdaDW = toWavelength(shift);
  const lambdaDW0 = toWavelength(shift0);

  const regime = !anomalous
    ? "Normal dispersion: no soliton fission; SPM and optical wave breaking broaden the spectrum."
    : N < 1
      ? "N < 1: dispersion dominates, little broadening."
      : fibre < Lfiss
        ? `The fibre ends before the fission point (L/L_fiss = ${fmt(fibre / Lfiss, 3)}): mainly SPM broadening and compression.`
        : N > MI_ORDER
          ? `N > ${MI_ORDER}: noise-seeded modulation instability breaks the pulse up before clean fission (L/L_fiss = ${fmt(fibre / Lfiss, 3)}), so the continuum is broad but loses shot-to-shot coherence.`
          : `Soliton fission inside the fibre (L/L_fiss = ${fmt(fibre / Lfiss, 3)}): ≈ N fundamental solitons, Raman self-frequency shift and dispersive waves.`;

  // L_fiss = L_D/N = T₀^(3/2) √(2/(γE|β₂|)) at fixed energy: plot it across the duration range around the input.
  const fiss = Number.isFinite(Lfiss) && Lfiss > 0 ? [
    {
      name: "Fission length",
      color: "#60a5fa",
      points: Array.from({ length: 121 }, (_, i) => {
        const f = fwhm * 10 ** ((i - 60) / 60);
        const t = sechT0(f);
        return { x: round6(f * 1e15), y: round6(fissionLength(t, beta2, solitonOrder(sechPeakPower(energy, t), beta2, gamma, t)) * 100) };
      }),
    },
    ...(fibre > 0 ? [{ name: "Fibre length", color: "#9ca3af", dashed: true, points: [{ x: round6(fwhm * 1e14), y: round6(fibre * 100) }, { x: round6(fwhm * 1e16), y: round6(fibre * 100) }] }] : []),
    { name: "Input pulse", color: "#f87171", showPoints: true, points: [{ x: round6(fwhm * 1e15), y: round6(Lfiss * 100) }] },
  ] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={5000} step="any" />
        <ValidatedNumberInput label="Pulse energy (nJ)" value={energyRaw} onChange={setEnergy} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Pulse FWHM, sech² (fs)" value={fwhmRaw} onChange={setFwhm} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Fibre length (cm)" value={lengthRaw} onChange={setLength} min={0} max={1e7} step="any" />
        <ValidatedNumberInput label="γ (W⁻¹ km⁻¹)" value={gammaRaw} onChange={setGamma} min={0.01} max={1e5} step="any" />
        <ValidatedNumberInput label="β₂ (ps²/km)" value={beta2Raw} onChange={setBeta2} min={-1000} max={1000} step="any" />
        <ValidatedNumberInput label="β₃ (ps³/km)" value={beta3Raw} onChange={setBeta3} min={-100} max={100} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Peak power" value={`${fmt(peak / 1e3)} kW`} subtext={`sech²: E/(2T₀), T₀ = FWHM/1.7627 = ${fmt(t0 * 1e15)} fs`} tone="blue" />
        <ResultCard label="Soliton number N" value={fmt(N, 3)} subtext={`√(P/P₁), fundamental soliton P₁ = |β₂|/(γT₀²) = ${fmt(P1)} W`} tone="green" />
        <ResultCard label="Dispersion length L_D" value={`${fmt(LD * 100)} cm`} subtext="T₀²/|β₂|" tone="orange" />
        <ResultCard label="Fission length L_fiss" value={anomalous ? `${fmt(Lfiss * 100)} cm` : "—"} subtext={anomalous ? "≈ L_D/N" : "needs anomalous dispersion (β₂ < 0)"} tone="yellow" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ResultCard
          label="Dispersive wave"
          value={Number.isFinite(lambdaDW) ? `${fmt(lambdaDW * 1e9)} nm` : "—"}
          subtext={!anomalous
            ? "needs a soliton (β₂ < 0)"
            : Number.isFinite(lambdaDW)
              ? `β₂Ω²/2 + β₃Ω³/6 = γP₀/2: Ω = 2π × ${fmt(shift / (2 * Math.PI * 1e12))} THz from the pump; leading order −3β₂/β₃ gives ${fmt(lambdaDW0 * 1e9)} nm`
              : beta3 === 0 ? "β₃ = 0: no phase-matched dispersive wave" : "the phase-matched Ω lies beyond zero frequency"}
          tone="purple"
        />
        <ResultCard label="Regime" value={!anomalous ? "Normal dispersion" : N < 1 ? "Linear" : fibre < Lfiss ? "Before fission" : N > MI_ORDER ? "Modulation instability" : "Soliton fission"} subtext={regime} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A femtosecond pulse in the anomalous dispersion of a photonic crystal fibre is a higher-order soliton of order
          N = √(γP₀T₀²/|β₂|). Higher-order dispersion and the Raman response break it up near the fission length
          L_fiss ≈ L_D/N into about N fundamental solitons. They shift to longer wavelengths, and each one radiates a
          phase-matched dispersive wave on the other side of the zero-dispersion wavelength. Its offset Ω solves
          β₂Ω²/2 + β₃Ω³/6 = γP/2, with the input peak power here; the leading order Ω ≈ −3β₂/β₃ holds only when
          γP ≪ |β₂|Ω². Solitons ejected at fission are up to ≈ 4× stronger, which pushes the wave further out. The spectrum itself needs a generalised NLS simulation and isn&apos;t shown; these scales tell
          whether the fibre is long enough for fission. Pulse shape: sech², so P₀ = E/(2T₀).</p>
      </div>

      {fiss.length > 0 && (
        <SimpleLineChart title="Fission length against pulse duration, at fixed energy" xLabel="Pulse FWHM (fs)" yLabel="Length (cm)" series={fiss} xScale="log" yScale="log" />
      )}
    </>
  );
}
