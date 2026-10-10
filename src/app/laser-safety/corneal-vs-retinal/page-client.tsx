"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { fmtNum, fmtPower, LIMIT_LABELS, segmentedLine } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  eyeLimits, limitMaxPower, T_MAX, T_MIN, type EyeLimit, type EyeLimitKind,
} from "../../../physics/laser-safety/eye-exposure-limits";
import { retinalGain, retinalImageDiameter, retinalIrradiance } from "../../../physics/laser-safety/retinal-image";

const RETINAL: readonly EyeLimitKind[] = ["retinalThermal", "retinalPhotochemical"];

/** The lowest max power among the limits of one tissue, and which limit it is; null if the tissue has none at λ. */
function tissueMax(limits: EyeLimit[], retina: boolean, d: number, t: number) {
  let best: { kind: EyeLimitKind; pMax: number } | null = null;
  for (const l of limits) {
    if (RETINAL.includes(l.kind) !== retina) continue;
    const pMax = limitMaxPower(l, d, t);
    if (!best || pMax < best.pMax) best = { kind: l.kind, pMax };
  }
  return best;
}

export default function CornealVsRetinalPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1300); // nm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 3); // mm, 1/e²

  // ICNIRP 2013 eye limits and the eye's retinal image: src/physics/laser-safety/. SI inside.
  const lambda = wavelength * 1e-9;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);
  const d = Math.max(beamDiam, 0.01) * 1e-3;

  const r = useMemo(() => {
    const limits = eyeLimits(lambda);
    const retina = tissueMax(limits, true, d, t);
    const front = tissueMax(limits, false, d, t);
    const s = retinalImageDiameter(lambda, d);
    return { retina, front, s, gain: retinalGain(s) };
  }, [lambda, d, t]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 401 }, (_, i) => 180 * Math.pow(20000 / 180, i / 400));
    const curve = (retina: boolean) => wls.map((nm) => tissueMax(eyeLimits(nm * 1e-9), retina, d, t)?.pMax ?? NaN);
    // The cornea curve has a gap at 400–1150 nm, where only the retinal limits apply.
    const traces: Record<string, unknown>[] = [
      ...segmentedLine(wls, curve(true), "Retina", { color: "#60a5fa" }),
      ...segmentedLine(wls, curve(false), "Cornea / lens", { color: "#fbbf24" }),
    ];
    const here = Math.min(r.retina?.pMax ?? Infinity, r.front?.pMax ?? Infinity);
    if (Number.isFinite(here)) {
      traces.push({ x: [wavelength], y: [here], type: "scatter", mode: "markers", name: "λ", marker: { color: "#f87171", size: 9 } });
    }
    return traces;
  }, [d, t, r, wavelength]);

  const governing = r.retina && (!r.front || r.retina.pMax <= r.front.pMax) ? r.retina : r.front;
  const reachesRetina = r.retina !== null;

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiam} onChange={setBeamDiam} min={0.01} step="any" />
      </div>

      {governing ? (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ResultCard
            label="Retina: max power"
            value={r.retina ? fmtPower(r.retina.pMax) : "not reached (absorbed in front)"}
            subtext={r.retina ? LIMIT_LABELS[r.retina.kind] : undefined}
            tone="blue"
          />
          <ResultCard
            label="Cornea / lens: max power"
            value={r.front ? fmtPower(r.front.pMax) : "no separate limit"}
            subtext={r.front ? LIMIT_LABELS[r.front.kind] : "the retinal limits protect the front of the eye"}
            tone="yellow"
          />
          <ResultCard label="Tissue at risk first" value={RETINAL.includes(governing.kind) ? "Retina" : "Cornea / lens"} subtext={LIMIT_LABELS[governing.kind]} tone="red" />
        </div>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      {reachesRetina && r.retina && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ResultCard label="Retinal image diameter" value={`${fmtNum(r.s * 1e6)} µm`} subtext="no smaller than 25.5 µm (α_min × 17 mm)" tone="cyan" />
          <ResultCard label="Retina / cornea irradiance gain" value={`${fmtNum(r.gain)}×`} subtext="vs the corneal irradiance over 7 mm" tone="cyan" />
          <ResultCard
            label="Retinal irradiance at that power"
            value={`${fmtNum(retinalIrradiance(r.retina.pMax, d, r.s))} W/m²`}
            subtext="before absorption in the eye"
            tone="cyan"
          />
        </div>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Which part of the eye limits the exposure, from the ICNIRP 2013 eye limits (Health Phys. 105:271, Tables 3, 5
        and 8). From 400 to 1400 nm the cornea and lens pass the beam and the eye focuses it on the retina; ICNIRP puts
        the cornea-to-retina irradiance gain for a point source at about 100 000. Here the eye is a 17 mm lens that
        focuses a TEM₀₀ beam to 4λf/(πd), but never below 25.5 µm (α_min = 1.5 mrad), so the gain is (7 mm / image)²,
        at most 7.5×10⁴. In the UV and from 1400 nm the cornea and lens absorb the beam and only the corneal limits apply.
        From 1150 to 1400 nm both apply: the retinal limit (C_C rises as water absorbs more) and twice the skin limit
        for the cornea and lens. Each limit is a corneal exposure averaged over its aperture (7 mm retinal, 3.5 mm
        anterior, 1 → 3.5 mm corneal); the max power is for this beam, staying within the limit at every duration up to
        t. Absorption in the ocular media is not modelled.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Max power (W)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Largest power of this beam within the retinal and the corneal limits, 180 nm to 20 µm, for the chosen time.
          The lower curve governs.
        </p>
      </div>
    </>
  );
}
