"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { fmtDistance, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { correctionCE, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { diffuseExposure, diffuseHazardDistance } from "../../../physics/laser-safety/hazard-distance";

export default function DiffuseReflectionPage() {
  const [powerRaw, setPower] = useURLState("power", 5000); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [beamDiameterRaw, setBeamDiameter] = useURLState("beamDiameter", 5); // mm, 1/e² diameter of the spot on the surface
  const [reflectanceRaw, setReflectance] = useURLState("surfaceReflectance", 0.1); // fraction
  const [distanceRaw, setDistance] = useURLState("viewingDistance", 0.5); // m
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10); // s

  // URL values aren't range-checked: clamp them here. ICNIRP 2013 eye limits and the diffuse-spot model:
  // src/physics/laser-safety/{eye-exposure-limits,hazard-distance}.ts. SI inside.
  const power = Math.max(powerRaw, 0);
  const beamDiameter = Math.max(beamDiameterRaw, 0);
  const reflectance = Math.min(Math.max(reflectanceRaw, 0), 1);
  const viewingDistance = Math.max(distanceRaw, 1e-4);
  const exposure = Math.min(Math.max(exposureRaw, T_MIN), T_MAX);

  const lambda = wavelength * 1e-9;
  const reflected = reflectance * power * 1e-3; // W
  const d = beamDiameter * 1e-3; // m

  const at = useMemo(() => diffuseExposure(lambda, reflected, d, viewingDistance, exposure), [lambda, reflected, d, viewingDistance, exposure]);
  const haz = useMemo(() => diffuseHazardDistance(lambda, reflected, d, exposure), [lambda, reflected, d, exposure]);
  const covered = at.limits.length > 0 && !Number.isNaN(haz.distance);

  const governing = at.limits.reduce<(typeof at.limits)[number] | null>((g, l) => (!g || l.ratio > g.ratio ? l : g), null);
  const maxRatio = governing ? governing.ratio : NaN;
  const od = Math.max(0, Math.log10(maxRatio)); // log10(0) = −∞ gives 0

  // C_E belongs to the retinal thermal limit, which is only in force from 400 to 1400 nm.
  const retinal = wavelength >= 400 && wavelength <= 1400;
  const cE = retinal ? correctionCE(at.alpha, exposure, "open") : NaN;

  const ratios = useCallback(
    (r: number) => diffuseExposure(lambda, reflected, d, r, exposure).limits.map(({ kind, ratio }) => ({ kind, ratio })),
    [lambda, reflected, d, exposure],
  );
  const hazardFinite = Number.isFinite(haz.distance) && haz.distance > 0;
  const rMin = Math.max(d * 2, 1e-3);
  const rMax = Math.max(10 * viewingDistance, hazardFinite ? 10 * haz.distance : 0, 1);
  const markers = useMemo(() => {
    const list: { r: number; y?: number; label: string }[] = [];
    const ratioHere = Math.max(...at.limits.map((l) => l.ratio));
    if (ratioHere > 0 && Number.isFinite(ratioHere)) list.push({ r: viewingDistance, y: ratioHere, label: "Viewing distance" });
    if (Number.isFinite(haz.distance) && haz.distance > 0) list.push({ r: haz.distance, label: "Hazard distance" });
    return list;
  }, [at, haz, viewingDistance]);

  const hazardText = haz.distance === 0 ? "none: within the limits at any distance" : fmtDistance(haz.distance);
  const exceeds = maxRatio > 1;

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Beam power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Spot diameter on the surface, 1/e² (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0} step="any" />
        <ValidatedNumberInput label="Surface reflectance ρ (0–1)" value={reflectance} onChange={setReflectance} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Viewing distance (m)" value={viewingDistance} onChange={setDistance} min={1e-4} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposure} onChange={setExposure} min={1e-9} max={30000} step="any" />
      </div>

      {covered ? (
        <>
          {viewingDistance < 10 * d ? (
            <p className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-3 text-sm text-amber-200 mb-4">
              Closer than 10 spot diameters ρP/(πr²) overstates the irradiance (it treats the spot as a point).
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <ResultCard
              label="Corneal irradiance at the viewer"
              value={`${fmtNum(at.irradiance)} W/m²`}
              tone="blue"
              subtext={`${fmtNum(at.irradiance * 0.1)} mW/cm², from ${fmtNum(reflected)} W reflected`}
            />
            <ResultCard
              label="Apparent source size α"
              value={`${fmtNum(at.alpha * 1e3)} mrad`}
              tone="cyan"
              subtext={retinal ? `C_E = ${fmtNum(cE)}` : "C_E: — (applies from 400 to 1400 nm)"}
            />
            <ResultCard
              label="Governing limit"
              value={governing ? LIMIT_LABELS[governing.kind] : "—"}
              tone="yellow"
              subtext={governing ? `Max irradiance ${fmtNum(governing.eMax)} W/m²` : undefined}
            />
            <ResultCard
              label="Exposure / limit"
              value={`${fmtNum(maxRatio)}× ${exceeds ? "(exceeds)" : "(within)"}`}
              tone={exceeds ? "red" : "green"}
            />
            <ResultCard
              label="Diffuse hazard distance"
              value={hazardText}
              tone={haz.distance === 0 ? "green" : "red"}
              subtext={haz.limiting ? `Set by: ${LIMIT_LABELS[haz.limiting]}` : undefined}
            />
            <ResultCard label="Optical density needed here" value={od.toFixed(2)} tone="purple" subtext="log₁₀ of the highest exposure / limit, at least 0" />
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Max irradiance (W/m²)</th>
                  <th className="py-2 pr-4 font-normal">Exposure / limit</th>
                  <th className="py-2 font-normal">Hazard distance</th>
                </tr>
              </thead>
              <tbody>
                {at.limits.map((l) => {
                  const dist = haz.limits.find((h) => h.kind === l.kind)?.distance ?? NaN;
                  return (
                    <tr key={l.kind} className="border-b border-gray-900">
                      <td className="py-2 pr-4">{LIMIT_LABELS[l.kind]}</td>
                      <td className="py-2 pr-4">{fmtNum(l.eMax)}</td>
                      <td className="py-2 pr-4">{fmtNum(l.ratio)}</td>
                      <td className="py-2">{dist === 0 ? "none" : fmtDistance(dist)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              The photochemical limit applies from 10 s; before that only the thermal limit does.
            </p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        A matte (Lambertian) surface reflecting ρP gives ρP/(πr²) at distance r on its normal. The spot is an extended
        source of angular size α = d₆₃/r, where d₆₃ = d/√2 is the diameter holding 63 % of the power (IEC 60825-1); this
        raises the retinal thermal limit through C_E (ICNIRP 2013, Table 2). The whole spot is counted (open field of
        view), so above α_max C_E = α²/(α_min α_max) (ICNIRP 2013, eqn 5) and close up the ratio stops rising. The
        blue-light limit counts the whole spot too, which errs high for spots larger than 11 mrad. Viewed off the normal
        the irradiance falls as cos θ. Specular (mirror) reflections are a direct beam: use the{" "}
        <Link href="/laser-safety/nohd" className="underline hover:text-white">NOHD</Link> page.
      </p>

      {covered ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Exposure over limit against viewing distance for each eye limit. The reflection is within the limits where
            every line is below the dashed limit line.
          </p>
        </div>
      ) : null}
    </>
  );
}
