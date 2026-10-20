"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import {
  DIATOMICS, forceConstant, isotopologue, mostPopulatedJ, reducedMass, rotationalConstantV, rovibrationalBand, vibrationalTerm,
} from "../../../physics/spectroscopy/diatomic";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const cm1 = (sigma: number) => sigma / 100; // m⁻¹ → cm⁻¹
const r6 = (x: number) => Number(x.toPrecision(6));

export default function InfraredSpectroscopyPage() {
  const [molecule, setMolecule] = useURLState("molecule", "hcl");
  const [bandRaw, setBand] = useURLState("band", 1);
  const [tRaw, setT] = useURLState("temperature", 300);
  const [resRaw, setRes] = useURLState("resolution", 0.5);
  const [isotopes, setIsotopes] = useURLState("isotopes", 1);

  const key = molecule === "co" ? "co" : "hcl";
  const p = DIATOMICS[key];
  const vUp = Math.round(clamp(bandRaw, 1, 3, 1));
  const T = clamp(tRaw, 10, 3000, 300);
  const fwhm = clamp(resRaw, 0.01, 20, 0.5) * 100; // m⁻¹
  const showMinor = isotopes !== 0;
  const minor = isotopologue(p, p.minor.m1, p.minor.m2);

  const mu = reducedMass(p.m1, p.m2);
  const origin = vibrationalTerm(vUp, p) - vibrationalTerm(0, p);
  const originMinor = vibrationalTerm(vUp, minor) - vibrationalTerm(0, minor);
  const main = rovibrationalBand(p, vUp, T);
  const second = showMinor ? rovibrationalBand(minor, vUp, T) : [];
  const norm = Math.max(...main.map((l) => l.strength));
  const R0 = main.find((l) => l.branch === "R" && l.J === 0), P1 = main.find((l) => l.branch === "P" && l.J === 1);
  const strongest = (branch: "P" | "R") => main.filter((l) => l.branch === branch).reduce<(typeof main)[number] | undefined>((a, b) => (!a || b.strength > a.strength ? b : a), undefined);
  const strongestR = strongest("R"), strongestP = strongest("P");
  const rho = Math.sqrt(mu / reducedMass(minor.m1, minor.m2));
  const B0 = rotationalConstantV(p, 0), B1 = rotationalConstantV(p, vUp);
  const k = forceConstant(mu, p.we);
  const morseDe = (p.we * p.we) / (4 * p.wexe); // m⁻¹
  const fundamental = vibrationalTerm(1, p) - vibrationalTerm(0, p);

  // Gaussian instrument function of the chosen FWHM over the visible lines
  const visible = main.filter((l) => l.strength >= 1e-3 * norm);
  const lo = Math.min(...visible.map((l) => l.sigma)) - 3 * fwhm, hi = Math.max(...visible.map((l) => l.sigma)) + 3 * fwhm;
  const N = 2000, s2 = (fwhm / (2 * Math.sqrt(2 * Math.LN2))) ** 2;
  const grid = Array.from({ length: N }, (_, i) => lo + ((hi - lo) * i) / (N - 1));
  const envelope = (lines: typeof main, w: number) => grid.map((x) => {
    let y = 0;
    for (const l of lines) { const dx = x - l.sigma; if (dx * dx < 50 * s2) y += l.strength * Math.exp(-(dx * dx) / (2 * s2)); }
    return r6((w * y) / norm);
  });
  const chart = [
    { x: grid.map((x) => r6(cm1(x))), y: envelope(main, 1), type: "scatter", mode: "lines", name: p.label, line: { color: "#60a5fa", width: 1.5 } },
    ...(showMinor ? [{ x: grid.map((x) => r6(cm1(x))), y: envelope(second, (rho * p.minor.abundance) / p.abundance), type: "scatter", mode: "lines", name: `${p.minor.label} (natural abundance)`, line: { color: "#f87171", width: 1.5 } }] : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Molecule</span>
          <select value={key} onChange={(e) => setMolecule(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="hcl">{DIATOMICS.hcl.label} (hydrogen chloride)</option>
            <option value="co">{DIATOMICS.co.label} (carbon monoxide)</option>
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Band</span>
          <select value={vUp} onChange={(e) => setBand(Number(e.target.value))}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>Fundamental, v = 1 ← 0</option>
            <option value={2}>First overtone, v = 2 ← 0</option>
            <option value={3}>Second overtone, v = 3 ← 0</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
          <input type="checkbox" checked={showMinor} onChange={(e) => setIsotopes(e.target.checked ? 1 : 0)} />
          Show {p.minor.label} at natural abundance ({fmt((100 * p.minor.abundance) / (p.abundance + p.minor.abundance), 3)} %)
        </label>
        <ValidatedNumberInput label="Temperature (K)" value={tRaw} onChange={setT} min={10} max={3000} />
        <ValidatedNumberInput label="Instrument Resolution, FWHM (cm⁻¹)" value={resRaw} onChange={setRes} min={0.01} max={20} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Band Origin ν₀" value={`${cm1(origin).toFixed(2)} cm⁻¹`} tone="blue"
          subtext={`G(${vUp}) − G(0); λ = ${fmt(1e6 / origin, 5)} µm`} />
        <ResultCard label="R(0) / P(1)" value={R0 && P1 ? `${cm1(R0.sigma).toFixed(2)} / ${cm1(P1.sigma).toFixed(2)}` : "—"} tone="green"
          subtext={`cm⁻¹; gap ≈ 2(B₀ + B_v) = ${cm1(2 * (B0 + B1)).toFixed(2)} cm⁻¹, no Q branch`} />
        <ResultCard label="Strongest R / P Lines" value={strongestR && strongestP ? `R(${strongestR.J}) / P(${strongestP.J})` : "—"} tone="purple"
          subtext={strongestR && strongestP ? `${cm1(strongestR.sigma).toFixed(2)} / ${cm1(strongestP.sigma).toFixed(2)} cm⁻¹; most populated J = ${mostPopulatedJ(B0, T)}` : "—"} />
        <ResultCard label="Isotope Shift of ν₀" value={`${cm1(originMinor - origin).toFixed(3)} cm⁻¹`} tone="red"
          subtext={`${p.minor.label} − ${p.label}; ρ = √(μ/μᵢ) = ${fmt(rho, 6)}`} />
        <ResultCard label="Harmonic Frequency ω_e" value={`${cm1(p.we).toFixed(2)} cm⁻¹`} tone="cyan"
          subtext={`fundamental ${cm1(fundamental).toFixed(2)} cm⁻¹ (anharmonic)`} />
        <ResultCard label="Force Constant k" value={`${fmt(k, 4)} N/m`} tone="yellow" subtext="k = μ(2πcω_e)²" />
        <ResultCard label="Anharmonicity ω_e x_e" value={`${cm1(p.wexe).toFixed(3)} cm⁻¹`} tone="orange"
          subtext={`Morse well depth ω_e²/(4ω_e x_e) = ${fmt((morseDe / 1e9) * hc_eV_nm, 3)} eV (rough)`} />
        <ResultCard label="B₀ / B_v" value={`${cm1(B0).toFixed(4)} / ${cm1(B1).toFixed(4)}`} tone="gray" subtext="cm⁻¹; B_v = B_e − α_e(v + ½)" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: `${p.label} ${vUp === 1 ? "Fundamental" : vUp === 2 ? "First Overtone" : "Second Overtone"} at ${T} K`, font: { color: "white" } },
          xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151", autorange: "reversed" },
          yaxis: { title: "Relative absorption", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">ν = G(v) − G(0) + F_v(J′) − F₀(J″),  G(v) = ω_e(v+½) − ω_e x_e(v+½)² + ω_e y_e(v+½)³ + ω_e z_e(v+½)⁴,  F_v(J) = B_vJ(J+1) − DJ²(J+1)²</p>
        <p>R(J″): J′ = J″ + 1, P(J″): J′ = J″ − 1; a ¹Σ molecule has no ΔJ = 0 line, hence the gap at ν₀. Line strengths are relative:
          σ × Hönl–London factor (J″+1 for R, J″ for P) × Boltzmann fraction × (1 − e^(−hcσ/kT)), convolved with a Gaussian of the chosen
          resolution. The isotopologue uses the same potential with ω_e ∝ μ^(−½), ω_e x_e ∝ μ⁻¹, B_e ∝ μ⁻¹, and its band is scaled by ρ, the harmonic
          ratio of squared transition dipoles (|⟨1|x|0⟩|² ∝ 1/μω); for overtones that ratio is only approximate. Constants: NIST WebBook (Huber &amp; Herzberg).</p>
        <p className="text-gray-400">No Herman–Wallis factor (vibration–rotation interaction makes real P and R lines of equal J unequal, by several per cent at moderate J in the HCl fundamental and more in overtones), no pressure or Doppler broadening, no
          absolute band strength: the y-axis shows shape, not absorbance. Polyatomic molecules have 3N − 6 modes and group frequencies
          (C=O ≈ 1700, O–H ≈ 3300, C–H ≈ 2900 cm⁻¹) that this page does not model.</p>
      </div>
    </>
  );
}
