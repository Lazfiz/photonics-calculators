"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  GAUSSIAN_FWHM_PER_SIGMA, PSF_SIGMA_COEFFICIENT, abbeLateralFwhm, localizationPrecision, mortensenPrecision,
  nyquistResolution, smlmEffectiveResolution,
} from "../../../physics/imaging/super-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const selectClass = "w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white";

export default function PALMSTORMPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 647); // emission, nm
  const [naRaw, setNa] = useURLState("na", 1.49);
  const [photonsRaw, setPhotons] = useURLState("photons", 1000); // detected photons per localization
  const [backgroundRaw, setBackground] = useURLState("background", 10); // b², photons per pixel
  const [pixelRaw, setPixel] = useURLState("pixelSize", 100); // nm in the sample plane
  const [estimator, setEstimator] = useURLState("estimator", "ls");
  const [camera, setCamera] = useURLState("camera", "scmos");
  const [densityRaw, setDensity] = useURLState("density", 2500); // labels per µm^D
  const [dimRaw, setDim] = useURLState("dim", 2);
  const [framesRaw, setFrames] = useURLState("numFrames", 20000);
  const [fpsRaw, setFps] = useURLState("fps", 100);

  const wavelength = clamp(wavelengthRaw, 400, 900, 647);
  const na = clamp(naRaw, 0.5, 1.7, 1.49);
  const photons = clamp(photonsRaw, 10, 1e6, 1000);
  const background = clamp(backgroundRaw, 0, 1e4, 10);
  const pixel = clamp(pixelRaw, 10, 300, 100);
  const dim = dimRaw === 1 || dimRaw === 3 ? dimRaw : 2;
  const density = clamp(densityRaw, 1e-3, 1e7, 2500);
  const frames = clamp(framesRaw, 100, 1e6, 20000);
  const fps = clamp(fpsRaw, 1, 10000, 100);
  const est = estimator === "mle" ? "mle" : "ls";
  const emccd = camera === "emccd";
  const lambda = wavelength * nm;
  const densityUnit = dim === 1 ? "µm⁻¹" : dim === 2 ? "µm⁻²" : "µm⁻³";

  const precisionAt = (N: number, e: "ls" | "mle") => mortensenPrecision(lambda, na, N, pixel * nm, background, { estimator: e, emccd });
  const psfSigma = (PSF_SIGMA_COEFFICIENT * lambda) / na;
  const sigmaLoc = precisionAt(photons, est);
  const shotLimit = localizationPrecision(lambda, na, photons);
  const nyquistAt = (rho: number) => nyquistResolution(rho * 1e6 ** dim, dim);
  const nyquist = nyquistAt(density);
  const effective = smlmEffectiveResolution(sigmaLoc, nyquist);
  const diffraction = abbeLateralFwhm(lambda, na);
  const acqTime = frames / fps;

  // Mortensen's formulas are correct to order a²/(12σ²); past a = 2σ that term exceeds 1/3.
  const note = pixel * nm > 2 * psfSigma
    ? `A ${pixel} nm pixel is more than twice the PSF σ (${(psfSigma / nm).toFixed(0)} nm): the spot is undersampled and the a²/12 pixel correction is no longer small.`
    : "";

  // σ_loc against photon count, 10 … 10⁵ (log), for both estimators and the shot-noise limit.
  const Ns = Array.from({ length: 81 }, (_, i) => 10 ** (1 + i / 20));
  const precisionChart = [
    { x: Ns, y: Ns.map((N) => precisionAt(N, "ls") / nm), type: "scatter" as const, mode: "lines" as const, name: "Least-squares fit (eq. 6)", line: { color: "#60a5fa" } },
    { x: Ns, y: Ns.map((N) => precisionAt(N, "mle") / nm), type: "scatter" as const, mode: "lines" as const, name: "Maximum likelihood (eq. 5)", line: { color: "#4ade80" } },
    { x: Ns, y: Ns.map((N) => localizationPrecision(lambda, na, N) / nm), type: "scatter" as const, mode: "lines" as const, name: "Shot noise σ/√N", line: { color: "#9ca3af", dash: "dash" } },
    { x: [photons], y: [sigmaLoc / nm], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 8 } },
  ];

  // Effective resolution against label density, two decades either side of the input (log).
  const rhos = Array.from({ length: 81 }, (_, i) => density * 10 ** (-2 + i / 20));
  const densityChart = [
    { x: rhos, y: rhos.map((r) => smlmEffectiveResolution(sigmaLoc, nyquistAt(r)) / nm), type: "scatter" as const, mode: "lines" as const, name: "Effective resolution", line: { color: "#4ade80" } },
    { x: [rhos[0], rhos[rhos.length - 1]], y: [(GAUSSIAN_FWHM_PER_SIGMA * sigmaLoc) / nm, (GAUSSIAN_FWHM_PER_SIGMA * sigmaLoc) / nm], type: "scatter" as const, mode: "lines" as const, name: "Localization FWHM 2.355σ", line: { color: "#facc15", dash: "dash" } },
    { x: [density], y: [effective / nm], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 8 } },
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Emission wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={400} max={900} />
          <ValidatedNumberInput label="Numerical aperture" value={naRaw} onChange={setNa} min={0.5} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Detected photons per localization N" value={photonsRaw} onChange={setPhotons} min={10} max={1e6} />
          <ValidatedNumberInput label="Background b² (photons per pixel)" value={backgroundRaw} onChange={setBackground} min={0} max={1e4} />
          <ValidatedNumberInput label="Pixel size in the sample (nm)" value={pixelRaw} onChange={setPixel} min={10} max={300} />
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="palm-estimator">Fit</label>
            <select id="palm-estimator" value={est} onChange={(e) => setEstimator(e.target.value)} className={selectClass}>
              <option value="ls">Least-squares Gaussian fit</option>
              <option value="mle">Maximum-likelihood Gaussian fit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="palm-camera">Camera</label>
            <select id="palm-camera" value={emccd ? "emccd" : "scmos"} onChange={(e) => setCamera(e.target.value)} className={selectClass}>
              <option value="scmos">sCMOS or CCD (no excess noise)</option>
              <option value="emccd">EMCCD (excess noise doubles the variance)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="palm-dim">Label density counted in</label>
            <select id="palm-dim" value={dim} onChange={(e) => setDim(Number(e.target.value))} className={selectClass}>
              <option value={1}>1D (labels per µm along a filament)</option>
              <option value={2}>2D (labels per µm²)</option>
              <option value={3}>3D (labels per µm³)</option>
            </select>
          </div>
          <ValidatedNumberInput label={`Label density (${densityUnit})`} value={densityRaw} onChange={setDensity} min={1e-3} max={1e7} />
          <ValidatedNumberInput label="Number of frames" value={framesRaw} onChange={setFrames} min={100} max={1e6} />
          <ValidatedNumberInput label="Frame rate (frames/s)" value={fpsRaw} onChange={setFps} min={1} max={10000} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("PSF σ = 0.21 λ/NA", fmt(psfSigma / nm, 1, " nm"))}
          {row("Localization precision σ_loc", fmt(sigmaLoc / nm, 2, " nm"), "text-blue-400")}
          {row("Shot-noise limit σ/√N", fmt(shotLimit / nm, 2, " nm"))}
          {row("Localization FWHM 2.355 σ_loc", fmt((GAUSSIAN_FWHM_PER_SIGMA * sigmaLoc) / nm, 1, " nm"))}
          {row("Mean label spacing", fmt(nyquist / 2 / nm, 1, " nm"))}
          {row("Nyquist resolution 2/ρ^(1/D)", fmt(nyquist / nm, 1, " nm"), "text-yellow-400")}
          {row("Effective resolution", fmt(effective / nm, 1, " nm"), "text-green-400")}
          {row("Diffraction limit λ/(2NA)", fmt(diffraction / nm, 0, " nm"))}
          {row("Acquisition time", fmt(acqTime, 0, " s"), "text-purple-400")}
          {note && <p className="text-sm text-yellow-300">{note}</p>}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>σ_a² = σ² + a²/12. Least squares: σ_loc² = σ_a²/N · (16/9 + 8π σ_a² b²/(N a²)) (Mortensen 2010, eq. 6).</p>
            <p>Maximum likelihood: σ_loc² = σ_a²/N · [1 + ∫₀¹ ln t / (1 + N a² t/(2π σ_a² b²)) dt]⁻¹ (eq. 5). EMCCD: × 2.</p>
            <p>Effective resolution = √((2.355 σ_loc)² + (2/ρ^(1/D))²) (Legant 2016). It assumes every label is localized once.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Localization precision vs photon count</h2>
          <ChartPanel data={precisionChart} layout={{ ...layout, xaxis: { title: "Detected photons N", type: "log", gridcolor: "#333" }, yaxis: { title: "σ_loc (nm)", type: "log", gridcolor: "#333" } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Effective resolution vs label density</h2>
          <ChartPanel data={densityChart} layout={{ ...layout, xaxis: { title: `Label density (${densityUnit})`, type: "log", gridcolor: "#333" }, yaxis: { title: "Resolution (nm)", type: "log", gridcolor: "#333" } }} />
        </div>
      </div>
    </>
  );
}
