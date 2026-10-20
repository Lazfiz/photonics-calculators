"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { cePhaseSlip, combTooth, nearestTooth, wrapOffset } from "../../../physics/wave-optics/frequency-comb";
import { transformLimitedBandwidth } from "../../../physics/wave-optics/pulsed-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const PULSE_COLORS = ["#60a5fa", "#f59e0b", "#34d399"];

export default function OpticalFrequencyCombPage() {
  const [repRateRaw, setRepRate] = useURLState("repRate", 250); // MHz
  const [fceoRaw, setFceo] = useURLState("fceo", 20); // MHz
  const [wavelengthRaw, setWavelength] = useURLState("centerWavelength", 1550); // nm
  const [durationRaw, setDuration] = useURLState("pulseDuration", 20); // fs FWHM
  const [phaseRaw, setPhase] = useURLState("cepOffset", 0); // rad
  const [linesRaw, setLines] = useURLState("combLines", 20);

  const frep = clamp(repRateRaw, 1e-3, 1e5, 250) * 1e6;
  const fceo = wrapOffset(clamp(fceoRaw, -1e5, 1e5, 20) * 1e6, frep);
  const lambda = clamp(wavelengthRaw, 200, 20000, 1550) * 1e-9;
  const tau = clamp(durationRaw, 1, 1000, 20) * 1e-15;
  const phi0 = clamp(phaseRaw, -100, 100, 0);
  const lines = Math.round(clamp(linesRaw, 1, 2000, 20));

  const comb = { frep, fceo };
  const nu = c / lambda;
  const n0 = nearestTooth(comb, nu);
  const nuN = combTooth(comb, n0);
  const slip = cePhaseSlip(fceo, frep);
  const dnu = transformLimitedBandwidth(tau, "gaussian");
  const period = lambda / c;
  const repeat = fceo > 0 ? frep / fceo : Infinity;

  // Stick spectrum around tooth n₀: ν − n₀ f_rep = k f_rep + f_ceo, against the f_ceo = 0 grid k f_rep.
  const k0 = -Math.floor((lines - 1) / 2);
  const sticks = (shift: number, height: number) => Array.from({ length: lines }, (_, i) => {
    const x = round6(((k0 + i) * frep + shift) / 1e9);
    return [{ x, y: 0 }, { x, y: height }, { x, y: 0 }];
  }).flat();
  const spectrum = [
    { name: "Comb teeth n f_rep + f_ceo", color: "#60a5fa", points: sticks(fceo, 1) },
    { name: "Grid n f_rep (f_ceo = 0)", color: "#6b7280", dashed: true, points: sticks(0, 0.6) },
  ];

  // Field of three consecutive pulses, each centred on its envelope peak: the carrier advances Δφ_CE per pulse.
  const halfWindow = Math.min(1.5 * tau, 10 * period);
  const field = PULSE_COLORS.map((color, k) => ({
    name: `Pulse ${k + 1} (φ = φ₀ + ${k}Δφ)`,
    color,
    points: Array.from({ length: 801 }, (_, i) => {
      const t = ((i - 400) / 400) * halfWindow;
      const env = Math.exp(-2 * Math.LN2 * (t / tau) ** 2);
      return { x: round6(t * 1e15), y: round6(env * Math.cos((2 * Math.PI * t) / period + phi0 + k * slip)) };
    }),
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Repetition rate f_rep (MHz)" value={repRateRaw} onChange={setRepRate} min={1e-3} max={1e5} step="any" />
        <ValidatedNumberInput label="Offset frequency f_ceo (MHz)" value={fceoRaw} onChange={setFceo} min={-1e5} max={1e5} step="any" />
        <ValidatedNumberInput label="Centre wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Pulse duration, FWHM (fs)" value={durationRaw} onChange={setDuration} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="CEP of the first pulse φ₀ (rad)" value={phaseRaw} onChange={setPhase} min={-100} max={100} step="any" />
        <ValidatedNumberInput label="Teeth to plot" value={linesRaw} onChange={setLines} min={1} max={2000} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Tooth nearest the centre" value={`${fmt(nuN / 1e12, 12)} THz`} subtext={`n = ${n0}; ν_n = n f_rep + f_ceo, f_ceo = ${fmt(fceo / 1e6, 6)} MHz`} tone="blue" />
        <ResultCard label="CE phase slip per pulse" value={`${fmt(slip, 4)} rad`} subtext={`Δφ_CE = 2π f_ceo/f_rep = ${fmt(slip / Math.PI, 4)}π; ${Number.isFinite(repeat) ? `f_rep/f_ceo = ${fmt(repeat, 6)}` : "every pulse has the same CEP"}`} tone="purple" />
        <ResultCard label="Teeth in the spectral FWHM" value={fmt(dnu / frep)} subtext={`transform-limited Gaussian, Δν = 0.4413/τ = ${fmt(dnu / 1e12)} THz`} tone="green" />
        <ResultCard label="Optical cycles in the FWHM" value={fmt(tau / period, 3)} subtext={`period ${fmt(period * 1e15)} fs, pulse spacing ${fmt(1e9 / frep)} ns`} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A mode-locked pulse train is a comb of teeth ν_n = n f_rep + f_ceo. When the carrier slips by Δφ_CE against the envelope
          from one pulse to the next, the whole comb shifts by f_ceo = (Δφ_CE/2π) f_rep from the harmonics of f_rep. An f-to-2f
          interferometer measures it as 2ν_n − ν_2n; locking f_ceo, or setting it to zero, stabilizes the carrier-envelope phase.
          Offsets outside [0, f_rep) are wrapped into it. The spectral width assumes a transform-limited Gaussian pulse.</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title={`Comb teeth around n = ${n0}`} xLabel={`ν − ${n0} f_rep (GHz)`} yLabel="Tooth (a.u.)" series={spectrum} />
        <SimpleLineChart title="Electric field of three consecutive pulses" xLabel="Time from the envelope peak (fs)" yLabel="E (a.u.)" series={field} />
      </div>
    </>
  );
}
