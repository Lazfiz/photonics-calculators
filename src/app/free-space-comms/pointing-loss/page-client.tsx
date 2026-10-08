"use client";

import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { pointingCapture } from "../../../physics/free-space-comms/pointing-loss";

const presets = [
  { label: "Tight pointing", wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 0.5, misalign: 0.2, rxAperture: 10, range: 1 },
  { label: "Moderate jitter", wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 2, misalign: 1, rxAperture: 10, range: 1 },
  { label: "Long link", wavelength: 1550, txBeamWaist: 1, jitterRMS: 5, misalign: 2, rxAperture: 10, range: 10 },
];

const dB = (eta: number) => (eta > 0 ? -10 * Math.log10(eta) : Infinity);
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

export default function PointingLossPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [txBeamWaist, setTxBeamWaist] = useURLState("txBeamWaist", 2.5); // cm, 1/e² radius at the transmitter
  const [jitterRMS, setJitterRMS] = useURLState("jitterRMS", 1); // µrad per axis
  const [misalign, setMisalign] = useURLState("misalign", 0); // µrad
  const [rxAperture, setRxAperture] = useURLState("rxAperture", 10); // cm diameter
  const [range, setRange] = useURLState("range", 1); // km

  const calc = useMemo(() => {
    const r = pointingCapture(wavelength * 1e-9, txBeamWaist * 1e-2, range * 1e3, rxAperture * 1e-2, misalign * 1e-6, jitterRMS * 1e-6);
    return {
      ...r,
      divergenceUrad: ((wavelength * 1e-9) / (Math.PI * txBeamWaist * 1e-2)) * 1e6,
      pointingLossDb: dB(r.meanFraction / r.alignedFraction),
      geometricLossDb: dB(r.alignedFraction),
      totalLossDb: dB(r.meanFraction),
    };
  }, [wavelength, txBeamWaist, jitterRMS, misalign, rxAperture, range]);

  const series = useMemo(() => {
    const jMax = Math.max(20, 3 * jitterRMS);
    const js = Array.from({ length: 121 }, (_, i) => (i * jMax) / 120);
    const rs = js.map((j) =>
      pointingCapture(wavelength * 1e-9, txBeamWaist * 1e-2, range * 1e3, rxAperture * 1e-2, misalign * 1e-6, j * 1e-6));
    // A beam that misses the aperture entirely has infinite loss; leave those points out.
    const finite = (pts: { x: number; y: number }[]) => pts.filter((p) => Number.isFinite(p.y));
    return [
      { name: "Pointing loss", color: "#06b6d4", points: finite(js.map((x, i) => ({ x, y: dB(rs[i].meanFraction / rs[i].alignedFraction) }))) },
      { name: "Geometric + pointing", color: "#f97316", dashed: true, points: finite(js.map((x, i) => ({ x, y: dB(rs[i].meanFraction) }))) },
      { name: "Current jitter", color: "#22c55e", showPoints: true, points: finite([{ x: jitterRMS, y: calc.totalLossDb }]) },
    ];
  }, [wavelength, txBeamWaist, misalign, rxAperture, range, jitterRMS, calc.totalLossDb]);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = wavelength === p.wavelength && txBeamWaist === p.txBeamWaist && jitterRMS === p.jitterRMS &&
            misalign === p.misalign && rxAperture === p.rxAperture && range === p.range;
          return (
            <button key={p.label}
              onClick={() => { setWavelength(p.wavelength); setTxBeamWaist(p.txBeamWaist); setJitterRMS(p.jitterRMS); setMisalign(p.misalign); setRxAperture(p.rxAperture); setRange(p.range); }}
              className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={11000} step={1} unit="nm" />
        <InputSlider label="TX beam waist w₀ (1/e² radius)" value={txBeamWaist} onChange={setTxBeamWaist} min={0.1} max={20} step={0.1} unit="cm" />
        <ValidatedNumberInput label="Link range (km)" value={range} onChange={setRange} min={0.001} max={100000} step="0.1" />
        <InputSlider label="Jitter σ per axis" value={jitterRMS} onChange={setJitterRMS} min={0} max={100} step={0.1} unit="µrad" />
        <InputSlider label="Static misalignment" value={misalign} onChange={setMisalign} min={0} max={100} step={0.1} unit="µrad" />
        <InputSlider label="RX aperture diameter" value={rxAperture} onChange={setRxAperture} min={0.1} max={100} step={0.1} unit="cm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label={`Beam radius @ ${range} km`} value={`${fmt(calc.beamRadius * 100)} cm`} tone="green"
          subtext={`far-field divergence λ/(πw₀) = ${fmt(calc.divergenceUrad)} µrad`} />
        <ResultCard label="Pointing offset / jitter at RX" value={`${fmt(calc.offset * 100)} / ${fmt(calc.jitter * 100)} cm`} tone="yellow"
          subtext="static offset b, jitter s per axis" />
        <ResultCard label="Aligned capture η₀" value={`${fmt(calc.alignedFraction * 100, 4)} %`} tone="blue"
          subtext={`geometric loss ${fmt(calc.geometricLossDb)} dB`} />
        <ResultCard label="Mean capture ⟨η⟩" value={`${fmt(calc.meanFraction * 100, 4)} %`} tone="purple" subtext="with offset and jitter" />
        <ResultCard label="Pointing loss" value={`${fmt(calc.pointingLossDb)} dB`} tone="orange" subtext="−10 log₁₀(⟨η⟩/η₀)" />
        <ResultCard label="Geometric + pointing loss" value={`${fmt(calc.totalLossDb)} dB`} tone="red" subtext="−10 log₁₀⟨η⟩" />
      </div>

      <SimpleLineChart title={`Loss vs jitter at ${range} km`} xLabel="Jitter σ per axis (µrad)" yLabel="Loss (dB)" series={series} />

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">w(z) = w₀√(1 + (z/z_R)²),   z_R = πw₀²/λ,   η₀ = 1 − exp(−2a²/w²)</p>
        <p className="font-mono">⟨η⟩ = 1 − Q₁(b/σ_t, a/σ_t),   σ_t² = w²/4 + s²,   b = θ_b z,   s = σ_θ z</p>
        <p>
          A Gaussian beam with its waist at the transmitter reaches the receiver with radius w(z). Its intensity is a
          2-D Gaussian (σ = w/2 per axis); random jitter of σ_θ per axis moves its centre by a Gaussian amount, so the
          time-averaged power on the aperture of radius a is the fraction of a wider Gaussian (σ_t) offset by the
          static error b, a Marcum Q-function. For a small aperture this reduces to η₀ · w²/(w² + 4s²) ·
          exp(−2b²/(w² + 4s²)) (Farid &amp; Hranilovic, J. Lightwave Technol. 25, 1702 (2007)). Jitter is a fading
          process: this is the mean, not the outage probability.
        </p>
        <p className="text-gray-500">
          Not modelled: atmospheric attenuation, turbulence (beam wander, spreading, scintillation) and truncation of
          the transmitted beam by the TX aperture.
        </p>
      </div>
    </>
  );
}
