"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  anamorphicMagnification, detectorCoverage, detectorWavelength, flatDetectorReciprocalDispersion,
  gratingDiffractionLimit, gratingSlitBandpass, overlapFreeLimit,
} from "../../../physics/spectroscopy/spectral-resolution";

const DEG = Math.PI / 180;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");

const chartLayout = (xTitle: string, yTitle: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: xTitle, gridcolor: "#374151" },
  yaxis: { title: yTitle, gridcolor: "#374151" },
  margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
});

export default function SpectralRangePage() {
  const [densityRaw, setGrooveDensity] = useURLState("grooveDensity", 1200); // lines/mm
  const [orderRaw, setOrder] = useURLState("order", 1);
  const [centreRaw, setCentre] = useURLState("centreWL", 500); // nm on the detector centre
  const [deviationRaw, setDeviation] = useURLState("deviation", 30); // α − β, degrees; 0 = Littrow
  const [focalRaw, setFocalLength] = useURLState("focalLength", 100); // mm, collimator = camera
  const [widthRaw, setDetectorWidth] = useURLState("detectorWidth", 25.6); // mm
  const [pixelsRaw, setDetectorPixels] = useURLState("detectorPixels", 2048);
  const [slitRaw, setSlitWidth] = useURLState("slitWidth", 25); // µm
  const [gratingRaw, setGratingWidth] = useURLState("gratingWidth", 25); // illuminated width, mm

  const grooveDensity = clamp(densityRaw, 10, 6000, 1200);
  const order = Math.round(clamp(orderRaw, 1, 10, 1));
  const centreNm = clamp(centreRaw, 100, 20000, 500);
  const deviation = clamp(deviationRaw, 0, 90, 30);
  const focalLength = clamp(focalRaw, 10, 5000, 100);
  const detectorWidth = clamp(widthRaw, 0.1, 200, 25.6);
  const pixels = Math.round(clamp(pixelsRaw, 16, 20000, 2048));
  const slitWidth = clamp(slitRaw, 1, 5000, 25);
  const gratingWidth = clamp(gratingRaw, 1, 1000, 25);

  const d = 1e-3 / grooveDensity; // m
  const f = focalLength * 1e-3;
  const W = detectorWidth * 1e-3;
  const lc = centreNm * 1e-9;
  const cov = detectorCoverage(lc, d, order, deviation * DEG, W, f);
  const reachable = Number.isFinite(cov.incidence);
  const range = cov.lambdaHigh - cov.lambdaLow;
  const recip = flatDetectorReciprocalDispersion(d, order, cov.beta0, cov.beta0, f); // m per m at the centre
  const pixelPitch = W / pixels;
  const slitLimit = gratingSlitBandpass(slitWidth * 1e-6, d, order, cov.incidence, f);
  const pixelLimit = 2 * pixelPitch * recip; // two pixels per resolution element (Nyquist)
  const diffLimit = gratingDiffractionLimit(lc, order, gratingWidth * 1e-3, d);
  const resolution = Math.max(slitLimit, pixelLimit, diffLimit);
  const limitedBy = resolution === slitLimit ? "slit-limited" : resolution === pixelLimit ? "pixel-limited (2 px)" : "diffraction-limited";
  const overlapFree = overlapFreeLimit(cov.lambdaLow, order);
  const overlaps = Number.isFinite(cov.lambdaHigh) && cov.lambdaHigh > overlapFree;

  const charts = useMemo(() => {
    if (!reachable) return null;
    const xs = Array.from({ length: 201 }, (_, i) => -W / 2 + (W * i) / 200);
    const across = [
      { x: xs.map((x) => r6(x * 1e3)), y: xs.map((x) => r6(detectorWavelength(x, d, order, cov.incidence, cov.beta0, f) * 1e9)),
        type: "scatter", mode: "lines", name: "λ (nm)", line: { color: "#60a5fa", width: 2 } },
    ];
    // Grid spans the current density (g/5 … gMax/5 lower bound) up to the largest density that can still reach λ_c,
    // so the "Current" marker always lies on the curve.
    const gMax = Math.min(6000, (0.999e-3 * (1 + Math.cos(deviation * DEG))) / (order * lc));
    const gMin = Math.max(10, Math.min(grooveDensity / 5, gMax / 5));
    const gHi = Math.max(gMax, grooveDensity);
    const densities = Array.from({ length: 200 }, (_, i) => r6(gMin + ((gHi - gMin) * i) / 199));
    const ranges = densities.map((g) => {
      const c = detectorCoverage(lc, 1e-3 / g, order, deviation * DEG, W, f);
      return r6((c.lambdaHigh - c.lambdaLow) * 1e9);
    });
    const vsDensity = [
      { x: densities, y: ranges, type: "scatter", mode: "lines", name: "Spectral range", line: { color: "#34d399", width: 2 } },
      { x: [grooveDensity], y: [r6(range * 1e9)], type: "scatter", mode: "markers", name: "Current",
        line: { color: "#f87171" }, marker: { color: "#f87171", size: 10 } },
    ];
    return { across, vsDensity };
  }, [reachable, W, d, order, cov.incidence, cov.beta0, f, lc, deviation, grooveDensity, range]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Groove Density (lines/mm)" value={densityRaw} onChange={setGrooveDensity} min={10} max={6000} />
        <ValidatedNumberInput label="Diffraction Order m" value={orderRaw} onChange={setOrder} min={1} max={10} step="1" />
        <ValidatedNumberInput label="Centre Wavelength (nm)" value={centreRaw} onChange={setCentre} min={100} max={20000} />
        <ValidatedNumberInput label="Deviation Angle α − β (°, 0 = Littrow)" value={deviationRaw} onChange={setDeviation} min={0} max={90} />
        <ValidatedNumberInput label="Focal Length (mm)" value={focalRaw} onChange={setFocalLength} min={10} max={5000} />
        <ValidatedNumberInput label="Detector Width (mm)" value={widthRaw} onChange={setDetectorWidth} min={0.1} max={200} />
        <ValidatedNumberInput label="Detector Pixels" value={pixelsRaw} onChange={setDetectorPixels} min={16} max={20000} step="1" />
        <ValidatedNumberInput label="Slit Width (µm)" value={slitRaw} onChange={setSlitWidth} min={1} max={5000} />
        <ValidatedNumberInput label="Illuminated Grating Width (mm)" value={gratingRaw} onChange={setGratingWidth} min={1} max={1000} />
      </div>

      {!reachable ? (
        <div className="mb-8 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          The grating cannot send {centreNm} nm to the detector centre in order {order}: mλ must stay below
          d·(1 + cos D_v) = {fmt(d * (1 + Math.cos(deviation * DEG)) * 1e9)} nm, or the incidence angle passes 90°. Use fewer lines/mm, a lower order or a
          smaller deviation angle.
        </div>
      ) : (
        <>
          {(overlaps || order >= 2 || !Number.isFinite(cov.lambdaLow) || !Number.isFinite(cov.lambdaHigh)) && (
            <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100 space-y-1">
              {!Number.isFinite(cov.lambdaLow) && <p>The short-wavelength edge of the detector lies beyond the zero order: it gets no order-{order} light, and the zero order and order {order + 1} fall on the detector.</p>}
              {!Number.isFinite(cov.lambdaHigh) && <p>The long-wavelength edge lies past grazing diffraction (β ≥ 90°).</p>}
              {order >= 2 && Number.isFinite(cov.lambdaLow) && Number.isFinite(cov.lambdaHigh) && (
                <p>
                  Order {order - 1} also lands here: the detector sees {fmt((cov.lambdaLow * order) / (order - 1) * 1e9)}–{fmt((cov.lambdaHigh * order) / (order - 1) * 1e9)} nm
                  {" "}from it; block it with a short-pass filter if the source and detector respond there.
                </p>
              )}
              {overlaps && (
                <p>
                  Order overlap: order {order + 1} puts λ where order {order} has {order + 1}λ/{order}, so above
                  {" "}{fmt(overlapFree * 1e9)} nm the detector also sees {fmt(cov.lambdaLow * 1e9)}–{fmt((cov.lambdaHigh * order) / (order + 1) * 1e9)} nm
                  {" "}from order {order + 1}. Use an order-sorting filter if the source emits there.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <ResultCard label="λ at Short Edge" value={`${fmt(cov.lambdaLow * 1e9)} nm`} tone="blue" />
            <ResultCard label="λ at Long Edge" value={`${fmt(cov.lambdaHigh * 1e9)} nm`} tone="green" />
            <ResultCard label="Spectral Range" value={`${fmt(range * 1e9)} nm`} tone="yellow" subtext={`${fmt((range * 1e9) / pixels)} nm/pixel on average`} />
            <ResultCard label="Reciprocal Dispersion (centre)" value={`${fmt(recip * 1e6)} nm/mm`} tone="purple" subtext="d·cos β₀ / (m·f)" />
            <ResultCard label="Grating Angles" value={`α ${(cov.incidence / DEG).toFixed(2)}°, β₀ ${(cov.beta0 / DEG).toFixed(2)}°`} tone="cyan"
              subtext={`anamorphic r = ${anamorphicMagnification(cov.incidence, cov.beta0).toFixed(3)}`} />
            <ResultCard label="Resolution δλ (centre)" value={`${fmt(resolution * 1e9, 3)} nm`} tone="red" subtext={limitedBy} />
            <ResultCard label="Resolving Power λ/δλ" value={fmt(lc / resolution, 3)} tone="orange" />
            <ResultCard label="Limits: slit / 2 px / diffraction" value={`${fmt(slitLimit * 1e9, 3)} / ${fmt(pixelLimit * 1e9, 3)} / ${fmt(diffLimit * 1e9, 3)} nm`}
              tone="gray" subtext={`R = mN = ${fmt(order * grooveDensity * gratingWidth, 3)}`} />
          </div>

          {charts && (
            <>
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">Wavelength Across the Detector</h3>
                <ChartPanel data={charts.across} layout={chartLayout("Position on detector (mm)", "Wavelength (nm)")} />
              </div>
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">Spectral Range vs Groove Density</h3>
                <ChartPanel data={charts.vsDensity} layout={chartLayout("Groove density (lines/mm)", "Spectral range (nm)")} />
              </div>
            </>
          )}
        </>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">mλ_c = 2d·cos(D_v/2)·sin ψ,   α = ψ + D_v/2,   β₀ = ψ − D_v/2,   β(x) = β₀ + atan(x/f)</p>
        <p className="font-mono">δλ_slit = w·d·cos α/(m·f),   δλ_pixel = 2p·d·cos β₀/(m·f),   δλ_diff = λ/(mN)</p>
        <p>
          A spectrograph with a fixed angle D_v = α − β between the collimator and camera arms (Czerny–Turner; D_v = 0
          is Littrow) turns its grating to put λ_c on the centre of a flat detector normal to the central ray. Each
          detector edge sees the wavelength the grating equation gives for β₀ ± atan(W/2f). Collimator and camera have
          the same focal length, so the slit image is r = cos α/cos β₀ times the slit width. The resolution is the
          largest of the slit, two-pixel and diffraction limits; aberrations, the focal-plane tilt and the real line
          shape (their convolution) are not modelled. Order m + 1 overlaps order m above λ_min(m + 1)/m.
        </p>
        <p className="text-gray-500">
          Reference: C. Palmer, E. Loewen, <em>Diffraction Grating Handbook</em>, 6th ed. (Newport, 2005), ch. 2.
        </p>
      </div>
    </>
  );
}
