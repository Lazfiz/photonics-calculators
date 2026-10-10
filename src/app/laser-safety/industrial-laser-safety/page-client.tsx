"use client";

import { useCallback, useMemo } from "react";
import { fmtDistance, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exposureLimit, eyeLimits, limitingAperture, limitMaxPower, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import {
  diffuseExposure, diffuseHazardDistance, effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../../physics/laser-safety/hazard-distance";

export default function IndustrialLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 4000); // W
  const [wavelength, setWavelength] = useURLState("wavelength", 1070); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 5); // mm, 1/e² at the exit
  const [divergence, setDivergence] = useURLState("divergence", 2); // mrad, 1/e² full angle
  const [materialReflectivity, setMaterialReflectivity] = useURLState("materialReflectivity", 30); // %, diffuse
  const [workingDistance, setWorkingDistance] = useURLState("workingDistance", 0.3); // m, viewer to the spot
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s
  const [spotDia, setSpotDia] = useURLState("spotDia", 0.3); // mm, 1/e² focused spot on the workpiece

  // ICNIRP 2013 eye limits and the beam model: src/physics/laser-safety/hazard-distance.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0);
  const a = Math.max(beamDia, 1e-3) * 1e-3;
  const phi = Math.max(divergence, 0) * 1e-3;
  const rho = Math.min(Math.max(materialReflectivity, 0), 100) / 100;
  const rWork = Math.max(workingDistance, 0.01);
  const dSpot = Math.max(spotDia, 1e-3) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);
  const reflectedP = rho * P;

  const beam = useMemo(() => roundBeam(a, phi), [a, phi]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const direct = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, t), [lambda, P, beam, t]);
  const odDirect = useMemo(() => requiredOpticalDensity(lambda, P, a, t), [lambda, P, a, t]);
  const diffuseDistance = useMemo(() => diffuseHazardDistance(lambda, reflectedP, dSpot, t), [lambda, reflectedP, dSpot, t]);
  const diffuse = useMemo(() => diffuseExposure(lambda, reflectedP, dSpot, rWork, t), [lambda, reflectedP, dSpot, rWork, t]);
  const valid = !Number.isNaN(direct.distance) && !Number.isNaN(odDirect.od) && !Number.isNaN(diffuseDistance.distance) && diffuse.limits.length > 0;

  const worstDiffuse = diffuse.limits.reduce<(typeof diffuse.limits)[number] | null>((w, l) => (!w || l.ratio > w.ratio ? l : w), null);
  const diffuseRatio = worstDiffuse ? worstDiffuse.ratio : NaN;
  const odDiffuse = Math.max(0, Math.log10(diffuseRatio));

  const rows = useMemo(
    () =>
      limits.map((limit) => ({
        limit,
        H: exposureLimit(limit, t),
        D: limitingAperture(limit, t),
        distance: direct.limits.find((l) => l.kind === limit.kind)?.distance ?? NaN,
      })),
    [limits, t, direct],
  );

  const directText = direct.distance === 0 ? "0 — within the limits at the exit" : fmtDistance(direct.distance);

  const nohdFinite = Number.isFinite(direct.distance) && direct.distance > 0;
  const rMin = nohdFinite ? Math.max(direct.distance * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(direct.distance * 10, rMin * 10) : 1000;
  const ratios = useCallback(
    (r: number) => limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, effectiveDiameterAt(beam, r), t) })),
    [limits, P, beam, t],
  );
  const markers = useMemo(() => (nohdFinite ? [{ r: direct.distance, label: "NOHD" }] : []), [nohdFinite, direct.distance]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the exit, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Workpiece diffuse reflectance (%)" value={materialReflectivity} onChange={setMaterialReflectivity} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Focused spot on the workpiece, 1/e² (mm)" value={spotDia} onChange={setSpotDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Viewing distance from the spot (m)" value={workingDistance} onChange={setWorkingDistance} min={0.01} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
      </div>

      {valid ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard
              label="NOHD of the direct beam"
              value={directText}
              tone="red"
              subtext={direct.limiting ? `Set by: ${LIMIT_LABELS[direct.limiting]}` : "No limit exceeded"}
            />
            <ResultCard
              label="Optical density for the direct beam"
              value={`OD ${odDirect.od.toFixed(2)}`}
              tone="purple"
              subtext={odDirect.limiting ? `At the exit, set by: ${LIMIT_LABELS[odDirect.limiting]}` : "No eyewear needed"}
            />
            <ResultCard label="Reflected power ρP" value={fmtPower(reflectedP)} tone="orange" />
            <ResultCard
              label="Diffuse hazard distance"
              value={diffuseDistance.distance === 0 ? "none" : fmtDistance(diffuseDistance.distance)}
              tone="yellow"
              subtext={diffuseDistance.limiting ? `Set by: ${LIMIT_LABELS[diffuseDistance.limiting]}` : undefined}
            />
            <ResultCard
              label={`Diffuse exposure / limit at ${fmtDistance(rWork)}`}
              value={`${fmtNum(diffuseRatio)}× ${diffuseRatio > 1 ? "(exceeds)" : "(within)"}`}
              tone={diffuseRatio > 1 ? "red" : "green"}
              subtext={`Spot subtends ${fmtNum(diffuse.alpha * 1e3)} mrad`}
            />
            <ResultCard
              label="Optical density for the diffuse reflection"
              value={`OD ${odDiffuse.toFixed(2)}`}
              tone="blue"
              subtext={`At ${fmtDistance(rWork)}`}
            />
          </div>

          <div className="overflow-x-auto mb-4">
            <p className="text-sm text-gray-400 mb-2">Direct beam, by eye limit</p>
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Aperture (mm)</th>
                  <th className="py-2 pr-4 font-normal">H at t (J/m²)</th>
                  <th className="py-2 font-normal">Hazard distance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.limit.kind} className="border-b border-gray-900">
                    <td className="py-2 pr-4">{LIMIT_LABELS[r.limit.kind]}</td>
                    <td className="py-2 pr-4">{(r.D * 1e3).toFixed(2)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H)}</td>
                    <td className="py-2">{r.distance === 0 ? "none" : fmtDistance(r.distance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              A specular (mirror-like) reflection is a direct beam carrying ρP: use the direct-beam values with the
              reflected power.
            </p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        The direct-beam NOHD grows the beam as a + rφ (ANSI Z136.1, IEC TR 60825-14). A diffuse reflection is Lambertian,
        ρP/(πr²), and the spot is an extended source of α = d<sub>63</sub>/r, which raises the retinal limit through
        ICNIRP&apos;s C<sub>E</sub> with an open field of view. Both use the ICNIRP 2013 limits for one exposure of up to
        t (10 s is the usual time for unintended viewing of invisible beams). Eyewear OD is log<sub>10</sub>(exposure /
        limit); the filter must also survive the beam (EN 207 damage threshold), which this page does not check. Plume,
        plasma radiation and fumes are separate hazards.
      </p>

      {valid && P > 0 ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Direct-beam exposure over limit for each eye limit against distance from the exit. The beam is within the
            limits where every line is below the dashed line; the marker is the NOHD.
          </p>
        </div>
      ) : null}
    </>
  );
}
