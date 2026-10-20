"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  besselBeamIntensity, coreFwhm, coreRadius, maxPropagationDistance, radialWavenumber,
} from "../../../physics/wave-optics/bessel-beam";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const MAX_RINGS = 20; // plotted rings: 6 heatmap pixels and 25 profile points per ring

export default function BesselBeamPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 632.8); // nm
  const [alphaRaw, setAlpha] = useURLState("alpha", 0.01); // cone half-angle, rad
  const [RRaw, setR] = useURLState("R", 5); // mm, input beam radius at the axicon
  const [maxRRaw, setMaxR] = useURLState("maxR", 200); // µm, plotted radius

  const wavelength = clamp(wavelengthRaw, 200, 11000, 632.8);
  const alpha = clamp(alphaRaw, 1e-5, 1, 0.01);
  const R_mm = clamp(RRaw, 0.01, 1000, 5);

  const lambda = wavelength * 1e-9;
  const kr = radialWavenumber(lambda, alpha);
  const r0_um = coreRadius(kr) * 1e6;
  const fwhm_um = coreFwhm(kr) * 1e6;
  const zMax_mm = maxPropagationDistance(R_mm * 1e-3, alpha) * 1e3;
  const zRGauss_mm = ((Math.PI * (r0_um * 1e-6) ** 2) / lambda) * 1e3; // a Gaussian with waist r₀
  const rings = (kr * R_mm * 1e-3) / Math.PI; // J₀ zeros are π/k_r apart

  const maxRCap_um = Math.max(1, ((MAX_RINGS * Math.PI) / kr) * 1e6);
  const maxR_um = clamp(maxRRaw, 1, maxRCap_um, Math.min(200, maxRCap_um));

  const rs = Array.from({ length: 501 }, (_, i) => round6((i * maxR_um) / 500));
  const profile = [
    { name: "J₀ beam", color: "#60a5fa", points: rs.map((r) => ({ x: r, y: round6(besselBeamIntensity(0, kr, r * 1e-6)) })) },
    { name: "J₁ beam (vortex, l = 1)", color: "#f87171", dashed: true, points: rs.map((r) => ({ x: r, y: round6(besselBeamIntensity(1, kr, r * 1e-6)) })) },
  ];

  // Cross-section from a radial table (linear interpolation, 2001 points out to the corner).
  const G = 251;
  const axis = Array.from({ length: G }, (_, i) => round6(-maxR_um + (2 * maxR_um * i) / (G - 1)));
  const rTableMax = Math.SQRT2 * maxR_um;
  const table = Array.from({ length: 2001 }, (_, i) => besselBeamIntensity(0, kr, ((i * rTableMax) / 2000) * 1e-6));
  const lookup = (r: number) => {
    const s = (r / rTableMax) * 2000;
    const i = Math.min(1999, Math.floor(s));
    return table[i] + (s - i) * (table[i + 1] - table[i]);
  };
  const heat = [{
    z: axis.map((y) => axis.map((x) => round6(lookup(Math.hypot(x, y))))),
    x: axis, y: axis, type: "heatmap" as const, colorscale: "Inferno", colorbar: { title: { text: "I / I(0)" } },
  }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Cone half-angle θ (rad)" value={alphaRaw} onChange={setAlpha} min={1e-5} max={1} step="any" />
        <ValidatedNumberInput label="Input beam radius R (mm)" value={RRaw} onChange={setR} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Plotted radius (µm)" value={maxRRaw} onChange={setMaxR} min={1} max={round6(maxRCap_um)} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Core radius to the first dark ring" value={`${fmt(r0_um)} µm`} subtext={`r₀ = 2.405/k_r; core diameter ${fmt(2 * r0_um)} µm`} tone="blue" />
        <ResultCard label="Core FWHM" value={`${fmt(fwhm_um)} µm`} subtext="Full width at half the peak intensity" tone="green" />
        <ResultCard label="Bessel range z_max = R/tan θ" value={`${fmt(zMax_mm)} mm`} subtext="Where the cone of rays from the input edge crosses the axis" tone="orange" />
        <ResultCard label="Gaussian with waist r₀" value={`z_R = ${fmt(zRGauss_mm)} mm`} subtext={`The Bessel core lasts ${fmt(zMax_mm / zRGauss_mm, 3)} × longer`} tone="purple" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ResultCard label="Radial wavenumber k_r = k sin θ" value={`${fmt(kr * 1e-3)} rad/mm`} subtext={`θ = ${fmt((alpha * 180) / Math.PI, 4)}°`} tone="cyan" />
        <ResultCard label="Rings across the input ≈ k_r R/π" value={fmt(rings, 3)} subtext="Each ring carries about the core's power, so the core holds a small share" tone="yellow" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>E(r, z) = J₀(k<sub>r</sub>r) e<sup>ik<sub>z</sub>z</sup>, k<sub>r</sub> = (2π/λ) sin θ, k<sub>z</sub> = (2π/λ) cos θ: plane waves on a cone of half-angle θ.</p>
        <p>An ideal Bessel beam carries infinite power; a real one, from an axicon or annular slit, keeps its core only up to z<sub>max</sub>. For an axicon of index n and base angle γ, θ ≈ (n − 1)γ.</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title="Radial intensity" xLabel="Radius r (µm)" yLabel="Intensity (relative to the J₀ peak)" series={profile} />
        <div className="rounded-lg bg-gray-900 p-4">
          <ChartPanel data={heat} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            title: { text: "J₀ beam cross-section" },
            xaxis: { title: { text: "x (µm)" }, gridcolor: "#374151" },
            yaxis: { title: { text: "y (µm)" }, gridcolor: "#374151", scaleanchor: "x" },
            margin: { t: 40, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>
    </>
  );
}
