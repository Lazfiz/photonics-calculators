"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { peakPower } from "../../../physics/laser-safety/peak-power";
import { chirpedGaussianDuration, gddForStretch, treacyCompressor } from "../../../physics/wave-optics/chirped-pulse";
import { TIME_BANDWIDTH, frequencyWidth } from "../../../physics/wave-optics/pulsed-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function ChirpedPulsePage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 800); // nm
  const [bandwidthRaw, setBandwidth] = useURLState("inputBandwidth", 10); // nm FWHM
  const [ratioRaw, setRatio] = useURLState("stretchRatio", 1000);
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 1); // mJ
  const [linesRaw, setLines] = useURLState("gratingLines", 1740); // lines/mm
  const [incidenceRaw, setIncidence] = useURLState("incidence", 45); // deg
  const [offsetRaw, setOffset] = useURLState("compressorOffset", 0); // mm

  const lambda = clamp(wavelengthRaw, 200, 5000, 800) * 1e-9;
  const dlambda = clamp(bandwidthRaw, 0.01, 1000, 10) * 1e-9;
  const ratio = clamp(ratioRaw, 1, 1e6, 1000);
  const energy = clamp(energyRaw, 0, 1e5, 1) * 1e-3;
  const groove = 1e-3 / clamp(linesRaw, 100, 4000, 1740);
  const incidence = (clamp(incidenceRaw, 0, 89, 45) * Math.PI) / 180;
  const offset = clamp(offsetRaw, -1e4, 1e4, 0) * 1e-3;

  const dnu = frequencyWidth(dlambda, lambda);
  const tau0 = TIME_BANDWIDTH.gaussian / dnu;
  const gddStretch = gddForStretch(tau0, ratio);
  const tauStretched = chirpedGaussianDuration(tau0, gddStretch);
  const perMetre = treacyCompressor(lambda, groove, incidence, 1); // double pass, per metre of separation
  const separation = gddStretch / -perMetre.gdd;
  const compressor = treacyCompressor(lambda, groove, incidence, separation);
  const residual = perMetre.gdd * offset;
  const tauOut = chirpedGaussianDuration(tau0, residual);
  const peakStretched = peakPower(energy, tauStretched, "gaussian");
  const peakOut = peakPower(energy, Number.isFinite(perMetre.gdd) ? tauOut : NaN, "gaussian");
  const noOrder = !Number.isFinite(perMetre.beta);

  // ΔG range: ±3 τ₀²/(4 ln2 |φ₂ per m|) takes the output to √10 τ₀; widen it to include the entered offset.
  const span = Math.max((3 * tau0 ** 2) / (4 * Math.LN2 * Math.abs(perMetre.gdd)), 1.2 * Math.abs(offset));
  const series = Number.isFinite(span) && span > 0 ? [
    {
      name: "Output FWHM",
      color: "#60a5fa",
      points: Array.from({ length: 201 }, (_, i) => {
        const dG = ((i - 100) / 100) * span;
        return { x: round6(dG * 1e3), y: round6(chirpedGaussianDuration(tau0, perMetre.gdd * dG) * 1e15) };
      }),
    },
    { name: "Set offset", color: "#f87171", showPoints: true, points: [{ x: round6(offset * 1e3), y: round6(tauOut * 1e15) }] },
  ] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Centre wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={5000} step="any" />
        <ValidatedNumberInput label="Spectral bandwidth, FWHM (nm)" value={bandwidthRaw} onChange={setBandwidth} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Stretch ratio τ_s/τ₀" value={ratioRaw} onChange={setRatio} min={1} max={1e6} step="any" />
        <ValidatedNumberInput label="Amplified pulse energy (mJ)" value={energyRaw} onChange={setEnergy} min={0} max={1e5} step="any" />
        <ValidatedNumberInput label="Compressor grating (lines/mm)" value={linesRaw} onChange={setLines} min={100} max={4000} step="any" />
        <ValidatedNumberInput label="Incidence angle (°)" value={incidenceRaw} onChange={setIncidence} min={0} max={89} step="any" />
        <ValidatedNumberInput label="Compressor separation offset ΔG (mm)" value={offsetRaw} onChange={setOffset} min={-1e4} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Transform-limited duration τ₀" value={`${fmt(tau0 * 1e15)} fs`} subtext={`Gaussian, Δν = ${fmt(dnu / 1e12)} THz, τ₀ = 0.4413/Δν`} tone="green" />
        <ResultCard label="Stretched duration" value={`${fmt(tauStretched * 1e12)} ps`} subtext={`stretcher GDD +${fmt(gddStretch * 1e24)} ps²; peak in the amplifier ${fmt(peakStretched / 1e6)} MW`} tone="orange" />
        <ResultCard
          label="Matched grating separation G"
          value={noOrder ? "—" : `${fmt(separation * 1e3)} mm`}
          subtext={noOrder
            ? "no first diffraction order: λ/d − sin α > 1"
            : `double pass, β = ${fmt((perMetre.beta * 180) / Math.PI)}°, ${fmt(perMetre.gdd * 1e27)} fs²/mm; TOD ${fmt(compressor.tod * 1e45)} fs³`}
          tone="cyan"
        />
        <ResultCard label="Recompressed duration" value={noOrder ? "—" : `${fmt(tauOut * 1e15)} fs`} subtext={`residual GDD ${fmt(residual * 1e30)} fs²; peak ${fmt(peakOut / 1e9)} GW`} tone="blue" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A Gaussian spectrum of FWHM Δν supports a pulse no shorter than τ₀ = 0.4413/Δν. A GDD φ₂ stretches it to
          τ₀√(1 + (4 ln2 φ₂/τ₀²)²), so the stretcher needs φ₂ = (τ₀²/4 ln2)√(r² − 1) for a stretch ratio r. The amplifier
          sees the lower stretched peak power. A Treacy grating pair, passed twice, gives φ₂ = −2Gλ³/(2πc²d²cos³β) with sin β = λ/d − sin α,
          and the separation G that cancels the stretcher returns the pulse to τ₀. Moving the grating by ΔG leaves a residual
          GDD and a longer pulse; no setting gives less than τ₀. The stretcher is assumed to cancel the compressor TOD as well.</p>
      </div>

      {series.length > 0 && (
        <SimpleLineChart title="Recompressed duration against grating separation" xLabel="ΔG from the matched separation (mm)" yLabel="Output FWHM (fs)" series={series} />
      )}
    </>
  );
}
