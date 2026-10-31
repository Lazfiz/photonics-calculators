"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  fieldStopDiameter, ftsMaxHalfAngle, ftsMaxSolidAngle, jacquinotRatio, slitResolvingPower,
} from "../../../physics/spectroscopy/throughput";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const DEG = Math.PI / 180;

export default function JacquinotPage() {
  const [opdRaw, setMaxOPD] = useURLState("maxOPD", 1.0); // cm
  const [wnRaw, setWavenumber] = useURLState("wavenumber", 1000); // cm⁻¹
  const [fRaw, setFocalLength] = useURLState("focalLength", 100); // mm, FTS collimator
  const [beamRaw, setBeamDiameter] = useURLState("beamDiameter", 25); // mm
  const [fgRaw, setGratingFocal] = useURLState("gratingFocal", 250); // mm, grating spectrometer collimator
  const [hRaw, setSlitHeight] = useURLState("slitHeight", 10); // mm
  const [thRaw, setLittrowAngle] = useURLState("littrowAngle", 30); // deg

  const L = clamp(opdRaw, 0.001, 100, 1);
  const wn = clamp(wnRaw, 10, 50000, 1000);
  const f = clamp(fRaw, 5, 5000, 100);
  const D = clamp(beamRaw, 1, 500, 25);
  const fG = clamp(fgRaw, 10, 5000, 250);
  const h = clamp(hRaw, 0.01, 100, 10);
  const theta = clamp(thRaw, 1, 85, 30) * DEG;

  const res = 1 / L; // unapodized nominal resolution, cm⁻¹ (Griffiths & de Haseth)
  const R = wn / res;
  const omega = ftsMaxSolidAngle(wn, res);
  const alpha = ftsMaxHalfAngle(wn, res);
  const stop = fieldStopDiameter(alpha, f * 1e-3) * 1e3; // mm
  const etendue = (Math.PI * (D / 10) ** 2 / 4) * omega; // cm²·sr
  const ratio = jacquinotRatio(fG, h, theta, theta);
  const gratingSlit = slitResolvingPower(fG * 1e3, 1, theta, theta) / R; // µm: R ∝ 1/w, so w = R(1 µm)/R

  const chart = (() => {
    const lo = Math.max(res, wn / 10);
    const xs = Array.from({ length: 121 }, (_, i) => lo * (wn * 10 / lo) ** (i / 120));
    return [
      { x: xs, y: xs.map((x) => ftsMaxSolidAngle(x, res)), type: "scatter", mode: "lines", name: `Ω_max at Δν̃ = ${fmt(res, 3)} cm⁻¹`, line: { color: "#60a5fa", width: 2 } },
      { x: [wn], y: [omega], type: "scatter", mode: "markers", name: "Current", line: { color: "#f87171" }, marker: { color: "#f87171", size: 10 } },
    ];
  })();

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Interferometer</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Max OPD L (cm)" value={opdRaw} onChange={setMaxOPD} min={0.001} max={100} step="0.1" />
        <ValidatedNumberInput label="Highest Wavenumber ν̃ (cm⁻¹)" value={wnRaw} onChange={setWavenumber} min={10} max={50000} />
        <ValidatedNumberInput label="Collimator Focal Length (mm)" value={fRaw} onChange={setFocalLength} min={5} max={5000} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamRaw} onChange={setBeamDiameter} min={1} max={500} />
      </div>

      {res > wn && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100">
          The resolution 1/L = {fmt(res)} cm⁻¹ is coarser than ν̃ = {fmt(wn)} cm⁻¹: increase the maximum path difference L.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Resolution Δν̃ = 1/L" value={`${fmt(res)} cm⁻¹`} tone="blue" subtext={`resolving power R = ν̃L = ${fmt(R)}`} />
        <ResultCard label="Max Solid Angle Ω = 2πΔν̃/ν̃" value={`${fmt(omega)} sr`} tone="green"
          subtext={`half-angle ${fmt(alpha * 1e3)} mrad (${fmt(alpha / DEG, 3)}°)`} />
        <ResultCard label="Field (J-) Stop Diameter" value={`${fmt(stop)} mm`} tone="purple" subtext="2f tan α at the collimator focus" />
        <ResultCard label="FTS Étendue A·Ω" value={`${fmt(etendue)} cm²·sr`} tone="cyan" subtext={`beam area ${fmt(Math.PI * (D / 10) ** 2 / 4)} cm²`} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Grating Spectrometer at the Same R and Beam Area</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Collimator Focal Length f (mm)" value={fgRaw} onChange={setGratingFocal} min={10} max={5000} />
        <ValidatedNumberInput label="Slit Height h (mm)" value={hRaw} onChange={setSlitHeight} min={0.01} max={100} />
        <ValidatedNumberInput label="Littrow Angle θ (°)" value={thRaw} onChange={setLittrowAngle} min={1} max={85} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Jacquinot Advantage Ω_FTS/Ω_slit" value={`${fmt(ratio)}×`} tone="yellow"
          subtext={`π f/(h tan θ); Jacquinot's 2πf/h = ${fmt((2 * Math.PI * fG) / h)} assumes 2 tan θ = 1`} />
        <ResultCard label="Slit Width Needed for R" value={`${fmt(gratingSlit)} µm`} tone="orange"
          subtext="w = 2f tan θ/R (slit-limited; diffraction limit mNρ must exceed R)" />
      </div>

      <ChartPanel data={chart} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Max Solid Angle Ω (sr)", gridcolor: "#374151", type: "log" },
        margin: { t: 20, b: 50, l: 70, r: 20 }, legend: { bgcolor: "transparent" },
      }} />
      <p className="text-sm text-gray-400 mt-3">
        The highest wavenumber in the band sets the field stop: a ray at angle θ sees the path difference x cos θ, so
        its lines appear at ν̃ cos θ; the field is limited to the cone where that shift stays below the resolution.
      </p>
    </>
  );
}
