"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { unwrapPhase } from "../../../physics/math";
import { createRng, gaussian } from "../../../physics/random";
import {
  demoSingleBeam, findZpd, forman, lowResolutionPhase, magnitudeSpectrum, mertz, phaseAt, relativeRmsError, synthesizeInterferogram,
  uncorrectedSpectrum, type Spectrum,
} from "../../../physics/spectroscopy/ftir-phase-correction";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (v: number, d = 3) => (Number.isFinite(v) ? Number(v.toPrecision(d)).toString() : "—");
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

const DX = 632.8e-7; // cm: one HeNe wavelength per sample, Nyquist 7901 cm⁻¹
/** Single-beam spectrum: a broad source envelope times the transmittance of four Gaussian absorption bands. */
const trueSpectrum = (s: number) => demoSingleBeam(s);
const METHODS = { mertz: "Mertz", forman: "Forman", magnitude: "Magnitude" } as const;
type Method = keyof typeof METHODS;
const PLOT_LO = 400, PLOT_HI = 4000;

const plotPoints = (sp: Spectrum) => {
  const idx = sp.sigma.map((_, k) => k).filter((k) => sp.sigma[k] >= PLOT_LO && sp.sigma[k] <= PLOT_HI);
  const step = Math.max(1, Math.ceil(idx.length / 1200));
  return idx.filter((_, i) => i % step === 0).map((k) => ({ x: round6(sp.sigma[k]), y: round6(sp.B[k]) }));
};

export default function PhaseCorrectionPage() {
  const [nRaw, setOpdPoints] = useURLState("opdPoints", 4096);
  const [mRaw, setDoubleSided] = useURLState("doubleSided", 128);
  const [epsRaw, setZpdShift] = useURLState("zpdShift", 0.3);
  const [phi0Raw, setPhaseOffset] = useURLState("phaseOffset", 0.5);
  const [phi2Raw, setDispersion] = useURLState("dispersion", 1);
  const [noiseRaw, setNoise] = useURLState("noise", 0.01);
  const [methodRaw, setMethod] = useURLState("method", "mertz");

  const N = Math.round(clamp(nRaw, 512, 8192, 4096));
  const M = Math.round(clamp(mRaw, 16, 512, 128));
  const eps = clamp(epsRaw, -0.5, 0.5, 0.3);
  const phi0 = clamp(phi0Raw, -Math.PI, Math.PI, 0.5);
  const phi2 = clamp(phi2Raw, -5, 5, 1);
  const noisePct = clamp(noiseRaw, 0, 5, 0.01);
  const method: Method = methodRaw in METHODS ? (methodRaw as Method) : "mertz";

  // Phase error: ZPD ε samples before sample 0 (linear in σ), a constant offset and quadratic dispersion about 2000 cm⁻¹.
  const phi = (s: number) => 2 * Math.PI * s * eps * DX + phi0 + phi2 * ((s - 2000) / 2000) ** 2;
  const nNeg = N + 8;
  const clean = synthesizeInterferogram(trueSpectrum, phi, DX, nNeg, N);
  const peak = Math.max(...clean.map(Math.abs));
  const rng = createRng(1);
  const record = { I: clean.map((v) => v + (noisePct / 100) * peak * gaussian(rng)), zero: nNeg, dx: DX };
  const z = findZpd(record);

  const spectra: Record<Method | "none", Spectrum> = {
    none: uncorrectedSpectrum(record, z, M),
    mertz: mertz(record, z, M),
    forman: forman(record, z, M),
    magnitude: magnitudeSpectrum(record, z, N - 8),
  };
  const errors = Object.fromEntries(Object.entries(spectra).map(([k, sp]) => [k, relativeRmsError(sp, trueSpectrum)])) as Record<Method | "none", number>;

  // Phase in the frame of the found ZPD, true and estimated, where the spectrum is at least 5 % of its peak.
  const p = lowResolutionPhase(record, z, M);
  const shift = z - nNeg;
  const tPeak = trueSpectrum(2000);
  const sig = p.sigma.filter((s) => s >= PLOT_LO && trueSpectrum(s) >= 0.05 * tPeak);
  const trueFrame = unwrapPhase(sig.map((s) => phi(s) + 2 * Math.PI * s * shift * DX));
  const est = unwrapPhase(sig.map((s) => phaseAt(p, s)));
  const turns = Math.round((est[0] - trueFrame[0]) / (2 * Math.PI));
  const estAligned = est.map((v) => v - 2 * Math.PI * turns);
  const phaseRms = Math.sqrt(estAligned.reduce((a, v, i) => a + (v - trueFrame[i]) ** 2, 0) / Math.max(1, sig.length));

  const truthSpectrum: Spectrum = { sigma: spectra.none.sigma, B: spectra.none.sigma.map(trueSpectrum) };
  const spectrumSeries = [
    { name: "True B(σ)", color: "#34d399", dashed: true, points: plotPoints(truthSpectrum) },
    { name: "No correction", color: "#9ca3af", points: plotPoints(spectra.none) },
    { name: METHODS[method], color: "#60a5fa", points: plotPoints(spectra[method]) },
  ];
  const phaseSeries = [
    { name: "True phase", color: "#34d399", dashed: true, points: sig.map((s, i) => ({ x: round6(s), y: round6(trueFrame[i]) })) },
    { name: "Estimate (±M samples)", color: "#f87171", showPoints: true, points: sig.map((s, i) => ({ x: round6(s), y: round6(estAligned[i]) })) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Single-Sided Points N" value={nRaw} onChange={setOpdPoints} min={512} max={8192} step="1" />
        <ValidatedNumberInput label="Double-Sided Points ±M" value={mRaw} onChange={setDoubleSided} min={16} max={512} step="1" />
        <ValidatedNumberInput label="ZPD Offset ε (samples)" value={epsRaw} onChange={setZpdShift} min={-0.5} max={0.5} />
        <ValidatedNumberInput label="Phase Offset φ₀ (rad)" value={phi0Raw} onChange={setPhaseOffset} min={-3.14159} max={3.14159} />
        <ValidatedNumberInput label="Dispersion φ₂ (rad)" value={phi2Raw} onChange={setDispersion} min={-5} max={5} />
        <ValidatedNumberInput label="Noise, RMS (% of centreburst)" value={noiseRaw} onChange={setNoise} min={0} max={5} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {(Object.keys(METHODS) as Method[]).map((k) => <option key={k} value={k}>{METHODS[k]}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Spectrum Error, ${METHODS[method]}`} value={`${fmt(100 * errors[method])} %`} tone="blue" subtext="RMS vs truth where B ≥ 5 % of peak" />
        <ResultCard label="Error Without Correction" value={`${fmt(100 * errors.none)} %`} tone="yellow" subtext="real part of the ramp-weighted transform" />
        <ResultCard label="Phase Estimate Error" value={`${fmt(phaseRms)} rad`} tone="purple" subtext={`RMS; phase resolution ${fmt(1 / (2 * M * DX))} cm⁻¹`} />
        <ResultCard label="Resolution 1/L" value={`${fmt(1 / (N * DX))} cm⁻¹`} tone="green" subtext={`ZPD found ${shift >= 0 ? "+" : ""}${shift} samples from 0`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400"><th className="py-1 pr-4">Method</th><th className="py-1 pr-4">RMS error</th><th className="py-1">Data used</th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-800"><td className="py-1 pr-4">No correction</td><td className="py-1 pr-4">{fmt(100 * errors.none)} %</td><td className="py-1">−M … N</td></tr>
            <tr className="border-t border-gray-800"><td className="py-1 pr-4">Mertz</td><td className="py-1 pr-4">{fmt(100 * errors.mertz)} %</td><td className="py-1">−M … N</td></tr>
            <tr className="border-t border-gray-800"><td className="py-1 pr-4">Forman</td><td className="py-1 pr-4">{fmt(100 * errors.forman)} %</td><td className="py-1">−M … N (resolution of N − M)</td></tr>
            <tr className="border-t border-gray-800"><td className="py-1 pr-4">Magnitude</td><td className="py-1 pr-4">{fmt(100 * errors.magnitude)} %</td><td className="py-1">double-sided −N … N</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <SimpleLineChart title="Spectrum" xLabel="Wavenumber (cm⁻¹)" yLabel="B(σ)" series={spectrumSeries} />
        <SimpleLineChart title="Phase in the frame of the found ZPD" xLabel="Wavenumber (cm⁻¹)" yLabel="Phase (rad)" series={phaseSeries} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">I(x) = 2∫ B(σ) cos(2πσx + φ(σ)) dσ,   φ(σ) = 2πσεΔx + φ₀ + φ₂((σ − 2000)/2000)²</p>
        <p className="font-mono">Mertz: B = 2Δx·Re[C(σ)e^(−iφ̂)],   Forman: B = cos-FT[I ⊛ IFT(e^(−iφ̂))],   Magnitude: B = Δx|C(σ)|</p>
        <p>
          A broad source with four absorption bands is turned into an interferogram sampled every HeNe wavelength (Nyquist
          7901 cm⁻¹), with the ZPD between samples, a constant phase offset and beamsplitter-like dispersion, plus white noise
          (fixed seed). The record is single-sided: M samples before the largest sample and N after it. Both corrections take
          the phase φ̂ from the short double-sided part (triangular apodization), so φ̂ has the low resolution 1/(2MΔx) and
          errs near sharp bands. Mertz weights the record with a ramp over ±M so each pair of points counts once, transforms
          it and rotates each bin by −φ̂. Forman convolves the record with the transform of e^(−iφ̂), which makes it symmetric,
          and cosine-transforms the symmetric half. The magnitude spectrum needs no phase but a double-sided scan, and it
          turns noise into a positive offset where the signal is weak.
        </p>
      </div>
    </>
  );
}
