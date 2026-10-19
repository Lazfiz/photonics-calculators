"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { createRng, gaussian } from "../../../physics/random";
import {
  czernyTurner, evalPolynomial, fitPolynomial, maxCalibrationError, pixelToWavelength, polynomialSlope, wavelengthToPixel,
} from "../../../physics/spectroscopy/spectral-calibration";
import { gratingReciprocalLinearDispersion } from "../../../physics/spectroscopy/spectral-resolution";

const DEG = Math.PI / 180;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");

// Hg I air wavelengths, NIST Atomic Spectra Database.
const HG_LINES = "404.6565, 407.7837, 435.8335, 546.0750, 576.9610, 579.0670";
const DEGREES = [1, 2, 3] as const;
const COLORS = ["#f87171", "#fbbf24", "#34d399"];

export default function SpectralCalibrationPage() {
  const [densityRaw, setGrooveDensity] = useURLState("grooveDensity", 1200); // lines/mm
  const [orderRaw, setOrder] = useURLState("order", 1);
  const [centreRaw, setCentre] = useURLState("centerWl", 500); // nm on the detector centre
  const [deviationRaw, setDeviation] = useURLState("deviation", 30); // α − β₀, degrees
  const [focalRaw, setFocalLength] = useURLState("focalLength", 100); // mm, collimator = camera
  const [pitchRaw, setPixelPitch] = useURLState("pixelPitch", 12.5); // µm
  const [pixelsRaw, setPixelCount] = useURLState("pixelCount", 2048);
  const [noiseRaw, setCentroidNoise] = useURLState("centroidNoise", 0.05); // px, 1σ
  const [seedRaw, setSeed] = useURLState("seed", 1);
  const [lineText, setLineText] = useURLState("lines", HG_LINES);

  const grooveDensity = clamp(densityRaw, 10, 6000, 1200);
  const order = Math.round(clamp(orderRaw, 1, 10, 1));
  const centre = clamp(centreRaw, 100, 20000, 500);
  const deviation = clamp(deviationRaw, 0, 120, 30);
  const focalLength = clamp(focalRaw, 10, 5000, 100);
  const pitch = clamp(pitchRaw, 1, 100, 12.5);
  const pixels = Math.round(clamp(pixelsRaw, 64, 16384, 2048));
  const noise = clamp(noiseRaw, 0, 5, 0.05);
  const seed = Math.round(clamp(seedRaw, 1, 1e6, 1));

  const d = 1e-3 / grooveDensity;
  const sp = czernyTurner(centre * 1e-9, d, order, deviation * DEG, focalLength * 1e-3, pitch * 1e-6, pixels);
  const reachable = Number.isFinite(sp.incidence);
  const c = (pixels - 1) / 2;

  const entered = lineText.split(/[\s,;]+/).filter((t) => t !== "").map(Number);
  const valid = entered.filter((x) => Number.isFinite(x) && x > 0);
  const ignored = entered.length - valid.length;
  const rng = createRng(seed); // fixed seed: same noise on server and client
  const onDetector = valid
    .map((nm) => ({ nm, truePx: reachable ? wavelengthToPixel(nm * 1e-9, sp) : NaN }))
    .filter((l) => Number.isFinite(l.truePx))
    .map((l) => ({ ...l, px: l.truePx + noise * gaussian(rng) }));
  const missed = valid.length - onDetector.length;

  const fits = DEGREES.map((k) => fitPolynomial(onDetector.map((l) => l.px), onDetector.map((l) => l.nm * 1e-9), k, c, c));
  const lambdaLow = reachable ? pixelToWavelength(0, sp) : NaN;
  const lambdaHigh = reachable ? pixelToWavelength(pixels - 1, sp) : NaN;
  const theorySlope = reachable ? gratingReciprocalLinearDispersion(d, order, sp.beta0, focalLength * 1e-3) * pitch * 1e-6 : NaN;
  const linear = fits[0];
  const linSlope = linear ? polynomialSlope(linear, 0) : NaN;
  const linIntercept = linear ? evalPolynomial(linear, 0) : NaN;

  const chart = (() => {
    if (!reachable) return [];
    const xs = Array.from({ length: 257 }, (_, i) => ((pixels - 1) * i) / 256);
    const truth = xs.map((x) => pixelToWavelength(x, sp));
    const traces: Record<string, unknown>[] = DEGREES.flatMap((k, j) => {
      const fit = fits[j];
      if (!fit) return [];
      return [{
        x: xs, y: xs.map((x, i) => r6((evalPolynomial(fit, x) - truth[i]) * 1e9)), type: "scatter", mode: "lines",
        name: `Degree ${k}`, line: { color: COLORS[j], width: 2 },
      }];
    });
    traces.push({
      x: onDetector.map((l) => r6(l.px)), y: onDetector.map(() => 0), type: "scatter", mode: "markers",
      name: "Calibration lines", line: { color: "#60a5fa" }, marker: { color: "#60a5fa", size: 8 },
    });
    return traces;
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Groove Density (lines/mm)" value={densityRaw} onChange={setGrooveDensity} min={10} max={6000} />
        <ValidatedNumberInput label="Diffraction Order m" value={orderRaw} onChange={setOrder} min={1} max={10} step="1" />
        <ValidatedNumberInput label="Centre Wavelength (nm)" value={centreRaw} onChange={setCentre} min={100} max={20000} />
        <ValidatedNumberInput label="Deviation Angle α − β₀ (°)" value={deviationRaw} onChange={setDeviation} min={0} max={120} />
        <ValidatedNumberInput label="Focal Length (mm)" value={focalRaw} onChange={setFocalLength} min={10} max={5000} />
        <ValidatedNumberInput label="Pixel Pitch (µm)" value={pitchRaw} onChange={setPixelPitch} min={1} max={100} />
        <ValidatedNumberInput label="Pixel Count" value={pixelsRaw} onChange={setPixelCount} min={64} max={16384} step="1" />
        <ValidatedNumberInput label="Line Centroid Noise, 1σ (px)" value={noiseRaw} onChange={setCentroidNoise} min={0} max={5} />
        <ValidatedNumberInput label="Noise Seed" value={seedRaw} onChange={setSeed} min={1} max={1000000} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4 sm:col-span-2 lg:col-span-3">
          <span className="text-sm text-gray-300">Calibration Line Wavelengths (nm, air; comma or space separated)</span>
          <input type="text" value={lineText} onChange={(e) => setLineText(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          <button type="button" onClick={() => setLineText(HG_LINES)} className="mt-2 text-sm text-blue-400 underline">
            Mercury lines (NIST)
          </button>
        </label>
      </div>

      {(!reachable || ignored > 0 || missed > 0) && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100 space-y-1">
          {!reachable && (
            <p>Order {order} cannot reach {centre} nm at this deviation (needs mλ &lt; d(1 + cos D_v) = {fmt(d * (1 + Math.cos(deviation * DEG)) * 1e9)} nm).</p>
          )}
          {ignored > 0 && <p>{ignored} entr{ignored === 1 ? "y is" : "ies are"} not a positive number and {ignored === 1 ? "is" : "are"} ignored.</p>}
          {reachable && missed > 0 && <p>{missed} line{missed === 1 ? " falls" : "s fall"} outside {fmt(lambdaLow * 1e9)}–{fmt(lambdaHigh * 1e9)} nm and {missed === 1 ? "is" : "are"} not used.</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Detector Range (grating equation)" value={reachable ? `${fmt(lambdaLow * 1e9)} – ${fmt(lambdaHigh * 1e9)} nm` : "—"} tone="blue"
          subtext={reachable ? `α = ${(sp.incidence / DEG).toFixed(2)}°, β₀ = ${(sp.beta0 / DEG).toFixed(2)}°` : undefined} />
        <ResultCard label="Dispersion at Centre (theory)" value={`${fmt(theorySlope * 1e9)} nm/px`} tone="cyan" subtext="d·cos β₀/(m·f) × pixel pitch" />
        <ResultCard label="Linear Fit λ = a·i + b" value={linear ? `a = ${fmt(linSlope * 1e9, 6)} nm/px` : "—"} tone="green"
          subtext={linear ? `b = ${fmt(linIntercept * 1e9, 7)} nm at pixel 0` : "needs 2 lines on the detector"} />
        <ResultCard label="Lines on Detector" value={`${onDetector.length}`} tone="purple" subtext="degree k needs k + 1 lines" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Fit Quality</h3>
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-4">Degree</th><th className="py-1 pr-4">RMS residual at lines (nm)</th>
              <th className="py-1 pr-4">Max |fit − true| over detector (nm)</th><th className="py-1">Dispersion at centre (nm/px)</th>
            </tr>
          </thead>
          <tbody>
            {DEGREES.map((k, j) => {
              const fit = fits[j];
              return (
                <tr key={k} className="border-t border-gray-800">
                  <td className="py-1 pr-4">{k}</td>
                  <td className="py-1 pr-4">{fit ? fmt(fit.rms * 1e9, 3) : "—"}</td>
                  <td className="py-1 pr-4">{fit ? fmt(maxCalibrationError(fit, sp) * 1e9, 3) : `— (needs ${k + 1} lines)`}</td>
                  <td className="py-1">{fit ? fmt(polynomialSlope(fit, c) * 1e9, 6) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Calibration Error λ_fit − λ_true</h3>
          <ChartPanel data={chart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Pixel", gridcolor: "#374151" }, yaxis: { title: "Error (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
          }} />
          <p className="mt-2 text-sm text-gray-400">
            Error of each fitted polynomial against the grating-equation truth at every pixel; dots mark the calibration lines.
            Outside the outermost lines the fit extrapolates.
          </p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">x = (i − (N − 1)/2)·p,   β = β₀ + atan(x/f),   λ = d(sin α + sin β)/m</p>
        <p className="font-mono">λ_fit(i) = Σ c_k·u^k,   u = (i − (N − 1)/2)/((N − 1)/2),   least squares over the lines</p>
        <p>
          The true pixel-to-wavelength map is the grating equation for a Czerny–Turner spectrograph with equal focal
          lengths and a flat detector normal to the central ray, set by the centre wavelength and the fixed deviation
          α − β₀ (as on the spectral range page). Both sin β and the atan of the flat detector make it non-linear. When
          β₀ is small the distortion is nearly odd about the centre, so a quadratic barely improves on a line and a
          cubic is needed. Each line centroid is offset by Gaussian noise of the given σ (seeded, so the page is
          reproducible). Aberrations, detector tilt and focal-plane curvature are not modelled. Enter air wavelengths:
          the grating equation holds for the wavelength in the air around the grating.
        </p>
        <p className="text-gray-500">
          References: C. Palmer, E. Loewen, <em>Diffraction Grating Handbook</em>, 6th ed. (Newport, 2005), ch. 2;
          A. Kramida, Yu. Ralchenko, J. Reader and NIST ASD Team, NIST Atomic Spectra Database (Hg I lines).
        </p>
      </div>
    </>
  );
}
