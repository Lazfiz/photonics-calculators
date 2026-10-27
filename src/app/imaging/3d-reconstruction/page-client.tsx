"use client";

import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CONFOCAL_MAX_PINHOLE_AU, confocalAxialFwhm, confocalLateralFwhm } from "../../../physics/imaging/confocal";
import { airyFwhm } from "../../../physics/imaging/diffraction-psf";
import { effectiveAxialFwhm, gaussianSheetFwhm, gaussianSheetRayleighRange } from "../../../physics/imaging/light-sheet";
import { axialPsfFwhm } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const METHODS = ["widefield", "confocal", "lightsheet"] as const;
type Method = (typeof METHODS)[number];

/** Lateral and axial FWHM (m) of each method. */
function resolution(method: Method, lambda: number, n: number, na: number, pinholeAU: number, sheetNA: number) {
  if (method === "confocal") {
    return { lateral: confocalLateralFwhm(lambda, na, pinholeAU), axial: confocalAxialFwhm(lambda, n, na, pinholeAU) };
  }
  const detection = axialPsfFwhm(lambda, n, na);
  return {
    lateral: airyFwhm(lambda, na),
    axial: method === "widefield" ? detection : effectiveAxialFwhm(gaussianSheetFwhm(lambda, sheetNA), detection),
  };
}

export default function Reconstruction3DPage() {
  const [numSlicesRaw, setNumSlices] = useURLState("numSlices", 100);
  const [sliceSpacingRaw, setSliceSpacing] = useURLState("sliceSpacing", 0.5);
  const [xyPixelRaw, setXyPixel] = useURLState("xyResolution", 0.1);
  const [naRaw, setNa] = useURLState("na", 1.0);
  const [wavelengthRaw, setWavelengthNm] = useURLState("wavelengthNm", 550);
  const [refractiveIndexRaw, setRefractiveIndex] = useURLState("refractiveIndex", 1.33);
  const [methodRaw, setMethod] = useURLState("method", "confocal");
  const [pinholeAURaw, setPinholeAU] = useURLState("pinholeAU", 1);
  const [excitationNARaw, setExcitationNA] = useURLState("excitationNA", 0.1);
  const [fovRaw, setFovUm] = useURLState("fovUm", 100);
  const numSlices = Math.round(clamp(numSlicesRaw, 1, 2000, 100));
  const sliceSpacing = clamp(sliceSpacingRaw, 0.01, 10, 0.5); // µm
  const xyPixel = clamp(xyPixelRaw, 0.01, 5, 0.1); // µm, at the sample
  const na = clamp(naRaw, 0.1, 1.7, 1.0);
  const wavelengthNm = clamp(wavelengthRaw, 300, 2000, 550);
  const n = clamp(refractiveIndexRaw, 1, 1.8, 1.33);
  const method: Method = METHODS.find((m) => m === methodRaw) ?? "confocal";
  const pinholeAU = clamp(pinholeAURaw, 0, CONFOCAL_MAX_PINHOLE_AU, 1);
  const sheetNA = clamp(excitationNARaw, 0.01, 0.3, 0.1);
  const fovUm = clamp(fovRaw, 1, 5000, 100);
  const lambda = wavelengthNm * 1e-9;
  const valid = na < n;

  const res = resolution(method, lambda, n, na, pinholeAU, sheetNA);
  const lateralNm = res.lateral * 1e9;
  const axialNm = res.axial * 1e9;
  const sheetLengthUm = 2 * gaussianSheetRayleighRange(lambda, sheetNA, n) * 1e6;
  const pixelsPerSide = Math.round(fovUm / xyPixel);
  const totalVoxels = numSlices * pixelsPerSide * pixelsPerSide;
  const volumeBytes = totalVoxels * 2; // 16-bit
  // Two samples per FWHM: a rule of thumb, near Nyquist (slightly finer) for widefield axial, looser than Nyquist for confocal.
  const xyOk = xyPixel * 1000 <= lateralNm / 2;
  const zOk = sliceSpacing * 1000 <= axialNm / 2;

  const naMax = Math.min(1.7, 0.99 * n);
  const naMin = Math.min(0.2, na);
  const nas = Array.from({ length: 50 }, (_, i) => naMin + (i * (naMax - naMin)) / 49);
  const resolutionVsNA = [
    { x: nas, y: nas.map((a) => airyFwhm(lambda, a) * 1e9), type: "scatter", mode: "lines" as const, name: "Lateral (widefield)", line: { color: "#60a5fa", width: 2 } },
    { x: nas, y: nas.map((a) => axialPsfFwhm(lambda, n, a) * 1e9), type: "scatter", mode: "lines" as const, name: "Axial (widefield)", line: { color: "#f87171", width: 2 } },
    { x: nas, y: nas.map((a) => confocalAxialFwhm(lambda, n, a, pinholeAU) * 1e9), type: "scatter", mode: "lines" as const, name: `Axial (confocal, ${pinholeAU} AU)`, line: { color: "#34d399", width: 2, dash: "dash" } },
    { x: [na], y: [axialNm], type: "scatter", mode: "markers" as const, name: "Current axial", marker: { color: "#fbbf24", size: 10 } },
  ];

  const spacings = Array.from({ length: 40 }, (_, i) => sliceSpacing * 0.2 * 15 ** (i / 39)); // log-spaced, 0.2x to 3x the step
  const stackDepth = numSlices * sliceSpacing;
  const samplingChart = [
    { x: spacings, y: spacings.map((s) => (Math.round(stackDepth / s) * pixelsPerSide ** 2) / 1e6), type: "scatter", mode: "lines" as const, name: "Voxels for the same depth (M)", line: { color: "#a78bfa", width: 2 } },
    { x: [sliceSpacing], y: [totalVoxels / 1e6], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  const labels = ["Widefield", "Confocal", "Light sheet"];
  const all = METHODS.map((m) => resolution(m, lambda, n, na, pinholeAU, sheetNA));
  const methodCompare = [
    { x: labels, y: all.map((r) => r.axial * 1e9), type: "bar" as const, name: "Axial FWHM (nm)", marker: { color: "#f87171" } },
    { x: labels, y: all.map((r) => r.lateral * 1e9), type: "bar" as const, name: "Lateral FWHM (nm)", marker: { color: "#60a5fa" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Number of Z-Slices" value={numSlicesRaw} onChange={setNumSlices} min={1} max={2000} />
        <ValidatedNumberInput label="Z-Step (µm)" value={sliceSpacingRaw} onChange={setSliceSpacing} min={0.01} max={10} step="0.05" />
        <ValidatedNumberInput label="XY pixel size at the sample (µm)" value={xyPixelRaw} onChange={setXyPixel} min={0.01} max={5} step="0.01" />
        <ValidatedNumberInput label="Numerical Aperture" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.05" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelengthNm} min={300} max={2000} />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndexRaw} onChange={setRefractiveIndex} min={1} max={1.8} step="0.01" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="widefield">Widefield (deconvolution)</option>
            <option value="confocal">Confocal</option>
            <option value="lightsheet">Light Sheet</option>
          </select>
        </label>
        <ValidatedNumberInput label="Confocal pinhole (Airy units)" value={pinholeAURaw} onChange={setPinholeAU} min={0} max={CONFOCAL_MAX_PINHOLE_AU} step="0.1" />
        <ValidatedNumberInput label="Light-sheet NA" value={excitationNARaw} onChange={setExcitationNA} min={0.01} max={0.3} step="0.01" />
        <ValidatedNumberInput label="FOV (µm)" value={fovRaw} onChange={setFovUm} min={1} max={5000} step="10" />
      </div>

      {!valid && (
        <p className="text-red-400 mb-6">NA {na} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
      )}

      {valid && (
        <>
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Lateral FWHM</p>
              <p className="text-2xl font-bold text-blue-400">{lateralNm.toFixed(0)} nm</p>
              <p className={`text-xs ${xyOk ? "text-gray-500" : "text-yellow-400"}`}>pixel {xyOk ? "≤" : ">"} FWHM/2</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Axial FWHM</p>
              <p className="text-2xl font-bold text-green-400">{axialNm.toFixed(0)} nm</p>
              <p className={`text-xs ${zOk ? "text-gray-500" : "text-yellow-400"}`}>z-step {zOk ? "≤" : ">"} FWHM/2</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Voxels</p>
              <p className="text-2xl font-bold text-yellow-400">{(totalVoxels / 1e6).toFixed(1)}M</p>
              <p className="text-xs text-gray-500">{pixelsPerSide} × {pixelsPerSide} × {numSlices}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Volume Size (16-bit)</p>
              <p className="text-2xl font-bold text-purple-400">{(volumeBytes / 1e6).toFixed(1)} MB</p>
              {method === "lightsheet" && <p className="text-xs text-gray-500">sheet length 2z_R = {sheetLengthUm.toFixed(0)} µm</p>}
            </div>
          </div>

          {method === "lightsheet" && fovUm > sheetLengthUm && (
            <p className="text-sm text-amber-400 mb-6">
              The FOV ({fovUm.toFixed(0)} µm) exceeds the sheet length 2z_R = {sheetLengthUm.toFixed(0)} µm: the axial FWHM holds at the
              waist only, and the sheet is thicker toward the edge of the FOV.
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">Resolution vs NA</h3>
              <ChartPanel data={resolutionVsNA} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
                xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "FWHM (nm)", gridcolor: "#374151" },
                margin: { t: 30, r: 20, b: 50, l: 70 }, legend: { font: { size: 9 } },
              }} />
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">Voxel Count vs Z-Step</h3>
              <ChartPanel data={samplingChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
                xaxis: { title: "Z-Step (µm)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Voxels (Millions)", gridcolor: "#374151" },
                margin: { t: 30, r: 20, b: 50, l: 70 },
              }} />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold mb-2">Method Comparison</h3>
            <ChartPanel data={methodCompare} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
              xaxis: { title: "Method" }, yaxis: { title: "FWHM (nm)", gridcolor: "#374151" },
              margin: { t: 30, r: 20, b: 50, l: 60 }, barmode: "group",
            }} />
          </div>
        </>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Lateral (widefield, light sheet):</span> FWHM = 0.51 λ/NA</p>
          <p><span className="text-blue-400">Axial (widefield):</span> FWHM = 0.88 λ/(n − √(n² − NA²))</p>
          <p><span className="text-blue-400">Confocal:</span> PSF = illumination × (detection ⊗ pinhole); 0.37 λ/NA and 0.64 λ/(n − √(n² − NA²)) as the pinhole → 0</p>
          <p><span className="text-blue-400">Light sheet:</span> w₀ = λ/(π NA_sheet), FWHM_z = (1/FWHM_sheet² + 1/FWHM_det²)^(−1/2)</p>
          <p><span className="text-blue-400">Sampling rule of thumb:</span> step ≤ FWHM/2</p>
          <p><span className="text-blue-400">Volume size:</span> V = N_x × N_y × N_z × 2 bytes</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Scalar theory, uniformly filled pupil, no aberrations; the confocal values use equal excitation and emission
          wavelengths. Deconvolution can sharpen any of these, most of all widefield stacks, which have no optical sectioning.
        </p>
      </div>
    </>
  );
}
