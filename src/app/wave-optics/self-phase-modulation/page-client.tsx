"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  SPM_SPECTRUM_MAX_PHASE, criticalPower, gaussianPeakIntensity, nonlinearPhase, pulseHalfWidth, pulsePeakPower,
  rayleighRangeInMedium, selfFocusingDistance, spmMaxFrequencyShift, spmRmsBroadening, spmSpectrum, type PulseShape,
} from "../../../physics/wave-optics/kerr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const round6dp = (x: number) => Math.round(x * 1e6) / 1e6;

/** Spectrum on a frequency axis in THz, cropped to the broadened band. */
function spectrumSeries(phiMax: number, shape: PulseShape, t0: number) {
  const s = spmSpectrum(phiMax, shape);
  if (!s) return null;
  const span = 1.3 * spmMaxFrequencyShift(phiMax, 1, shape) + 4; // in units of 1/T₀
  const keep = s.omegaT0.flatMap((o, i) => (Math.abs(o) <= span ? [i] : []));
  const toTHz = (o: number) => round6(o / t0 / (2 * Math.PI) * 1e-12);
  return [
    { name: "Input (transform limited)", color: "#9ca3af", dashed: true, points: keep.map((i) => ({ x: toTHz(s.omegaT0[i]), y: round6dp(s.input[i]) })) },
    { name: "After SPM", color: "#a78bfa", points: keep.map((i) => ({ x: toTHz(s.omegaT0[i]), y: round6dp(s.output[i]) })) },
  ];
}

export default function SelfPhaseModulationPage() {
  const [lambdaRaw, setLambda] = useURLState("wavelength", 800); // nm
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 1000); // nJ
  const [fwhmRaw, setFwhm] = useURLState("pulseDuration", 100); // fs
  const [waistRaw, setWaist] = useURLState("beamWaist", 50); // µm
  const [n2Raw, setN2] = useURLState("n2", 3.2); // 1e-16 cm²/W = 1e-20 m²/W
  const [lengthRaw, setLength] = useURLState("mediumLength", 2); // mm
  const [n0Raw, setN0] = useURLState("n0", 1.76);
  const [shapeRaw, setShape] = useURLState("shape", "gaussian");
  const shape: PulseShape = shapeRaw === "sech" ? "sech" : "gaussian";

  const lambda = clamp(lambdaRaw, 200, 20000, 800) * 1e-9;
  const energy = clamp(energyRaw, 0, 1e9, 1000) * 1e-9;
  const fwhm = clamp(fwhmRaw, 1, 1e6, 100) * 1e-15;
  const w = clamp(waistRaw, 1, 1e5, 50) * 1e-6;
  const n2 = clamp(n2Raw, 1e-4, 1e6, 3.2) * 1e-20;
  const L = clamp(lengthRaw, 0, 1e4, 2) * 1e-3;
  const n0 = clamp(n0Raw, 1, 5, 1.76);

  const t0 = pulseHalfWidth(fwhm, shape);
  const P0 = pulsePeakPower(energy, fwhm, shape);
  const I0 = gaussianPeakIntensity(P0, w);
  const phiMax = nonlinearPhase(lambda, n2, I0, L);
  const broadening = spmRmsBroadening(phiMax, shape);
  const dOmega = spmMaxFrequencyShift(phiMax, t0, shape);
  const dNu = dOmega / (2 * Math.PI);
  const dLambda = (lambda ** 2 / c) * dNu;
  const Pcr = criticalPower(lambda, n0, n2);
  const zsf = selfFocusingDistance(P0 / Pcr, rayleighRangeInMedium(lambda, n0, w));

  const spectrum = spectrumSeries(phiMax, shape, t0);
  const notes = [
    !spectrum && `φ_max above ${SPM_SPECTRUM_MAX_PHASE} rad: the spectrum grid can't resolve it, and dispersion would matter long before this.`,
    P0 >= Pcr && (zsf < L
      ? `P ≥ P_cr and the beam self-focuses to collapse after about ${fmt(zsf * 1e3, 3)} mm, inside the medium: the plane-wave SPM picture fails there.`
      : `P ≥ P_cr: the beam self-focuses, but the collapse distance ${fmt(zsf * 1e3, 3)} mm lies beyond the medium.`),
  ].filter(Boolean) as string[];

  return (
    <>
      <div role="group" aria-label="Pulse shape" className="flex gap-2 mb-6">
        <button type="button" aria-pressed={shape === "gaussian"} onClick={() => setShape("gaussian")} className={`px-4 py-2 rounded ${shape === "gaussian" ? "bg-blue-600" : "bg-gray-800"}`}>Gaussian</button>
        <button type="button" aria-pressed={shape === "sech"} onClick={() => setShape("sech")} className={`px-4 py-2 rounded ${shape === "sech" ? "bg-blue-600" : "bg-gray-800"}`}>Sech²</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Pulse energy (nJ)" value={energyRaw} onChange={setEnergy} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Pulse duration, intensity FWHM (fs)" value={fwhmRaw} onChange={setFwhm} min={1} max={1e6} step="any" />
        <ValidatedNumberInput label="Beam radius w, 1/e² (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="n₂ (×10⁻¹⁶ cm²/W)" value={n2Raw} onChange={setN2} min={1e-4} max={1e6} step="any" />
        <ValidatedNumberInput label="Medium length L (mm)" value={lengthRaw} onChange={setLength} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Linear index n₀ (for P_cr)" value={n0Raw} onChange={setN0} min={1} max={5} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Peak power P₀" value={`${fmt(P0 * 1e-6)} MW`} subtext={`${shape === "gaussian" ? "0.9394" : "0.8814"} E/FWHM; on-axis I₀ = 2P₀/(πw²) = ${fmt(I0 * 1e-4)} W/cm²`} tone="blue" />
        <ResultCard label="Peak nonlinear phase φ_max" value={`${fmt(phiMax)} rad`} subtext={`k₀n₂I₀L = ${fmt(phiMax / Math.PI, 3)}π; the B-integral of this pass`} tone="orange" />
        <ResultCard label="Rms spectral broadening" value={`${fmt(broadening)}×`} subtext={shape === "gaussian" ? "√(1 + 4φ²/(3√3))" : "√(1 + 32φ²/35)"} tone="green" />
        <ResultCard label="Largest frequency shift" value={`±${fmt(dNu * 1e-12)} THz`} subtext={`${shape === "gaussian" ? "0.858" : "0.770"} φ_max/T₀, ±${fmt(dLambda * 1e9)} nm at λ`} tone="purple" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ResultCard label="Critical power P_cr" value={`${fmt(Pcr * 1e-6)} MW`} subtext={`3.77 λ²/(8π n₀ n₂); P₀/P_cr = ${fmt(P0 / Pcr)}`} tone={P0 >= Pcr ? "red" : "cyan"} />
        <ResultCard label="Self-focusing distance" value={Number.isFinite(zsf) ? `${fmt(zsf * 1e3)} mm` : "none"} subtext={Number.isFinite(zsf) ? "Marburger, collimated beam at the entrance" : "P₀ < P_cr: no collapse"} tone="yellow" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>The pulse&apos;s own intensity changes the index, so it gains the phase φ(T) = φ_max |U(T)|² with φ_max = k₀n₂I₀L.
          The time-varying phase shifts the instantaneous frequency by −dφ/dT: down on the leading edge, up on the trailing
          edge. The spectrum below is the Fourier transform of U(T)e^(iφ(T)). It breaks into about φ_max/π + ½ peaks while
          the pulse shape stays the same. The values are on axis (the beam&apos;s edge sees less phase) and leave out
          dispersion, self-steepening and the Raman response, so they hold while L is much shorter than the dispersion
          length.</p>
        {notes.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      {spectrum && (
        <SimpleLineChart title="Spectrum before and after SPM" xLabel="Frequency offset Δν (THz)" yLabel="Spectral intensity / input peak" series={spectrum} />
      )}
    </>
  );
}
