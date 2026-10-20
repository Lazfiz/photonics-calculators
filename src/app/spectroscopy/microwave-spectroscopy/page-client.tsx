"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, k_B } from "../../../physics/constants";
import {
  DEBYE, DIATOMICS, mostPopulatedJ, reducedMass, rotationalConstant, rotationalConstantV, rotationalLines, rotationalPartition,
  type DiatomicConstants,
} from "../../../physics/spectroscopy/diatomic";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const r6 = (x: number) => Number(x.toPrecision(6));
const r10 = (x: number) => Number(x.toPrecision(10));
const MHz = 1e6 / c; // MHz → m⁻¹
const JPL = 2.99792458e18; // nm²·MHz per cm/molecule

const co = DIATOMICS.co;
const presetValues = (k: typeof co) => ({
  m1: k.m1, m2: k.m2, bondLength: r10(k.re * 1e10), alphaE: r6(k.alphaE / MHz), distortion: r6(k.De / MHz), dipoleMoment: r6(k.dipole / DEBYE),
});

export default function MicrowaveSpectroscopyPage() {
  const d = presetValues(co);
  const [m1Raw, setM1] = useURLState("m1", d.m1);
  const [m2Raw, setM2] = useURLState("m2", d.m2);
  const [rRaw, setR] = useURLState("bondLength", d.bondLength);
  const [alphaRaw, setAlpha] = useURLState("alphaE", d.alphaE);
  const [dRaw, setD] = useURLState("distortion", d.distortion);
  const [muRaw, setMu] = useURLState("dipoleMoment", d.dipoleMoment);
  const [tRaw, setT] = useURLState("temperature", 300);
  const [vRaw, setV] = useURLState("v", 0);

  const loadPreset = (key: string) => {
    const k = DIATOMICS[key as keyof typeof DIATOMICS];
    if (!k) return;
    const p = presetValues(k);
    setM1(p.m1); setM2(p.m2); setR(p.bondLength); setAlpha(p.alphaE); setD(p.distortion); setMu(p.dipoleMoment);
  };

  const k: DiatomicConstants = {
    m1: clamp(m1Raw, 0.5, 300, d.m1), m2: clamp(m2Raw, 0.5, 300, d.m2), re: clamp(rRaw, 0.5, 5, d.bondLength) * 1e-10,
    we: 0, wexe: 0, weye: 0, weze: 0, alphaE: clamp(alphaRaw, 0, 1e5, d.alphaE) * MHz, De: clamp(dRaw, 0, 1000, d.distortion) * MHz,
    dipole: clamp(muRaw, 0, 15, d.dipoleMoment) * DEBYE,
  };
  const T = clamp(tRaw, 2, 3000, 300);
  const v = Math.round(clamp(vRaw, 0, 5, 0));

  const mu = reducedMass(k.m1, k.m2);
  const Be = rotationalConstant(mu, k.re);
  const Bv = rotationalConstantV(k, v);
  const valid = Bv > 0;
  const lines = valid ? rotationalLines(Bv, k.De, k.dipole, T) : [];
  const Q = valid ? rotationalPartition(Bv, k.De, T) : NaN;
  const strongest = lines.length ? lines.reduce((a, b) => (b.S > a.S ? b : a)) : undefined;
  const Jpop = valid ? mostPopulatedJ(Bv, T) : NaN;
  const toGHz = (sigma: number) => (sigma * c) / 1e9;
  const noDipole = k.dipole === 0;

  const shown = lines.filter((l) => strongest && l.S >= 1e-3 * strongest.S);
  const spectrum = [
    { x: shown.map((l) => r6(toGHz(l.sigma))), y: shown.map((l) => r6(l.S * 100)), type: "bar", name: "S (cm/molecule)", marker: { color: "#60a5fa" } },
  ];
  const popLines = lines.filter((l) => l.population >= 1e-4 * Math.max(...lines.map((x) => x.population)));
  const populations = [
    { x: popLines.map((l) => l.J), y: popLines.map((l) => r6(l.population * 100)), type: "scatter", mode: "lines+markers", name: "Population", line: { color: "#34d399" }, marker: { color: "#34d399", size: 4 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Load molecule (¹Σ diatomic)</span>
          <select defaultValue="" onChange={(e) => { loadPreset(e.target.value); e.target.value = ""; }}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="" disabled>Choose a preset…</option>
            <option value="co">{DIATOMICS.co.label} (carbon monoxide)</option>
            <option value="hcl">{DIATOMICS.hcl.label} (hydrogen chloride)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Atomic Mass m₁ (u)" value={m1Raw} onChange={setM1} min={0.5} max={300} step="0.001" />
        <ValidatedNumberInput label="Atomic Mass m₂ (u)" value={m2Raw} onChange={setM2} min={0.5} max={300} step="0.001" />
        <ValidatedNumberInput label="Equilibrium Bond Length r_e (Å)" value={rRaw} onChange={setR} min={0.5} max={5} step="0.0001" />
        <ValidatedNumberInput label="Vibration–Rotation Constant α_e (MHz)" value={alphaRaw} onChange={setAlpha} min={0} max={1e5} step="1" />
        <ValidatedNumberInput label="Centrifugal Distortion D (MHz)" value={dRaw} onChange={setD} min={0} max={1000} step="0.001" />
        <ValidatedNumberInput label="Dipole Moment μ (D)" value={muRaw} onChange={setMu} min={0} max={15} step="0.001" />
        <ValidatedNumberInput label="Temperature (K)" value={tRaw} onChange={setT} min={2} max={3000} />
        <ValidatedNumberInput label="Vibrational Level v (0–5)" value={vRaw} onChange={setV} min={0} max={5} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Rotational Constant B_e" value={`${fmt(Be / 100, 6)} cm⁻¹`} tone="blue"
          subtext={`${fmt(toGHz(Be), 6)} GHz; I = μr_e² = ${fmt(mu * k.re * k.re, 4)} kg·m²`} />
        <ResultCard label={`B_v (v = ${v})`} value={valid ? `${fmt(toGHz(Bv), 7)} GHz` : "—"} tone="cyan"
          subtext={valid ? `B_e − α_e(v + ½) = ${fmt(Bv / 100, 6)} cm⁻¹` : "α_e(v + ½) ≥ B_e: lower α_e or v"} />
        <ResultCard label="J = 1 ← 0 Line" value={lines.length ? `${fmt(toGHz(lines[0].sigma), 7)} GHz` : "—"} tone="green"
          subtext={lines.length ? `2B_v − 4D; λ = ${fmt(1e3 / lines[0].sigma, 4)} mm` : "—"} />
        <ResultCard label="Partition Function Q_rot" value={fmt(Q, 5)} tone="gray"
          subtext={!valid ? "—" : Number.isFinite(Q) ? `kT/hcB + ⅓ = ${fmt((k_B * T) / (h * c * Bv) + 1 / 3, 5)}; most populated J = ${Jpop}`
            : "sum not converged before the J cap (distortion turns the levels over): lower T or D"} />
        <ResultCard label="Strongest Line" value={strongest ? `J = ${strongest.J + 1} ← ${strongest.J}` : "—"} tone="purple"
          subtext={strongest ? `${fmt(toGHz(strongest.sigma), 6)} GHz` : "—"} />
        <ResultCard label="Its Intensity S" value={noDipole ? "0 (μ = 0)" : strongest ? `${fmt(strongest.S * 100, 4)} cm/molecule` : "—"} tone={noDipole ? "red" : "orange"}
          subtext={noDipole ? "no permanent dipole: no pure rotational spectrum" : strongest ? `HITRAN units, per molecule in v = ${v}, not abundance-weighted; JPL log₁₀ I = ${(Math.log10(strongest.S * 100 * JPL)).toFixed(4)}` : "—"} />
        <ResultCard label="J = 1 ← 0 Intensity" value={lines.length && !noDipole ? `${fmt(lines[0].S * 100, 4)} cm/molecule` : "—"} tone="yellow"
          subtext={lines.length && !noDipole ? `JPL log₁₀ I = ${Math.log10(lines[0].S * 100 * JPL).toFixed(4)} (nm²·MHz)` : "—"} />
        <ResultCard label="Lines Listed" value={`${lines.length}`} tone="gray" subtext="down to 10⁻⁶ of the strongest" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">B = h/(8π²cμr²),  ν(J+1 ← J) = 2B_v(J+1) − 4D(J+1)³,  S = 2π²σμ²(J+1) e^(−E_J/kT)(1 − e^(−hν/kT)) / (3hcε₀Q)</p>
        <p>The line intensity is the HITRAN integrated cross-section per molecule in level v (multiply by the vibrational population for v ≥ 1, and by the isotopologue abundance for a gas sample). Its (J+1) factor is the dipole matrix element summed over M; with
          the frequency factor and 1 − e^(−hν/kT) ≈ hν/kT it grows as (J+1)³ e^(−E_J/kT), so the strongest line lies above the most populated level.
          For ¹²C¹⁶O at 300 K the J = 1 ← 0 line is 115.2712 GHz and log₁₀ I = −5.0105 in the JPL catalogue; this page gives 115.2712 GHz and −5.0104.</p>
        <p className="text-gray-400">Linear ¹Σ molecules only: no hyperfine structure (HCl shows three Cl-quadrupole components ≈ 30 MHz apart), no
          Λ-doubling, no symmetric-top K structure, no nuclear-spin statistics and no vibrational partition function. Homonuclear molecules
          (μ = 0) have no pure rotational spectrum.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={spectrum} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: "Rotational Spectrum", font: { color: "white" } },
            xaxis: { title: "Frequency (GHz)", gridcolor: "#374151" },
            yaxis: { title: "S (cm/molecule)", gridcolor: "#374151" },
            margin: { t: 40, r: 20, b: 50, l: 70 }, bargap: 0.1,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={populations} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: "Boltzmann Populations", font: { color: "white" } },
            xaxis: { title: "J", gridcolor: "#374151" },
            yaxis: { title: "Fraction in level J (%)", gridcolor: "#374151" },
            margin: { t: 40, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>
    </>
  );
}
