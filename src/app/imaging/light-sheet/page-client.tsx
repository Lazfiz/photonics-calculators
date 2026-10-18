"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { airyFwhm } from "../../../physics/imaging/diffraction-psf";
import {
  effectiveAxialFwhm, gaussianSheetDivergence, gaussianSheetFwhm, gaussianSheetHalfThicknessAt,
  gaussianSheetRayleighRange, gaussianSheetWaist,
} from "../../../physics/imaging/light-sheet";
import { axialPsfFwhm } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function LightSheetPage() {
  const [naIllRaw, setNaIll] = useURLState("naIll", 0.1);
  const [naDetRaw, setNaDet] = useURLState("naDet", 0.8);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 488); // excitation, nm
  const [emissionRaw, setEmission] = useURLState("emission", 510); // nm
  const [nRaw, setN] = useURLState("n", 1.33);
  const naIll = clamp(naIllRaw, 0.01, 0.3, 0.1);
  const naDet = clamp(naDetRaw, 0.1, 1.7, 0.8);
  const wavelength = clamp(wavelengthRaw, 300, 1500, 488);
  const emission = clamp(emissionRaw, 300, 1500, 510);
  const n = clamp(nRaw, 1, 1.6, 1.33);
  const lambda = wavelength * 1e-9;
  const lambdaEm = emission * 1e-9;
  const valid = naDet < n && naIll < n;

  const w0 = gaussianSheetWaist(lambda, naIll);
  const zR = gaussianSheetRayleighRange(lambda, naIll, n);
  const sheetFwhm = gaussianSheetFwhm(lambda, naIll);
  const detAxial = axialPsfFwhm(lambdaEm, n, naDet);
  const effAxial = effectiveAxialFwhm(sheetFwhm, detAxial);
  const effAxialEdge = effectiveAxialFwhm(Math.SQRT2 * sheetFwhm, detAxial);
  const lateral = airyFwhm(lambdaEm, naDet);
  const divergence = gaussianSheetDivergence(naIll, n);

  const nas = Array.from({ length: 59 }, (_, i) => 0.01 + i * 0.005);
  const naChart = [
    { x: nas, y: nas.map((a) => gaussianSheetFwhm(lambda, a) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Sheet FWHM (µm)", line: { color: "#60a5fa" } },
    { x: nas, y: nas.map((a) => effectiveAxialFwhm(gaussianSheetFwhm(lambda, a), detAxial) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Effective axial FWHM (µm)", line: { color: "#c084fc" } },
    { x: nas, y: nas.map(() => detAxial * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Detection axial FWHM (µm)", line: { color: "#f87171", dash: "dash" } },
    { x: nas, y: nas.map((a) => 2 * gaussianSheetRayleighRange(lambda, a, n) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Field of view 2z_R (µm)", line: { color: "#34d399" }, yaxis: "y2" },
  ];

  const xs = Array.from({ length: 121 }, (_, i) => -2 * zR + (i * 4 * zR) / 120);
  const profileChart = [
    { x: xs.map((x) => x * 1e6), y: xs.map((x) => gaussianSheetHalfThicknessAt(x, lambda, naIll, n) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "+w(x)", line: { color: "#60a5fa" } },
    { x: xs.map((x) => x * 1e6), y: xs.map((x) => -gaussianSheetHalfThicknessAt(x, lambda, naIll, n) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "−w(x)", line: { color: "#60a5fa" } },
    { x: [-zR * 1e6, -zR * 1e6], y: [-Math.SQRT2 * w0 * 1e6, Math.SQRT2 * w0 * 1e6], type: "scatter" as const, mode: "lines" as const, name: "±z_R", line: { color: "#34d399", dash: "dash" } },
    { x: [zR * 1e6, zR * 1e6], y: [-Math.SQRT2 * w0 * 1e6, Math.SQRT2 * w0 * 1e6], type: "scatter" as const, mode: "lines" as const, name: "±z_R", line: { color: "#34d399", dash: "dash" } },
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 60, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Illumination NA (sheet)" value={naIllRaw} onChange={setNaIll} min={0.01} max={0.3} step="0.01" />
          <ValidatedNumberInput label="Detection NA" value={naDetRaw} onChange={setNaDet} min={0.1} max={1.7} step="0.05" />
          <ValidatedNumberInput label="Excitation wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={1500} />
          <ValidatedNumberInput label="Emission wavelength (nm)" value={emissionRaw} onChange={setEmission} min={300} max={1500} />
          <ValidatedNumberInput label="Sample medium index (n)" value={nRaw} onChange={setN} min={1} max={1.6} step="0.01" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!valid ? (
            <p className="text-red-400">NA {Math.max(naDet, naIll)} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
          ) : (
            <>
              {row("Sheet thickness 2w₀ (1/e²)", `${(2 * w0 * 1e6).toFixed(2)} µm`, "text-blue-400")}
              {row("Sheet FWHM at the waist", `${(sheetFwhm * 1e6).toFixed(2)} µm`, "text-blue-400")}
              {row("Rayleigh range z_R", `${(zR * 1e6).toFixed(1)} µm`, "text-green-400")}
              {row("Field of view 2z_R", `${(2 * zR * 1e6).toFixed(1)} µm`, "text-green-400")}
              {row("Divergence half-angle NA/n", `${(divergence * 1e3).toFixed(1)} mrad`)}
              {row("Lateral FWHM (detection)", `${(lateral * 1e9).toFixed(0)} nm`, "text-emerald-400")}
              {row("Detection axial FWHM", `${(detAxial * 1e6).toFixed(3)} µm`, "text-red-400")}
              {row("Effective axial FWHM (waist)", `${(effAxial * 1e6).toFixed(3)} µm`, "text-purple-400")}
              {row("Effective axial FWHM (at ±z_R)", `${(effAxialEdge * 1e6).toFixed(3)} µm`, "text-purple-400")}
            </>
          )}
        </div>
      </div>

      {valid && (
        <>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Thickness and field of view vs illumination NA</h2>
              <ChartPanel data={naChart} layout={{ ...layout, xaxis: { title: "Illumination NA", gridcolor: "#333" }, yaxis: { title: "FWHM (µm)", type: "log", gridcolor: "#333" }, yaxis2: { title: "Field of view (µm)", type: "log", overlaying: "y", side: "right" }, showlegend: true }} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Sheet profile along the beam</h2>
              <ChartPanel data={profileChart} layout={{ ...layout, xaxis: { title: "Distance from the waist x (µm)", gridcolor: "#333" }, yaxis: { title: "Half-thickness w (µm)", gridcolor: "#333" }, showlegend: false }} />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Model</h3>
            <div className="text-sm text-gray-300 space-y-1 font-mono">
              <p>w₀ = λ_ex/(π NA_ill), z_R = π n w₀²/λ_ex, w(x) = w₀ √(1 + (x/z_R)²)</p>
              <p>Sheet FWHM = √(2 ln 2) w₀; detection axial FWHM = 0.88 λ_em/(n − √(n² − NA_det²))</p>
              <p>Effective axial FWHM = (1/FWHM_sheet² + 1/FWHM_det²)^(−1/2)</p>
              <p>Lateral FWHM = 0.51 λ_em/NA_det (Airy)</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A Gaussian sheet from a cylindrical lens, in the paraxial limit (NA_ill ≲ 0.3). The detected axial profile
              is the product of the sheet and the detection PSF; treating both as Gaussians gives the reciprocal
              quadrature sum (Engelbrecht and Stelzer 2006). A thinner sheet improves sectioning but shortens the field
              of view as NA_ill⁻²: at ±z_R the sheet is √2 thicker. Bessel, lattice and tiled sheets escape this
              trade-off and are not modelled. Selective plane illumination microscopy (SPIM) is the same geometry.
            </p>
          </div>
        </>
      )}
    </>
  );
}
