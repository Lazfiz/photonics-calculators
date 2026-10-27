"use client";

import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  SINC2_HALF_MAX_X, airyFirstZeroRadius, airyFwhm, airyIntensity, axialFirstZero, axialIntensity, lateralOpticalCoordinate,
} from "../../../physics/imaging/diffraction-psf";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function PSFCalculatorPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [refractiveIndexRaw, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [extentRaw, setExtent] = useURLState("oversampling", 4); // plot half-width in Airy radii
  const wavelength = clamp(wavelengthRaw, 300, 2000, 550);
  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const n = clamp(refractiveIndexRaw, 1, 1.8, 1.518);
  const extentAU = clamp(extentRaw, 1, 10, 4);
  const lambda = wavelength * 1e-9;
  const valid = na < n;

  // Lengths in nm for display and plots.
  const airyRadiusNm = airyFirstZeroRadius(lambda, na) * 1e9;
  const fwhm = airyFwhm(lambda, na) * 1e9;
  // Half maximum of the plotted sinc² curve: 2·x½/π = 0.886 (x½ = 1.3916), times λ/(n − √(n² − NA²)).
  const axialFWHM = ((2 * SINC2_HALF_MAX_X) / Math.PI) * (lambda / (n - Math.sqrt(n * n - na * na))) * 1e9;
  const axialZeroNm = axialFirstZero(lambda, n, na) * 1e9;
  const vOf = (rNm: number) => lateralOpticalCoordinate(rNm * 1e-9, lambda, na);

  // 2D Airy PSF, 101 × 101 grid (the React Compiler memoizes it).
  const psfData = (() => {
    const size = 101;
    const extent = airyRadiusNm * extentAU;
    const step = (2 * extent) / (size - 1);
    const x = Array.from({ length: size }, (_, i) => -extent + i * step);
    const vScale = lateralOpticalCoordinate(1e-9, wavelength * 1e-9, na);
    const z = x.map((yy) => x.map((xx) => airyIntensity(Math.hypot(xx, yy) * vScale)));
    return [{ z, x, y: x, type: "heatmap" as const, colorscale: "Viridis", showscale: false }];
  })();

  const xs = Array.from({ length: 201 }, (_, i) => airyRadiusNm * (-2.5 + i * 0.025));
  const lateralProfile = [
    { x: xs, y: xs.map((r) => airyIntensity(vOf(r))), type: "scatter", mode: "lines", name: "Lateral PSF", line: { color: "#60a5fa" } },
    { x: [-fwhm / 2, fwhm / 2], y: [0.5, 0.5], type: "scatter", mode: "lines", name: "FWHM", line: { color: "#f87171", dash: "dash" } },
  ];

  const zs = Array.from({ length: 201 }, (_, i) => axialZeroNm * (-2.5 + i * 0.025));
  const axialProfile = [
    { x: zs, y: zs.map((z) => axialIntensity(z * 1e-9, lambda, n, na)), type: "scatter", mode: "lines", name: "Axial PSF", line: { color: "#34d399" } },
    { x: [-axialFWHM / 2, axialFWHM / 2], y: [0.5, 0.5], type: "scatter", mode: "lines", name: "FWHM", line: { color: "#fbbf24", dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndexRaw} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="2D plot half-width (Airy radii)" value={extentRaw} onChange={setExtent} min={1} max={10} />
      </div>

      {!valid && (
        <p className="text-red-400 mb-6">NA {na} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
      )}

      {valid && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Airy radius (first zero)</p>
              <p className="text-2xl font-bold text-blue-400">{airyRadiusNm.toFixed(1)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Lateral FWHM</p>
              <p className="text-2xl font-bold text-green-400">{fwhm.toFixed(1)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Axial FWHM</p>
              <p className="text-2xl font-bold text-yellow-400">{axialFWHM.toFixed(0)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">First axial zero</p>
              <p className="text-2xl font-bold text-purple-400">±{axialZeroNm.toFixed(0)} nm</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Formulas</h3>
            <div className="text-sm text-gray-300 space-y-1 font-mono">
              <p>I(r) = [2J₁(v)/v]², v = 2π NA r/λ</p>
              <p>Airy radius r = 0.610 λ/NA; lateral FWHM = 0.514 λ/NA</p>
              <p>I(z) = sinc²(π z (n − √(n² − NA²))/λ)</p>
              <p>Axial FWHM = 0.886 λ/(n − √(n² − NA²)) → 1.77 nλ/NA² at low NA</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scalar theory, uniformly filled pupil, no aberrations, λ in vacuum. Above NA ≈ 0.9 the vector focus differs: with linear polarization it is ≈ 30 % wider along the polarization and slightly narrower across it at NA 1.4 (Richards &amp; Wolf 1959); the 10–20 % average widening holds for unpolarized or circular light. A coverslip or index mismatch stretches the axial PSF further.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">2D PSF (Lateral)</h3>
              <ChartPanel data={psfData} layout={{
                paper_bgcolor: "transparent", plot_bgcolor: "transparent",
                font: { color: "#9ca3af" },
                xaxis: { title: "x (nm)", gridcolor: "#374151" },
                yaxis: { title: "y (nm)", gridcolor: "#374151" },
                margin: { t: 10, r: 10, b: 50, l: 60 },
              }} />
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Lateral PSF Profile</h3>
              <ChartPanel data={lateralProfile} layout={{
                paper_bgcolor: "transparent", plot_bgcolor: "transparent",
                font: { color: "#9ca3af" },
                xaxis: { title: "Position (nm)", gridcolor: "#374151" },
                yaxis: { title: "Intensity", gridcolor: "#374151", range: [0, 1.1] },
                margin: { t: 30, r: 30, b: 50, l: 70 },
              }} />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-2">Axial PSF Profile</h3>
            <ChartPanel data={axialProfile} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "z (nm)", gridcolor: "#374151" },
              yaxis: { title: "Intensity", gridcolor: "#374151", range: [0, 1.1] },
              margin: { t: 30, r: 30, b: 50, l: 70 },
            }} />
          </div>
        </>
      )}
    </>
  );
}
