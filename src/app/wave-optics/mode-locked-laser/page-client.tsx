"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { peakPower } from "../../../physics/laser-safety/peak-power";
import {
  TIME_BANDWIDTH, cavityLengthForRepRate, transformLimitedBandwidth, wavelengthWidth, type PulseShapeTL,
} from "../../../physics/wave-optics/pulsed-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const SECH_WIDTH = 2 * Math.log(1 + Math.SQRT2); // FWHM of sech²(t/T₀) in units of T₀

export default function ModeLockedLaserPage() {
  const [repRateRaw, setRepRate] = useURLState("repRate", 80); // MHz
  const [durationRaw, setDuration] = useURLState("pulseDuration", 100); // fs FWHM
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [powerRaw, setPower] = useURLState("avgPower", 100); // mW
  const [shapeRaw, setShape] = useURLState("shape", "sech2");
  const [cavityRaw, setCavity] = useURLState("cavity", "linear");

  const repRate = clamp(repRateRaw, 1e-3, 1e6, 80) * 1e6;
  const tau = clamp(durationRaw, 0.1, 1e6, 100) * 1e-15;
  const lambda = clamp(wavelengthRaw, 100, 20000, 1550) * 1e-9;
  const avg = clamp(powerRaw, 0, 1e7, 100) * 1e-3;
  const shape: PulseShapeTL = shapeRaw === "gaussian" ? "gaussian" : "sech2";
  const ring = cavityRaw === "ring";

  const L = cavityLengthForRepRate(repRate, ring);
  const dnu = transformLimitedBandwidth(tau, shape);
  const dlambda = wavelengthWidth(dnu, lambda);
  const modes = dnu / repRate;
  const energy = avg / repRate;
  const peak = peakPower(energy, tau, shape);
  const cycles = (c * tau) / lambda;

  const tFs = tau * 1e15;
  const intensity = (t: number) => (shape === "gaussian"
    ? Math.exp(-4 * Math.LN2 * (t / tFs) ** 2)
    : 1 / Math.cosh((SECH_WIDTH * t) / tFs) ** 2);
  const series = [{
    name: "Intensity",
    color: "#60a5fa",
    points: Array.from({ length: 201 }, (_, i) => {
      const t = ((i - 100) / 25) * tFs;
      return { x: round6(t), y: round6((peak * intensity(t)) / 1e3) };
    }).filter((p) => Number.isFinite(p.y)),
  }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Repetition rate (MHz)" value={repRateRaw} onChange={setRepRate} min={1e-3} max={1e6} step="any" />
        <ValidatedNumberInput label="Pulse duration, FWHM (fs)" value={durationRaw} onChange={setDuration} min={0.1} max={1e6} step="any" />
        <ValidatedNumberInput label="Centre wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
        <ValidatedNumberInput label="Average power (mW)" value={powerRaw} onChange={setPower} min={0} max={1e7} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse shape</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="sech2">sech² (soliton, Δν τ = 0.315)</option>
            <option value="gaussian">Gaussian (Δν τ = 0.441)</option>
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Cavity</span>
          <select value={ring ? "ring" : "linear"} onChange={(e) => setCavity(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear (standing wave), L = c/2f</option>
            <option value="ring">Ring, perimeter = c/f</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label={ring ? "Ring perimeter (optical)" : "Cavity length (optical)"} value={`${fmt(L)} m`} subtext={`pulse period ${fmt(1e9 / repRate)} ns`} tone="blue" />
        <ResultCard label="Transform-limited bandwidth" value={`${fmt(dlambda * 1e9)} nm`} subtext={`Δν = ${fmt(TIME_BANDWIDTH[shape])}/τ = ${fmt(dnu / 1e12)} THz`} tone="cyan" />
        <ResultCard label="Locked modes in the FWHM" value={fmt(modes)} subtext={`Δν/f_rep; ${fmt(cycles, 3)} optical cycles in the pulse`} tone="green" />
        <ResultCard label="Peak power" value={`${fmt(peak / 1e3)} kW`} subtext={`E = P/f = ${fmt(energy * 1e9)} nJ; duty ${fmt(tau * repRate * 100)} %`} tone="purple" />
      </div>

      {(tau * repRate > 0.1 || modes < 2) && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          Pulses this long for the repetition rate overlap (duty τ·f_rep = {fmt(tau * repRate)}) or span fewer than two modes: not a
          mode-locked train, so the peak power and mode count don&apos;t apply.
        </p>
      )}
      {cycles < 1 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          Shorter than one optical cycle: the envelope model and the time-bandwidth product no longer hold.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>The pulse train repeats once per cavity round trip, f_rep = c/2L (linear) or c/L (ring), with L the optical length. A
          transform-limited pulse of intensity FWHM τ spans Δν = K/τ, K = 0.4413 (Gaussian) or 0.3148 (sech²), so about Δν/f_rep modes
          oscillate in phase. A chirped pulse is longer than this limit for the same bandwidth. Peak power: 0.939 E/τ (Gaussian),
          0.881 E/τ (sech²).</p>
      </div>

      <SimpleLineChart title="Single pulse" xLabel="Time (fs)" yLabel="Power (kW)" series={series} />
    </>
  );
}
