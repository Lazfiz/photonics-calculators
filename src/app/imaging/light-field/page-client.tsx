"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { SPARROW_FACTOR, lightFieldMicroscope } from "../../../physics/imaging/light-field";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;
const um = 1e-6;
const mm = 1e-3;

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

export default function LightFieldPage() {
  const [naRaw, setNa] = useURLState("na", 0.2);
  const [magnificationRaw, setMagnification] = useURLState("magnification", 20);
  const [indexRaw, setIndex] = useURLState("n", 1);
  const [pixelRaw, setPixelSize] = useURLState("pixelSize", 6.5);
  const [pitchRaw, setMicrolensPitch] = useURLState("microlensPitch", 150);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const na = clamp(naRaw, 0.01, 1.6, 0.2);
  const magnification = clamp(magnificationRaw, 1, 200, 20);
  const n = clamp(indexRaw, 1, 1.6, 1);
  const pixelUm = clamp(pixelRaw, 0.5, 50, 6.5);
  const pitchUm = clamp(pitchRaw, 10, 1000, 150);
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);

  const design = (lensletPitch: number) => lightFieldMicroscope({
    na, magnification, n, lensletPitch, pixelPitch: pixelUm * um, lambda: wavelengthNm * nm,
  });
  const r = design(pitchUm * um);
  const naTooHigh = !(na < n);

  const pitches = Array.from({ length: 101 }, (_, k) => 10 * 100 ** (k / 100)); // 10 µm to 1 mm
  const sweep = pitches.map((p) => design(p * um));
  const chart = [
    { x: pitches, y: sweep.map((s) => s.lateralSample / um), type: "scatter" as const, mode: "lines" as const, name: "Lateral sample W/M (µm)", line: { color: "#60a5fa" } },
    { x: pitches, y: sweep.map((s) => s.dofRefocused / um), type: "scatter" as const, mode: "lines" as const, name: "Refocused depth of field (µm)", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ...(Number.isFinite(r.lateralSample)
      ? [{ x: [pitchUm], y: [r.lateralSample / um], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } }]
      : []),
  ];

  return (
    <>
      {naTooHigh && (
        <p className="mb-4 text-sm text-red-400">The NA must be below the medium index n ({fmt(n, 2)}): results are blank.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {card("Lateral sample on the specimen W/M", fmt(r.lateralSample / um, 2, " µm"), `Sparrow limit without lenslets ${SPARROW_FACTOR}λ/NA = ${fmt((r.sparrowImage / magnification) / um, 2, " µm")}`, "text-blue-400")}
        {card("Resolvable spots per lenslet N_u", fmt(r.nu, 2), `diffraction W/R_obj ${fmt(r.spotsDiffraction, 2)}, pixels W/(2p) ${fmt(r.spotsPixels, 2)}: ${r.pixelLimited ? "pixel limited" : "diffraction limited"}`, "text-green-400")}
        {card("Refocused slice depth of field", fmt(r.dofRefocused / um, 2, " µm"), `(2 + N_u)λn/(2NA²); conventional λn/NA² ${fmt(r.dofConventional / um, 2, " µm")}`, "text-yellow-400")}
        {card("Single-view depth of field", fmt(r.dofView / um, 1, " µm"), "(2 + N_u²)λn/(2NA²): about N_u non-overlapping refocused slices", "text-purple-400")}
        {card("Matched microlens f-number", Number.isFinite(r.lensletFNumber) ? `f/${r.lensletFNumber.toFixed(1)}` : "—", `M/(2NA); focal length ${fmt(r.lensletFocal / mm, 2, " mm")} for this pitch`, "text-pink-400")}
        {card("Sensor pixels per lenslet", fmt(pitchUm / pixelUm, 1), `R_obj = ${SPARROW_FACTOR}λM/NA = ${fmt(r.sparrowImage / um, 2, " µm")} in the image`, "text-gray-300")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.01} max={1.6} step="any" />
        <ValidatedNumberInput label="Objective magnification M" value={magnificationRaw} onChange={setMagnification} min={1} max={200} step="any" />
        <ValidatedNumberInput label="Medium index n" value={indexRaw} onChange={setIndex} min={1} max={1.6} step="any" />
        <ValidatedNumberInput label="Microlens pitch W (µm)" value={pitchRaw} onChange={setMicrolensPitch} min={10} max={1000} step="any" />
        <ValidatedNumberInput label="Sensor pixel pitch (µm)" value={pixelRaw} onChange={setPixelSize} min={0.5} max={50} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p>
            A microlens array sits at the objective&apos;s image plane and the sensor one microlens focal length behind
            it (Levoy et al. 2006). Each lenslet is one spatial sample, W/M on the specimen, and the pixels behind it
            record the directions. The microlens f-number should equal the objective&apos;s image-side f-number M/(2NA),
            so the micro-images of the objective pupil tile the sensor without overlapping.
          </p>
          <p>
            Diffraction leaves R_obj = 0.47λM/NA (the Sparrow limit) in the image, so a lenslet of width W holds N_u =
            W/R_obj resolvable spots: the product of spatial and angular samples is fixed. Resolving them takes about
            two pixels per spot; Levoy&apos;s 15-pixel lenslets resolved about 7 of 11.8 spots, so N_u is capped at
            W/(2p).
          </p>
          <p>
            Depth of field is λn/NA² + ne/(M·NA) with e the sample spacing in the image. With e = W, a synthetically
            refocused slice has (2 + N_u)λn/(2NA²); a single view, which uses 1/N_u² of the rays, has (2 +
            N_u²)λn/(2NA²). A focal stack holds about N_u non-overlapping slices.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Spatial–axial trade-off vs microlens pitch</h3>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Microlens pitch W (µm)", gridcolor: "#333", type: "log" },
          yaxis: { title: "Lateral sample (µm)", gridcolor: "#333", type: "log" },
          yaxis2: { title: "Refocused depth of field (µm)", gridcolor: "#333", overlaying: "y", side: "right", type: "log" },
          margin: { l: 60, r: 60, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
