"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  bandwidthHz, groupDelay, groupIndexFromDelay, groupVelocity, lorentzianDelay, lorentzianGain,
} from "../../../physics/wave-optics/slow-light";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toPrecision(d)).toString() : "—");
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const NP_PER_DB = Math.LN10 / 10; // power gain: G (Np) = G (dB)·ln 10/10

/** Time in s with an SI prefix. */
function fmtTime(t: number): string {
  if (!Number.isFinite(t)) return "—";
  const a = Math.abs(t);
  const [scale, unit] = a >= 1 ? [1, "s"] : a >= 1e-3 ? [1e3, "ms"] : a >= 1e-6 ? [1e6, "µs"] : a >= 1e-9 ? [1e9, "ns"] : a >= 1e-12 ? [1e12, "ps"] : [1e15, "fs"];
  return `${fmt(t * scale)} ${unit}`;
}

/** Frequency in Hz with an SI prefix. */
const fmtHz = (f: number) =>
  !Number.isFinite(f) ? "—" : f >= 1e12 ? `${fmt(f / 1e12)} THz` : f >= 1e9 ? `${fmt(f / 1e9)} GHz` : f >= 1e6 ? `${fmt(f / 1e6)} MHz` : `${fmt(f / 1e3)} kHz`;

/** Excess delay (ns) and gain (dB) of the resonance over ±3 FWHM of detuning (MHz). */
function resonanceChart(gainNp: number, fwhm_MHz: number) {
  const x = Array.from({ length: 401 }, (_, i) => ((i - 200) / 200) * 3 * fwhm_MHz);
  return [
    { x: x.map(round6), y: x.map((d) => round6(lorentzianDelay(gainNp, fwhm_MHz * 1e6, d * 1e6) * 1e9)), type: "scatter", mode: "lines", name: "Excess delay (ns)", line: { color: "#60a5fa" }, marker: { color: "#60a5fa" } },
    { x: x.map(round6), y: x.map((d) => round6(lorentzianGain(gainNp, fwhm_MHz * 1e6, d * 1e6) / NP_PER_DB)), type: "scatter", mode: "lines", name: "Gain (dB)", yaxis: "y2", line: { color: "#4ade80" }, marker: { color: "#4ade80" } },
  ];
}

export default function SlowLightPage() {
  const [modelRaw, setModel] = useURLState("model", "index");
  const [ngRaw, setNGroup] = useURLState("nGroup", 10);
  const [n0Raw, setNBase] = useURLState("nBase", 1.5);
  const [wlRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [bwRaw, setBandwidth] = useURLState("bandwidth", 1); // nm, signal bandwidth
  const [lRaw, setStructureLength] = useURLState("structureLength", 1); // mm
  const [gRaw, setGainDb] = useURLState("gainDb", 30); // dB at line centre
  const [wRaw, setResonanceWidth] = useURLState("resonanceWidth", 30); // MHz FWHM

  const resonance = modelRaw === "resonance";
  const ngInput = clamp(ngRaw, 0.01, 1e9, 10);
  const n0 = clamp(n0Raw, 1, 5, 1.5);
  const lambda = clamp(wlRaw, 100, 20000, 1550) * 1e-9;
  const dLambda = clamp(bwRaw, 0, 1000, 1) * 1e-9;
  const L = clamp(lRaw, 1e-6, 1e9, 1) * 1e-3;
  const gainDb = clamp(gRaw, -100, 100, 30);
  const fwhm_MHz = clamp(wRaw, 1e-6, 1e6, 30);

  const gainNp = gainDb * NP_PER_DB;
  const tauRes = lorentzianDelay(gainNp, fwhm_MHz * 1e6, 0);
  const ng = resonance ? groupIndexFromDelay(n0, tauRes, L) : ngInput;
  const tau0 = groupDelay(n0, L); // background medium
  const tau = resonance ? tau0 + tauRes : groupDelay(ng, L);
  const excess = tau - tau0;
  const vg = groupVelocity(ng);
  const dnu = bandwidthHz(lambda, Math.min(dLambda, 1.99 * lambda));
  const wideSignal = resonance && dnu > fwhm_MHz * 1e6;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Group index from</span>
          <select value={resonance ? "resonance" : "index"} onChange={(e) => setModel(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="index">Given group index (photonic crystal, EIT, …)</option>
            <option value="resonance">Lorentzian resonance (Brillouin gain, EIT window)</option>
          </select>
        </label>
        {resonance ? (
          <>
            <ValidatedNumberInput label="Power Gain at Line Centre (dB)" value={gRaw} onChange={setGainDb} min={-100} max={100} step="any" />
            <ValidatedNumberInput label="Resonance FWHM (MHz)" value={wRaw} onChange={setResonanceWidth} min={1e-6} max={1e6} step="any" />
          </>
        ) : (
          <ValidatedNumberInput label="Group Index n_g" value={ngRaw} onChange={setNGroup} min={0.01} max={1e9} step="any" />
        )}
        <ValidatedNumberInput label="Background Group Index n₀" value={n0Raw} onChange={setNBase} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Structure Length (mm)" value={lRaw} onChange={setStructureLength} min={1e-6} max={1e9} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wlRaw} onChange={setWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Signal Bandwidth Δλ (nm)" value={bwRaw} onChange={setBandwidth} min={0} max={1000} step="any" />
      </div>

      {wideSignal && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100">
          The signal bandwidth {fmtHz(dnu)} is wider than the resonance ({fmt(fwhm_MHz)} MHz): the delay and gain vary across
          the signal, so pulses are distorted and the line-centre delay does not apply. Narrow Δλ or widen the resonance.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Group Index n_g" value={fmt(ng)} tone="blue"
          subtext={resonance ? `n₀ + cτ_res/L; slowdown n_g/n₀ = ${fmt(ng / n0)}` : `slowdown n_g/n₀ = ${fmt(ng / n0)}`} />
        <ResultCard label="Group Velocity c/n_g" value={ng > 0 ? `${fmt(vg)} m/s` : "negative"} tone="cyan"
          subtext={ng > 0 ? `${fmt((100 * vg) / c)} % of c` : "n_g < 0: fast light, the output peak leaves before the input peak arrives"} />
        <ResultCard label="Group Delay τ" value={fmtTime(tau)} tone="green" subtext={`${fmtTime((ng * 1e-3) / c)} per mm`} />
        <ResultCard label="Excess Delay over n₀" value={fmtTime(excess)} tone="purple" subtext={`background alone: ${fmtTime(tau0)}`} />
        <ResultCard label="Signal Bandwidth Δν" value={fmtHz(dnu)} tone="yellow" subtext={`Δλ = ${fmt(dLambda * 1e9)} nm at ${fmt(lambda * 1e9)} nm`} />
        <ResultCard label="Delay × Bandwidth τΔν" value={fmt(tau * dnu)} tone="orange"
          subtext={`excess Δτ·Δν = ${fmt(excess * dnu)} (≈ bits stored beyond plain propagation)`} />
        {resonance && (
          <ResultCard label="Resonance Delay G/Γ" value={fmtTime(tauRes)} tone="red"
            subtext={`G = ${fmt(gainNp)} Np; τ_res·FWHM = G/2π = ${fmt(gainNp / (2 * Math.PI))}`} />
        )}
      </div>

      {resonance && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Excess delay and gain across the resonance</p>
          <ChartPanel data={resonanceChart(gainNp, fwhm_MHz)} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: `Detuning from ${fmt(c / lambda / 1e12, 6)} THz (MHz)`, gridcolor: "#374151" },
            yaxis: { title: "Excess delay (ns)", gridcolor: "#374151" },
            yaxis2: { title: "Gain (dB)", overlaying: "y", side: "right" },
            margin: { t: 20, r: 70, b: 50, l: 70 },
          }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">τ = n_g L/c,   v_g = c/n_g,   Δν = c/(λ − Δλ/2) − c/(λ + Δλ/2)</p>
        <p className="font-mono">τ_res(Δ) = (G/2)·γ(γ² − Δ²)/(γ² + Δ²)²,   τ_res(0) = G/Γ,   γ = Γ/2 = π·FWHM</p>
        <p>
          The group index sets the delay over the structure; the delay-bandwidth product counts how many bits (or pulses)
          the structure holds at once, which is what limits slow-light buffers. A Lorentzian resonance of power gain G
          (nepers) has the causal phase (G/2)γΔ/(γ² + Δ²), whose slope is the delay: gain lines and transparency windows
          slow light, absorption lines (negative gain) speed it up. Its delay times its width is fixed at G/2π, so a narrow
          line gives long delay over a small bandwidth. Lossless background, one isolated line, signal narrower than the line.
        </p>
      </div>
    </>
  );
}
