"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { abs2 } from "../../../physics/complex";
import {
  localMaxima, resonantSusceptibility, sfgIntensity, sfgWavelength, type SfgResonance,
} from "../../../physics/spectroscopy/sum-frequency";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const perCm = 100; // 1 cm⁻¹ in 1/m
const IR_MIN = 500;
const IR_MAX = 5000;

// Band assignments: Lambert et al. 2005 (alkyl CH) and Du et al. 1993 (air/water OH). Amplitudes and widths are
// illustrative, in cm⁻¹ (A/Γ is the peak |χ_R| of a lone resonance).
const PRESETS: Record<string, { label: string; range: [number, number]; modes: { name: string; center: number; amplitude: number; halfWidth: number }[] }> = {
  ch: {
    label: "Alkyl chains, CH stretches (ssp; e.g. a thiol monolayer)",
    range: [2800, 3050],
    modes: [
      { name: "CH₂ symmetric (d⁺)", center: 2850, amplitude: 1.5, halfWidth: 6 },
      { name: "CH₃ symmetric (r⁺)", center: 2878, amplitude: 8, halfWidth: 5 },
      { name: "CH₃ Fermi resonance (r⁺_FR)", center: 2938, amplitude: 5, halfWidth: 7 },
      { name: "CH₃ asymmetric (r⁻)", center: 2965, amplitude: 2, halfWidth: 6 },
    ],
  },
  water: {
    label: "Air/water, OH stretches (ssp)",
    range: [2900, 3900],
    modes: [
      { name: "H-bonded OH, ≈ 3200", center: 3200, amplitude: 60, halfWidth: 100 },
      { name: "H-bonded OH, ≈ 3400", center: 3400, amplitude: 50, halfWidth: 100 },
      // Phase-sensitive SFG (Ji, Ostroverkhov, Tian, Shen, Phys. Rev. Lett. 100, 096102 (2008), doi:10.1103/PhysRevLett.100.096102):
      // Im χ⁽²⁾ of the free OH (pointing out of the water) has the opposite sign to the H-bonded band near 3400 cm⁻¹.
      // The amplitudes are illustrative.
      { name: "Free OH, ≈ 3700", center: 3700, amplitude: -15, halfWidth: 15 },
    ],
  },
};

export default function SumFrequencyGenPage() {
  const [visRaw, setVis] = useURLState("visWavelength", 532);
  const [presetRaw, setPreset] = useURLState("preset", "ch");
  const [minRaw, setMin] = useURLState("irMinCm", 2800);
  const [maxRaw, setMax] = useURLState("irMaxCm", 3050);
  const [nrRaw, setNr] = useURLState("nrAmplitude", 0.3);
  const [phaseRaw, setPhase] = useURLState("nrPhaseDeg", 0);

  const visNm = clamp(visRaw, 300, 1100, 532);
  const presetKey = presetRaw in PRESETS ? presetRaw : "ch";
  const preset = PRESETS[presetKey];
  const lo = clamp(minRaw, IR_MIN, IR_MAX - 10, preset.range[0]); // leave room for a non-zero range when "to" ≤ "from"
  const hiIn = clamp(maxRaw, IR_MIN, IR_MAX, preset.range[1]);
  const hi = hiIn > lo ? hiIn : Math.min(IR_MAX, lo + 250);
  const nrAmp = clamp(nrRaw, 0, 10, 0.3);
  const phaseDeg = clamp(phaseRaw, -180, 180, 0);
  const phase = (phaseDeg * Math.PI) / 180;

  const lambdaVis = visNm * 1e-9;
  const resonances: SfgResonance[] = preset.modes.map((m) => ({ center: m.center * perCm, amplitude: m.amplitude * perCm, halfWidth: m.halfWidth * perCm }));

  const n = 1200;
  const grid = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const total = grid.map((s) => sfgIntensity(s * perCm, resonances, nrAmp, phase));
  const resonant = grid.map((s) => abs2(resonantSusceptibility(s * perCm, resonances)));
  const peaks = localMaxima(grid, total);
  const round = (y: number) => Math.round(y * 1e6) / 1e6;
  const series = [
    { name: "|χ_eff|² (with background)", color: "#60a5fa", points: grid.map((x, i) => ({ x, y: round(total[i]) })) },
    { name: "|χ_R|² (resonances only)", color: "#34d399", dashed: true, points: grid.map((x, i) => ({ x, y: round(resonant[i]) })) },
    { name: "|A_NR|² (background only)", color: "#f59e0b", dashed: true, points: [{ x: lo, y: round(nrAmp ** 2) }, { x: hi, y: round(nrAmp ** 2) }] },
  ];

  const sfgNm = (cm: number) => sfgWavelength(lambdaVis, cm * perCm) * 1e9;
  const strongest = peaks.reduce<{ x: number; y: number } | null>((best, p) => (best && best.y >= p.y ? best : p), null);
  const nearestPeak = (center: number) => {
    let best: { x: number; y: number } | null = null;
    for (const p of peaks) if (!best || Math.abs(p.x - center) < Math.abs(best.x - center)) best = p;
    return best;
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="sfg-preset">Interface (resonance set)</label>
          <select
            id="sfg-preset"
            value={presetKey}
            onChange={(e) => {
              const key = e.target.value in PRESETS ? e.target.value : "ch";
              setPreset(key);
              setMin(PRESETS[key].range[0]);
              setMax(PRESETS[key].range[1]);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            {Object.entries(PRESETS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
          </select>
        </div>
        <ValidatedNumberInput label="Visible wavelength λ_vis (nm, vacuum)" value={visRaw} onChange={setVis} min={300} max={1100} />
        <ValidatedNumberInput label="Non-resonant amplitude A_NR" value={nrRaw} onChange={setNr} min={0} max={10} />
        <ValidatedNumberInput label="Non-resonant phase φ (°)" value={phaseRaw} onChange={setPhase} min={-180} max={180} />
        <ValidatedNumberInput label="IR from (cm⁻¹)" value={minRaw} onChange={setMin} min={IR_MIN} max={IR_MAX} />
        <ValidatedNumberInput label="IR to (cm⁻¹)" value={maxRaw} onChange={setMax} min={IR_MIN} max={IR_MAX} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="SFG wavelength range" value={`${fmt(sfgNm(hi), 2)} – ${fmt(sfgNm(lo), 2)} nm`} tone="blue" subtext={`IR ${fmt(lo, 0)}–${fmt(hi, 0)} cm⁻¹ on ${fmt(1e7 / visNm, 1)} cm⁻¹`} />
        <ResultCard label="Strongest SFG peak" value={strongest ? `${fmt(strongest.x, 1)} cm⁻¹` : "—"} tone="green" subtext={strongest ? `|χ_eff|² = ${strongest.y.toPrecision(4)}, λ_SFG ${fmt(sfgNm(strongest.x), 2)} nm` : "No maximum inside the range"} />
        <ResultCard label="Apparent peaks in range" value={`${peaks.length}`} tone="purple" subtext={`${preset.modes.length} resonances; interference merges, shifts or hides peaks`} />
      </div>

      <SimpleLineChart title="SFG intensity vs IR wavenumber" xLabel="IR wavenumber (cm⁻¹)" yLabel="|χ⁽²⁾|² (arb. units)" series={series} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Resonances and where their peaks appear</h3>
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-4">Mode</th>
              <th className="py-1 pr-4">ν̃_q (cm⁻¹)</th>
              <th className="py-1 pr-4">Γ_q (cm⁻¹)</th>
              <th className="py-1 pr-4">A_q/Γ_q</th>
              <th className="py-1 pr-4">λ_SFG (nm)</th>
              <th className="py-1">Nearest apparent peak (cm⁻¹)</th>
            </tr>
          </thead>
          <tbody>
            {preset.modes.map((m) => {
              const p = m.center >= lo && m.center <= hi ? nearestPeak(m.center) : null;
              return (
                <tr key={m.name} className="border-t border-gray-800">
                  <td className="py-1 pr-4">{m.name}</td>
                  <td className="py-1 pr-4 font-mono">{m.center}</td>
                  <td className="py-1 pr-4 font-mono">{m.halfWidth}</td>
                  <td className="py-1 pr-4 font-mono">{fmt(m.amplitude / m.halfWidth, 2)}</td>
                  <td className="py-1 pr-4 font-mono text-blue-400">{fmt(sfgNm(m.center), 2)}</td>
                  <td className="py-1 font-mono text-green-400">{p ? `${fmt(p.x, 1)} (${p.x >= m.center ? "+" : "−"}${fmt(Math.abs(p.x - m.center), 1)})` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          Assignments from Lambert et al. (2005) and Du et al. (1993). Amplitudes and widths are illustrative: real
          values come from fitting a measured spectrum with this model. The nearest peak can belong to a neighbouring
          mode when lines overlap.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">1/λ_SFG = 1/λ_vis + ν̃_IR (ω_SFG = ω_vis + ω_IR)</p>
        <p className="font-mono text-green-400">χ⁽²⁾_eff(ν̃) = A_NR e^(iφ) + Σ_q A_q / (ν̃ − ν̃_q + iΓ_q)</p>
        <p className="font-mono text-purple-400">I_SFG ∝ |χ⁽²⁾_eff|² · I_vis · I_IR</p>
        <p>
          χ⁽²⁾ vanishes in centrosymmetric bulk media in the dipole approximation, so the signal comes from the interface,
          where the symmetry breaks. The terms add as complex amplitudes before squaring: with a real background (φ = 0)
          a positive resonance moves to higher wavenumber and turns dispersive; at φ = +90° the background cancels part
          of a positive resonance (a weaker peak or a dip) and at φ = −90° it adds to it. Some papers write the
          resonance as A_q/(ν̃_q − ν̃ − iΓ_q): the same model with every A_q negated, or φ moved by 180°.
        </p>
      </div>
    </>
  );
}
