"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, q } from "../../../physics/constants";
import {
  IONIZATION_ENERGY_EV, barrierSuppressionIntensity, fourierLimitDuration, hhgCutoff, highestOddHarmonic,
  lorentzDriftParameter, ponderomotiveEnergy, type HhgGas,
} from "../../../physics/wave-optics/high-harmonic";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const GAS_NAMES: Record<HhgGas, string> = {
  xenon: "Xenon", krypton: "Krypton", hydrogen: "Hydrogen (atomic)", argon: "Argon", neon: "Neon", helium: "Helium",
};

export default function AttosecondPulsePage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 800); // nm, driver
  const [durationRaw, setDuration] = useURLState("duration", 5); // fs FWHM, driver
  const [intensityRaw, setIntensity] = useURLState("intensity", 2e14); // W/cm²
  const [gasRaw, setGas] = useURLState("gas", "argon");
  const [edgeRaw, setEdge] = useURLState("filterEdge", 20); // eV

  const lambda = clamp(wavelengthRaw, 200, 10000, 800) * 1e-9;
  const tau = clamp(durationRaw, 1, 1000, 5) * 1e-15;
  const intensityCm2 = clamp(intensityRaw, 1e12, 1e16, 2e14);
  const gas: HhgGas = gasRaw in IONIZATION_ENERGY_EV ? (gasRaw as HhgGas) : "argon";
  const edge = clamp(edgeRaw, 0, 1e4, 20) * q;

  const ip = IONIZATION_ENERGY_EV[gas] * q;
  const up = ponderomotiveEnergy(intensityCm2 * 1e4, lambda);
  const cutoff = hhgCutoff(ip, up);
  const photon = (h * c) / lambda;
  const qMax = highestOddHarmonic(cutoff, photon);
  const keldysh = up > 0 ? Math.sqrt(ip / (2 * up)) : NaN; // γ_K = √(I_p/(2U_p))
  const ibs = barrierSuppressionIntensity(ip) / 1e4; // W/cm²
  const drift = lorentzDriftParameter(ip, intensityCm2 * 1e4, lambda);
  const band = cutoff - edge;
  const tl = fourierLimitDuration(band);
  const period = lambda / c;

  const lMax = Math.max(3000e-9, 1.5 * lambda);
  const series = [
    {
      name: `Cutoff, ${GAS_NAMES[gas].toLowerCase()} at ${fmt(intensityCm2, 3)} W/cm²`,
      color: "#60a5fa",
      points: Array.from({ length: 161 }, (_, i) => {
        const l = 200e-9 + (i / 160) * (lMax - 200e-9);
        return { x: round6(l * 1e9), y: round6(hhgCutoff(ip, ponderomotiveEnergy(intensityCm2 * 1e4, l)) / q) };
      }),
    },
    { name: "Set wavelength", color: "#f87171", showPoints: true, points: [{ x: round6(lambda * 1e9), y: round6(cutoff / q) }] },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Driver wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={10000} step="any" />
        <ValidatedNumberInput label="Driver duration, FWHM (fs)" value={durationRaw} onChange={setDuration} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Peak intensity (W/cm²)" value={intensityRaw} onChange={setIntensity} min={1e12} max={1e16} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Gas</span>
          <select value={gas} onChange={(e) => setGas(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {(Object.keys(IONIZATION_ENERGY_EV) as HhgGas[]).map((g) => (
              <option key={g} value={g}>{GAS_NAMES[g]}, I_p = {IONIZATION_ENERGY_EV[g]} eV</option>
            ))}
          </select>
        </label>
        <ValidatedNumberInput label="Low edge of the selected band (eV)" value={edgeRaw} onChange={setEdge} min={0} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard
          label="Ponderomotive energy U_p"
          value={`${fmt(up / q)} eV`}
          subtext={intensityCm2 > ibs
            ? `above the barrier-suppression intensity ${fmt(ibs, 3)} W/cm²: ionization saturates the medium; long drivers cap the cutoff near I_BS, few-cycle drivers reach somewhat beyond it`
            : `barrier-suppression intensity ${fmt(ibs, 3)} W/cm²`}
          tone={intensityCm2 > ibs ? "red" : "orange"}
        />
        <ResultCard label="Cutoff photon energy" value={`${fmt(cutoff / q)} eV`} subtext={`I_p + 3.17 U_p; λ = ${fmt(((h * c) / cutoff) * 1e9)} nm, last odd harmonic ${qMax}; Keldysh γ = ${fmt(keldysh, 3)}`} tone="blue" />
        <ResultCard
          label="Fourier-limited pulse"
          value={band > 0 ? `${fmt(tl * 1e18)} as` : "—"}
          subtext={band > 0 ? `Gaussian, ΔE = ${fmt(band / q)} eV from the band edge to the cutoff` : "the band edge is at or above the cutoff"}
          tone="purple"
        />
        <ResultCard label="Driver cycles in the FWHM" value={fmt(tau / period, 3)} subtext={`bursts every T/2 = ${fmt((period / 2) * 1e15)} fs; harmonics 2ħω = ${fmt((2 * photon) / q)} eV apart`} tone="cyan" />
      </div>

      {keldysh > 1 && (
        <p className="text-sm text-yellow-400 mb-6">Keldysh γ = {fmt(keldysh, 3)} &gt; 1: multiphoton regime, where the three-step cutoff law I_p + 3.17 U_p is only indicative.</p>
      )}
      {drift > 1 && (
        <p className="text-sm text-yellow-400 mb-6">Lorentz drift Γ = √(2I_p) a₀³ c/(16ω) = {fmt(drift, 3)} &gt; 1 (Klaiber et al. 2008): the
          magnetic force pushes the returning electron past the ion by more than its wave-packet spread, so recombination and the
          harmonic yield fall, more steeply as Γ grows (Galloway et al. 2016 measured it at mid-infrared drivers).</p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>In the three-step model an electron tunnels out near a field peak, is driven by the laser field and recombines,
          emitting up to I_p + 3.17 U_p, with U_p = e²I/(2ε₀cmω²) ∝ Iλ². A multi-cycle driver repeats this every half cycle,
          giving a train of attosecond bursts and odd harmonics 2ħω apart; an isolated pulse needs a driver of about one cycle
          or a gating scheme. The Fourier limit treats the selected band, from its low edge (a metal filter, say) to the cutoff,
          as a Gaussian FWHM. The intrinsic attochirp makes real pulses longer, and above the barrier-suppression intensity
          ionization depletes the gas before the peak. Since Γ grows as I^(3/2)λ⁴, long-wavelength drivers meet the
          magnetic-drift limit first (Γ = 1 for helium near 7 × 10¹⁵ W/cm² at 1.8 µm, 1.3 × 10¹⁴ W/cm² at 8 µm).</p>
      </div>

      <SimpleLineChart title="Cutoff energy against driver wavelength" xLabel="Driver wavelength (nm)" yLabel="Cutoff photon energy (eV)" series={series} />
    </>
  );
}
