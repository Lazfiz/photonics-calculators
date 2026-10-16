"use client";

import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  CONFOCAL_MAX_PINHOLE_AU, confocalAxialFwhm, confocalLateralFwhm, confocalOpticalSectionFwhm,
} from "../../../physics/imaging/confocal";
import { airyFwhm } from "../../../physics/imaging/diffraction-psf";
import { airyUnit, axialPsfFwhm } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ConfocalResolutionPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [pinholeAURaw, setPinholeAU] = useURLState("pinholeAU", 1.0);
  const [refractiveIndexRaw, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [magnificationRaw, setMagnification] = useURLState("magnification", 60);
  const wavelength = clamp(wavelengthRaw, 300, 2000, 550);
  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const pinholeAU = clamp(pinholeAURaw, 0, CONFOCAL_MAX_PINHOLE_AU, 1);
  const n = clamp(refractiveIndexRaw, 1, 1.8, 1.518);
  const magnification = clamp(magnificationRaw, 1, 500, 60);
  const lambda = wavelength * 1e-9;
  const valid = na < n;

  // FWHMs in nm: confocal from the scalar paraxial confocal model, widefield from the single PSF.
  const confocalLateral = confocalLateralFwhm(lambda, na, pinholeAU) * 1e9;
  const widefieldLateral = airyFwhm(lambda, na) * 1e9;
  const confocalAxial = confocalAxialFwhm(lambda, n, na, pinholeAU) * 1e9;
  const widefieldAxial = axialPsfFwhm(lambda, n, na) * 1e9;
  const section = confocalOpticalSectionFwhm(lambda, n, na, pinholeAU) * 1e9;
  const pinholeUm = (pinholeAU * airyUnit(lambda, na) * magnification) * 1e6; // at the pinhole plane

  const aus = Array.from({ length: 51 }, (_, i) => i / 10);
  const chartData = [
    { x: aus, y: aus.map((p) => confocalLateralFwhm(lambda, na, p) * 1e9), type: "scatter", mode: "lines", name: "Confocal lateral", line: { color: "#34d399" } },
    { x: [0, CONFOCAL_MAX_PINHOLE_AU], y: [widefieldLateral, widefieldLateral], type: "scatter", mode: "lines", name: "Widefield lateral", line: { color: "#60a5fa", dash: "dot" } },
    { x: aus, y: aus.map((p) => confocalAxialFwhm(lambda, n, na, p) * 1e9), type: "scatter", mode: "lines", name: "Confocal axial (y2)", line: { color: "#fbbf24", dash: "dash" }, yaxis: "y2" },
    { x: [0, CONFOCAL_MAX_PINHOLE_AU], y: [widefieldAxial, widefieldAxial], type: "scatter", mode: "lines", name: "Widefield axial (y2)", line: { color: "#f87171", dash: "dot" }, yaxis: "y2" },
    { x: [pinholeAU], y: [confocalLateral], type: "scatter", mode: "markers", name: "Current", marker: { color: "#34d399", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeAURaw} onChange={setPinholeAU} min={0} max={CONFOCAL_MAX_PINHOLE_AU} step="0.1" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndexRaw} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Magnification" value={magnificationRaw} onChange={setMagnification} min={1} max={500} step="5" />
      </div>

      {!valid && (
        <p className="text-red-400 mb-6">NA {na} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
      )}

      {valid && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Confocal lateral FWHM</p>
              <p className="text-2xl font-bold text-green-400">{confocalLateral.toFixed(1)} nm</p>
              <p className="text-xs text-gray-500">widefield {widefieldLateral.toFixed(1)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Confocal axial FWHM (point)</p>
              <p className="text-2xl font-bold text-yellow-400">{confocalAxial.toFixed(0)} nm</p>
              <p className="text-xs text-gray-500">widefield {widefieldAxial.toFixed(0)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Optical section FWHM (plane)</p>
              <p className="text-2xl font-bold text-blue-400">{section.toFixed(0)} nm</p>
              <p className="text-xs text-gray-500">widefield: no sectioning</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Pinhole diameter</p>
              <p className="text-2xl font-bold text-purple-400">{pinholeUm.toFixed(2)} µm</p>
              <p className="text-xs text-gray-500">at {magnification}× magnification</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Formulas</h3>
            <div className="text-sm text-gray-300 space-y-1 font-mono">
              <p>Widefield: lateral 0.51 λ/NA, axial 0.88 λ/(n − √(n² − NA²))</p>
              <p>Confocal, pinhole → 0: lateral 0.37 λ/NA, axial 0.64 λ/(n − √(n² − NA²))</p>
              <p>Confocal PSF = illumination PSF × (detection PSF ⊗ pinhole)</p>
              <p>Pinhole diameter = AU × 1.22 λ/NA × M</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scalar paraxial theory, equal excitation and emission wavelengths, uniformly filled pupil. At 1 AU the
              lateral FWHM is within 3 % of widefield: the gain comes below about 0.5 AU, at the cost of signal. The axial
              values are for a point; the optical section is the response to a thin fluorescent plane.
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <ChartPanel data={chartData} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, xaxis: { title: "Pinhole (Airy units)", gridcolor: "#374151" },
              yaxis: { title: "Lateral FWHM (nm)", gridcolor: "#374151" },
              yaxis2: { title: "Axial FWHM (nm)", overlaying: "y", side: "right" },
              margin: { t: 30, r: 70, b: 50, l: 70 },
            }} />
          </div>
        </>
      )}
    </>
  );
}
