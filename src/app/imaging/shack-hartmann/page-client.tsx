"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  type LensletShape, centroidPrecision, dynamicRangeAngle, dynamicRangeOverPupil, fresnelNumber, lensletsInPupil,
  marechalStrehl, spotFirstZeroRadius, spotFwhm, wavefrontPerPixel,
} from "../../../physics/imaging/shack-hartmann";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
const MAX_CELLS_DRAWN = 4096;

export default function ShackHartmannPage() {
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelengthNm", 632.8);
  const [apertureDiameterMm, setApertureDiameterMm] = useURLState("apertureDiameterMm", 8);
  const [lensletPitchUm, setLensletPitchUm] = useURLState("lensletPitchUm", 300);
  const [lensletFocalMm, setLensletFocalMm] = useURLState("lensletFocalMm", 20);
  const [detectorPixelUm, setDetectorPixelUm] = useURLState("detectorPixelUm", 5.5);
  const [rmsWavefrontNm, setRmsWavefrontNm] = useURLState("rmsWavefrontNm", 150);
  const [photons, setPhotons] = useURLState("photons", 1000);
  const [shapeParam, setShape] = useURLState("lensletShape", "square");
  const shape: LensletShape = shapeParam === "circular" ? "circular" : "square";

  const lambda = wavelengthNm * 1e-9;
  const D = apertureDiameterMm * 1e-3;
  const d = lensletPitchUm * 1e-6;
  const f = lensletFocalMm * 1e-3;
  const p = detectorPixelUm * 1e-6;

  const spotDiameter = 2 * spotFirstZeroRadius(lambda, f, d, shape);
  const fwhm = spotFwhm(lambda, f, d, shape);
  const thetaMax = dynamicRangeAngle(lambda, f, d, shape);
  const range = dynamicRangeOverPupil(thetaMax, D);
  const nF = fresnelNumber(lambda, f, d);
  const perPixel = wavefrontPerPixel(p, f, d);
  const sigmaC = centroidPrecision(lambda, f, d, shape, photons);
  const sigmaW = (sigmaC * d) / f; // wavefront step across a lenslet from centroid noise
  const strehl = marechalStrehl(rmsWavefrontNm * 1e-9, lambda);
  const layout = useMemo(() => {
    const across = Math.ceil(apertureDiameterMm * 1e-3 / (lensletPitchUm * 1e-6) / 2 + 1) * 2;
    return lensletsInPupil(apertureDiameterMm * 1e-3, lensletPitchUm * 1e-6, across * across <= MAX_CELLS_DRAWN);
  }, [apertureDiameterMm, lensletPitchUm]);
  const fits = thetaMax > 0;
  const minFresnel = shape === "square" ? 2 : 2.44;

  const layoutChart = useMemo(() => {
    if (layout.cells.length === 0) return [];
    const mm = (v: number) => v * 1e3;
    const R = apertureDiameterMm / 2;
    const circle = Array.from({ length: 121 }, (_, i) => (2 * Math.PI * i) / 120);
    const full = layout.cells.filter((c) => c.full), part = layout.cells.filter((c) => !c.full);
    return [
      { x: full.map((c) => mm(c.x)), y: full.map((c) => mm(c.y)), type: "scatter", mode: "markers", name: "Fully inside", marker: { color: "#60a5fa", size: 5 } },
      { x: part.map((c) => mm(c.x)), y: part.map((c) => mm(c.y)), type: "scatter", mode: "markers", name: "Partly inside", marker: { color: "#6b7280", size: 5 } },
      { x: circle.map((t) => R * Math.cos(t)), y: circle.map((t) => R * Math.sin(t)), type: "scatter", mode: "lines", name: "Pupil", line: { color: "#fbbf24", width: 1 } },
    ];
  }, [layout, apertureDiameterMm]);

  const spotSizeChart = useMemo(() => {
    const lam = wavelengthNm * 1e-9, fl = lensletFocalMm * 1e-3;
    const pitches = Array.from({ length: 46 }, (_, i) => 50 + i * 20);
    return [
      { x: pitches, y: pitches.map((q) => 2 * spotFirstZeroRadius(lam, fl, q * 1e-6, shape) * 1e6), type: "scatter", mode: "lines", name: "Spot diameter (zeros)", line: { color: "#34d399", width: 2 } },
      { x: pitches, y: pitches.map((q) => spotFwhm(lam, fl, q * 1e-6, shape) * 1e6), type: "scatter", mode: "lines", name: "Spot FWHM", line: { color: "#60a5fa", width: 2 } },
      { x: pitches, y: pitches, type: "scatter", mode: "lines", name: "Lenslet pitch", line: { color: "#9ca3af", dash: "dash" } },
      { x: [lensletPitchUm], y: [spotDiameter * 1e6], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 11 } },
    ];
  }, [wavelengthNm, lensletFocalMm, lensletPitchUm, shape, spotDiameter]);

  const centroidChart = useMemo(() => {
    const lam = wavelengthNm * 1e-9, fl = lensletFocalMm * 1e-3, pitch = lensletPitchUm * 1e-6;
    const counts = Array.from({ length: 41 }, (_, i) => 10 ** (1 + i * 0.1)); // 10 – 10⁵
    return [
      { x: counts, y: counts.map((nPh) => centroidPrecision(lam, fl, pitch, shape, nPh) * 1e6), type: "scatter", mode: "lines", name: "σ_centroid (µm)", line: { color: "#60a5fa", width: 2 } },
      { x: counts, y: counts.map((nPh) => ((centroidPrecision(lam, fl, pitch, shape, nPh) * pitch) / fl) * 1e9), type: "scatter", mode: "lines", name: "Wavefront noise (nm)", line: { color: "#a78bfa", width: 2, dash: "dash" } },
    ];
  }, [wavelengthNm, lensletFocalMm, lensletPitchUm, shape]);

  const tradeoffChart = useMemo(() => {
    const lam = wavelengthNm * 1e-9, pitch = lensletPitchUm * 1e-6, px = detectorPixelUm * 1e-6;
    const focals = Array.from({ length: 50 }, (_, i) => 1 + i * 2); // mm
    const positive = (y: number) => (y > 0 ? y : NaN);
    return [
      { x: focals, y: focals.map((fm) => positive(dynamicRangeAngle(lam, fm * 1e-3, pitch, shape) * 1e3)), type: "scatter", mode: "lines", name: "Dynamic range θ_max (mrad)", line: { color: "#f87171", width: 2 } },
      { x: focals, y: focals.map((fm) => (px / (fm * 1e-3)) * 1e3), type: "scatter", mode: "lines", name: "One-pixel tilt p/f (mrad)", line: { color: "#34d399", width: 2 } },
    ];
  }, [wavelengthNm, lensletPitchUm, detectorPixelUm, shape]);

  const dark = { paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, margin: { t: 20, b: 45, l: 55, r: 20 } };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <ResultCard label="Lenslets in pupil" value={Number.isFinite(layout.full) ? `${layout.full}` : "—"} tone="blue" subtext={`${(D / d).toFixed(1)} across; ${Number.isFinite(layout.partial) ? layout.partial : "—"} more partly lit`} />
        <ResultCard label="Spot diameter (zero to zero)" value={fmt(spotDiameter * 1e6, 1, "µm")} tone="green" subtext={`FWHM ${fmt(fwhm * 1e6, 1, "µm")} = ${(fwhm / p).toFixed(1)} px`} />
        <ResultCard label="Dynamic range θ_max" value={fits ? fmt(thetaMax * 1e3, 2, "mrad") : "spot too large"} tone="red" subtext={fits ? `${(range.tiltPV / lambda).toFixed(1)} waves PV tilt over the pupil` : `Needs N_F = d²/λf > ${minFresnel}`} />
        <ResultCard label="Strehl ratio (Maréchal)" value={Number.isFinite(strehl) ? strehl.toFixed(3) : "—"} tone="purple" subtext={`${(rmsWavefrontNm / wavelengthNm).toFixed(3)} waves RMS`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <ResultCard label="Max defocus" value={fits ? fmt(range.defocusDiopters, 2, "D") : "—"} tone="yellow" subtext={fits ? `${(range.defocusPV / lambda).toFixed(1)} waves PV` : undefined} />
        <ResultCard label="Wavefront per pixel shift" value={fmt(perPixel * 1e9, 1, "nm/px")} tone="cyan" subtext={`Tilt ${fmt((p / f) * 1e6, 0, "µrad/px")}`} />
        <ResultCard label={`Centroid noise (${photons} photons)`} value={fmt(sigmaC * 1e6, 3, "µm")} tone="blue" subtext={`${fmt(sigmaW * 1e9, 2, "nm")} wavefront per lenslet`} />
        <ResultCard label="Fresnel number d²/λf" value={Number.isFinite(nF) ? nF.toFixed(2) : "—"} tone="gray" subtext={`Spot fits a lenslet above ${minFresnel}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={2000} step="10" />
        <ValidatedNumberInput label="Pupil diameter (mm)" value={apertureDiameterMm} onChange={setApertureDiameterMm} min={0.5} max={100} step="0.5" />
        <ValidatedNumberInput label="Lenslet pitch (µm)" value={lensletPitchUm} onChange={setLensletPitchUm} min={50} max={2000} step="10" />
        <ValidatedNumberInput label="Lenslet f (mm)" value={lensletFocalMm} onChange={setLensletFocalMm} min={0.5} max={200} step="0.5" />
        <ValidatedNumberInput label="Detector pixel (µm)" value={detectorPixelUm} onChange={setDetectorPixelUm} min={1} max={30} step="0.5" />
        <ValidatedNumberInput label="RMS wavefront (nm)" value={rmsWavefrontNm} onChange={setRmsWavefrontNm} min={0} max={2000} step="5" />
        <ValidatedNumberInput label="Photons per lenslet" value={photons} onChange={setPhotons} min={1} max={1000000} step="10" />
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="sh-shape">Lenslet aperture</label>
          <select id="sh-shape" value={shape} onChange={(e) => setShape(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="square">Square (sinc² spot)</option>
            <option value="circular">Circular (Airy spot)</option>
          </select>
        </div>
      </div>

      {fits && fwhm < 2 * p && (
        <p className="mb-6 text-sm text-yellow-300" role="status">The spot FWHM is under 2 pixels: centroiding is biased toward pixel centres (pixel locking).</p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas (textbook approximation)</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-mono">Δx = f·∂W/∂x — local wavefront tilt moves the spot</p>
          <p className="font-mono">Spot: first zero ρ₀ = λf/d (square) or 1.22λf/d (circular); FWHM 0.886 or 1.029 λf/d</p>
          <p className="font-mono">θ_max = (d − 2ρ₀)/(2f); PV tilt θ_max·D, PV defocus θ_max·D/4, defocus 2θ_max/D dioptres</p>
          <p className="font-mono">σ_centroid = σ_spot/√N, σ_spot = FWHM/2.355; wavefront noise σ_centroid·d/f</p>
          <p className="font-mono">Sensitivity p·d/f per pixel; Strehl ≈ exp(−(2πσ/λ)²)</p>
          <p>Dynamic range: the spot must stay inside its own sub-aperture (Akondi &amp; Dubra, Opt. Express 29(6), 2021). Centroid noise is the photon-noise limit for a Gaussian of the spot&apos;s FWHM; read noise, background and pixelation add to it. Strehl by the extended Maréchal approximation (Mahajan, JOSA 73, 860, 1983).</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Lenslets over the pupil (mm)</h3>
          {layoutChart.length > 0 ? (
            <ChartPanel data={layoutChart} layout={{ ...dark, xaxis: { title: "x (mm)", scaleanchor: "y" }, yaxis: { title: "y (mm)" } }} />
          ) : (
            <p className="text-sm text-gray-400">Too many lenslets to draw ({(D / d).toFixed(0)} across).</p>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Spot size vs lenslet pitch</h3>
          <ChartPanel data={spotSizeChart} layout={{ ...dark, xaxis: { title: "Lenslet pitch (µm)" }, yaxis: { title: "µm", type: "log" } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Centroid noise vs photons</h3>
          <ChartPanel data={centroidChart} layout={{ ...dark, xaxis: { title: "Photons per lenslet", type: "log" }, yaxis: { title: "µm / nm", type: "log" } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Dynamic range vs sensitivity</h3>
          <ChartPanel data={tradeoffChart} layout={{ ...dark, xaxis: { title: "Lenslet focal length (mm)" }, yaxis: { title: "mrad", type: "log" } }} />
        </div>
      </div>
    </>
  );
}
