"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { plenopticCamera } from "../../../physics/imaging/light-field";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;
const um = 1e-6;
const mm = 1e-3;
const ARCMIN = Math.PI / (180 * 60);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtDistance = (s: number) => (s === Infinity ? "∞" : s >= 1 ? fmt(s, 2, " m") : fmt(s / mm, 0, " mm"));

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

export default function PlenopticCameraPage() {
  // Defaults: the Ng et al. (2005) prototype, 125 µm f/4 lenslets over a ~4000 × 4000 sensor of 9 µm pixels.
  const [wavelengthRaw, setWavelengthNm] = useURLState("wavelengthNm", 550);
  const [mainFocalRaw, setMainLensFocalMm] = useURLState("mainLensFocalMm", 140);
  const [mainFNumberRaw, setMainFNumber] = useURLState("mainFNumber", 4);
  const [focusRaw, setFocusDistanceM] = useURLState("focusDistanceM", 1);
  const [microFocalRaw, setMicroLensFocalMm] = useURLState("microLensFocalMm", 0.5);
  const [pitchRaw, setMicroLensPitchUm] = useURLState("microLensPitchUm", 125);
  const [pixelRaw, setPixelPitchUm] = useURLState("pixelPitchUm", 9);
  const [widthRaw, setSensorWidthPx] = useURLState("sensorWidthPx", 4000);
  const [heightRaw, setSensorHeightPx] = useURLState("sensorHeightPx", 4000);
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const mainFocalMm = clamp(mainFocalRaw, 1, 2000, 140);
  const mainFNumber = clamp(mainFNumberRaw, 0.5, 64, 4);
  const focusM = clamp(focusRaw, 0.001, 10000, 1);
  const microFocalMm = clamp(microFocalRaw, 0.01, 20, 0.5);
  const pitchUm = clamp(pitchRaw, 5, 2000, 125);
  const pixelUm = clamp(pixelRaw, 0.5, 50, 9);
  const widthPx = Math.round(clamp(widthRaw, 1, 50000, 4000));
  const heightPx = Math.round(clamp(heightRaw, 1, 50000, 4000));

  const base = {
    pixelPitch: pixelUm * um, sensorWidthPx: widthPx, sensorHeightPx: heightPx, mainFNumber,
    mainFocal: mainFocalMm * mm, focusDistance: focusM, lambda: wavelengthNm * nm,
  };
  const r = plenopticCamera({ ...base, lensletPitch: pitchUm * um, lensletFocal: microFocalMm * mm });
  const focusTooClose = !(focusM * 1000 > mainFocalMm);
  const fill = r.microImageFill;
  const fillNote = !Number.isFinite(fill) ? "—"
    : fill > 1.02 ? "micro-images overlap"
      : fill < 0.98 ? "micro-images leave gaps: pixels go unused"
        : "matched: micro-images tile the sensor";

  // Sweep N with matched lenslets (pitch N·p, f_µ = N_w·pitch) on the same sensor and main lens.
  const ns = Array.from({ length: 39 }, (_, k) => k + 2);
  const sweep = ns.map((k) => plenopticCamera({ ...base, lensletPitch: k * pixelUm * um, lensletFocal: mainFNumber * k * pixelUm * um }));
  const chart = [
    { x: ns, y: sweep.map((s) => s.lensletsX), type: "scatter" as const, mode: "lines" as const, name: "Lenslets across the width", line: { color: "#60a5fa" } },
    { x: ns, y: sweep.map((s) => s.imageRefocusRange / mm), type: "scatter" as const, mode: "lines" as const, name: "Image-side refocus range ± (mm)", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ...(r.pixelsAcross >= 2 && r.pixelsAcross <= 40
      ? [{ x: [r.pixelsAcross], y: [r.lensletsX], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } }]
      : []),
  ];

  return (
    <>
      {focusTooClose && (
        <p className="mb-4 text-sm text-red-400">The focus distance must exceed the main-lens focal length: only the refocus distances are blank.</p>
      )}
      {fill > 1.02 && (
        <p className="mb-4 text-sm text-yellow-300">Overlapping micro-images mix neighbouring views in a band D − p_µ wide; N counts only the 2p_µ − D clean pixels.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {card("Spatial samples (lenslets)", `${fmt(r.lensletsX, 0)} × ${fmt(r.lensletsY, 0)}`, `one sample per ${fmt(pitchUm, 0, " µm")} lenslet`, "text-blue-400")}
        {card("Views N × N", `${fmt(r.pixelsAcross, 0)} × ${fmt(r.pixelsAcross, 0)} = ${fmt(r.views, 0)}`, `whole pixels across a micro-image; ${fmt(r.angularStep / ARCMIN, 2, " arcmin")} per pixel at the lenslet`, "text-green-400")}
        {card("Microlens vs main-lens f-number", `f/${fmt(r.lensletFNumber, 2)} vs f/${fmt(mainFNumber, 2)}`, `micro-image ${fmt(fill * 100, 0, " %")} of the pitch: ${fillNote}`, Math.abs(fill - 1) > 0.02 ? "text-red-400" : "text-yellow-400")}
        {card("Refocusable object range", `${fmtDistance(r.refocusNear)} – ${fmtDistance(r.refocusFar)}`, `image side ±N·N_w·p_µ = ±${fmt(r.imageRefocusRange / mm, 2, " mm")}; conventional ±${fmt(r.imageDofConventional / mm, 3, " mm")}`, "text-purple-400")}
        {card("4D light field", `${fmt(r.samples / 1e6, 2)} M samples`, `${fmt((2 * r.samples) / 1e6, 2, " MB")} at 16 bit; raw frame ${fmt((2 * widthPx * heightPx) / 1e6, 2, " MB")}`, "text-pink-400")}
        {card("Lenslet-to-sensor tolerance", `±${fmt(r.spacingTolerance / um, 1, " µm")}`, `p_px·f_µ/p_µ; lenslet Airy diameter ${fmt(r.lensletAiry / um, 2, " µm")} vs ${fmt(pixelUm, 1, " µm")} pixels`, "text-gray-300")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Main lens focal length (mm)" value={mainFocalRaw} onChange={setMainLensFocalMm} min={1} max={2000} step="any" />
        <ValidatedNumberInput label="Main lens image-side f-number N_w" value={mainFNumberRaw} onChange={setMainFNumber} min={0.5} max={64} step="any" />
        <ValidatedNumberInput label="Focus distance (m)" value={focusRaw} onChange={setFocusDistanceM} min={0.001} max={10000} step="any" />
        <ValidatedNumberInput label="Microlens pitch p_µ (µm)" value={pitchRaw} onChange={setMicroLensPitchUm} min={5} max={2000} step="any" />
        <ValidatedNumberInput label="Microlens focal length f_µ (mm)" value={microFocalRaw} onChange={setMicroLensFocalMm} min={0.01} max={20} step="any" />
        <ValidatedNumberInput label="Pixel pitch (µm)" value={pixelRaw} onChange={setPixelPitchUm} min={0.5} max={50} step="any" />
        <ValidatedNumberInput label="Sensor width (px)" value={widthRaw} onChange={setSensorWidthPx} min={1} max={50000} step="1" />
        <ValidatedNumberInput label="Sensor height (px)" value={heightRaw} onChange={setSensorHeightPx} min={1} max={50000} step="1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelengthNm} min={200} max={2000} step="any" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p>
            A plenoptic camera (Ng et al. 2005) puts a microlens array where the sensor would be and the sensor one
            microlens focal length f_µ behind it. Each lenslet is one spatial sample, and the N pixels across its
            micro-image sample the main-lens aperture: N × N views of the scene. The defaults are close to Ng&apos;s
            prototype (125 µm f/4 lenslets, 9 µm pixels), where the paper reports 12 usable pixels across.
          </p>
          <p>
            The micro-image of the aperture has diameter f_µ/N_w, so the microlens f-number f_µ/p_µ must equal the main
            lens&apos;s image-side (working) f-number N_w. A larger N_w leaves unused pixels; a smaller one makes
            neighbouring micro-images overlap, mixing neighbouring views in a band D − p_µ wide, so N counts only the
            2p_µ − D clean pixels. The lenslet-to-sensor spacing must be right within p_px·f_µ/p_µ.
          </p>
          <p>
            Refocusing sums shifted sub-aperture views, each seen through an aperture N times narrower, so a refocused
            image is sharp (blur within one lenslet) over the depth of field of an f/(N·N_w) lens: ±N·N_w·p_µ on the image
            side, mapped to object distances by the thin-lens equation. Ng&apos;s prototype reached about half this.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Spatial–angular trade-off (matched lenslets)</h3>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Pixels across a micro-image N", gridcolor: "#333" },
          yaxis: { title: "Lenslets across the width", gridcolor: "#333" },
          yaxis2: { title: "Image-side refocus range ± (mm)", gridcolor: "#333", overlaying: "y", side: "right" },
          margin: { l: 60, r: 60, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
