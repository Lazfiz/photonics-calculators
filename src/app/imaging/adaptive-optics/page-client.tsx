"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DM_FITTING_COEFFICIENT, dmFittingVariance, nollResidual, strehlRatio, uncorrectedPhaseVariance,
} from "../../../physics/free-space-comms/turbulence";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

type DmType = keyof typeof DM_FITTING_COEFFICIENT;
const DM_TYPES: DmType[] = ["continuous", "segmentedTipTilt", "segmentedPiston"];
const DM_LABELS: Record<DmType, string> = {
  continuous: "Continuous facesheet (κ 0.28)",
  segmentedTipTilt: "Segments, piston + tip-tilt (κ 0.134)",
  segmentedPiston: "Segments, piston only (κ 1.26)",
};
const MAX_MODES = 1000;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between gap-4 border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono text-right ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

export default function AdaptiveOpticsPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [dr0Raw, setDr0] = useURLState("dr0", 10);
  const [modesRaw, setModes] = useURLState("numZernike", 15);
  const [actuatorsRaw, setActuators] = useURLState("dmActuators", 32);
  const [dmTypeRaw, setDmType] = useURLState("dmType", "continuous");
  const [strokeRaw, setStroke] = useURLState("dmStroke", 5);
  const wavelengthNm = clamp(wavelengthRaw, 200, 20000, 550);
  const dr0 = clamp(dr0Raw, 0.1, 200, 10);
  const modes = Math.round(clamp(modesRaw, 1, MAX_MODES, 15));
  const actuators = clamp(actuatorsRaw, 1, 200, 32);
  const dmType: DmType = DM_TYPES.find((t) => t === dmTypeRaw) ?? "continuous";
  const strokeUm = clamp(strokeRaw, 0, 100, 5);

  // σ² in rad², with r₀ = 1 so that D = D/r₀; rms optical path σλ/2π in nm.
  const rmsNm = (variance: number) => (Math.sqrt(variance) * wavelengthNm) / (2 * Math.PI);
  const open = uncorrectedPhaseVariance(dr0, 1);
  const tipTiltRemoved = nollResidual(3) * dr0 ** (5 / 3);
  const modal = nollResidual(modes) * dr0 ** (5 / 3);
  const zonal = dmFittingVariance(dr0 / actuators, 1, DM_FITTING_COEFFICIENT[dmType]);
  const strehlOpen = strehlRatio(open, dr0, 1);
  const strehlModal = strehlRatio(modal, dr0, 1);
  const strehlZonal = strehlRatio(zonal, dr0, 1);
  // A ±3σ span of the tip-tilt-removed wavefront is 6σ of optical path; reflection halves it on the mirror surface.
  const strokeNeededUm = (3 * rmsNm(tipTiltRemoved)) / 1000;

  const curve = (() => {
    const js: number[] = [];
    for (let k = 0; k <= 90; k++) {
      const j = Math.round(10 ** (k / 30));
      if (j !== js[js.length - 1]) js.push(j);
    }
    return { x: js, y: js.map((j) => strehlRatio(nollResidual(j) * dr0 ** (5 / 3), dr0, 1)) };
  })();
  const chart = [
    { ...curve, type: "scatter" as const, mode: "lines" as const, name: "Modal: first J Zernike modes corrected", line: { color: "#60a5fa" } },
    { x: [1, MAX_MODES], y: [strehlZonal, strehlZonal], type: "scatter" as const, mode: "lines" as const, name: `DM fitting limit, ${actuators} across`, line: { color: "#f87171", dash: "dash" } },
    { x: [modes], y: [strehlModal], type: "scatter" as const, mode: "markers" as const, name: "Current J", marker: { color: "#facc15", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="any" />
          <ValidatedNumberInput label="D/r₀ at this wavelength" value={dr0Raw} onChange={setDr0} min={0.1} max={200} step="any" />
          <p className="text-xs text-gray-500">
            r₀ grows as λ^(6/5): r₀ = 10 cm at 500 nm is 11.2 cm at 550 nm and 59 cm at 2.2 µm.
          </p>
          <ValidatedNumberInput label="Zernike modes corrected J (piston = 1)" value={modesRaw} onChange={setModes} min={1} max={MAX_MODES} step="1" />
          <ValidatedNumberInput label="DM actuators across the pupil" value={actuatorsRaw} onChange={setActuators} min={1} max={200} step="any" />
          <div role="group" aria-label="Deformable mirror type" className="flex flex-wrap gap-2">
            {DM_TYPES.map((t) => (
              <button key={t} onClick={() => setDmType(t)} className={buttonClass(dmType === t)}>{DM_LABELS[t]}</button>
            ))}
          </div>
          <ValidatedNumberInput label="DM stroke, surface peak-to-valley (µm)" value={strokeRaw} onChange={setStroke} min={0} max={100} step="any" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Uncorrected σ² = 1.0299 (D/r₀)^(5/3)", `${fmt(open, 3, " rad²")} (${fmt(rmsNm(open), 0, " nm rms")})`)}
          {row("Strehl, uncorrected", fmt(strehlOpen, 4), "text-red-400")}
          {row(`Modal residual Δ${modes} (D/r₀)^(5/3)`, `${fmt(modal, 4, " rad²")} (${fmt(rmsNm(modal), 1, " nm rms")})`)}
          {row(`Strehl, ${modes} modes corrected`, fmt(strehlModal, 4), "text-blue-400")}
          {row(`DM pitch d/r₀ = (D/r₀)/${actuators}`, fmt(dr0 / actuators, 4))}
          {row("Fitting error κ (d/r₀)^(5/3)", `${fmt(zonal, 4, " rad²")} (${fmt(rmsNm(zonal), 1, " nm rms")})`)}
          {row("Strehl, DM fitting limit", fmt(strehlZonal, 4), "text-green-400")}
          {row("Stroke for ±3σ, tip-tilt removed", fmt(strokeNeededUm, 2, " µm"), strokeUm >= strokeNeededUm ? "text-green-400" : "text-yellow-400")}
          {strokeUm < strokeNeededUm && <p className="text-sm text-yellow-400">The stroke is short of ±3σ: large excursions will saturate the mirror.</p>}
          <p className="text-xs text-gray-500">
            The modal and DM rows are two separate estimates of perfect correction, not terms to add: a mirror
            with N actuators across corrects roughly the first (π/4)N² modes. Strehl = e^(−σ²) + (1 − e^(−σ²))/(1 +
            (D/r₀)²), the coherent core plus the seeing halo. The stroke row assumes the tip-tilt (σ² = 0.134
            (D/r₀)^(5/3)) is taken by a separate mirror. Servo lag, noise and anisoplanatism are left out; the
            free-space AO calculator adds the servo lag.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Strehl ratio vs Zernike modes corrected</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Zernike modes corrected J", gridcolor: "#333", type: "log" },
          yaxis: { title: "Strehl ratio", gridcolor: "#333", range: [0, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
