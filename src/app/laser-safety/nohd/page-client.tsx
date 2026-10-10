"use client";

import Link from "next/link";
import { useCallback, useId, useMemo } from "react";
import { fmtDistance, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyBeamDefinition, { parseBeamDefinition } from "../../../components/laser-safety-beam-definition";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  exposureLimit, eyeLimits, limitingAperture, limitMaxPower, T_MAX, T_MIN,
} from "../../../physics/laser-safety/eye-exposure-limits";
import {
  effectiveDiameterAt, limitSafeDiameter, nominalOcularHazardDistance, roundBeam, type BeamGrowth,
} from "../../../physics/laser-safety/hazard-distance";

const powerPresets = [5, 100, 1000]; // mW

const parseBeamGrowth = (value: string): BeamGrowth => (value === "gaussian" ? "gaussian" : "linear");

/** A beam diameter in m as mm / cm / m. */
const fmtDiameter = (d: number) => (d < 0.01 ? `${fmtNum(d * 1e3)} mm` : d < 1 ? `${fmtNum(d * 100)} cm` : `${fmtNum(d)} m`);

export default function NOHDPage() {
  const [powerRaw, setPower] = useURLState("power", 100); // mW
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 532); // nm
  const [exposureRaw, setExposure] = useURLState("exposure", 0.25); // s
  const [beamDiaRaw, setBeamDia] = useURLState("beamDia", 2); // mm
  const [divergenceRaw, setDivergence] = useURLState("divergence", 1); // mrad, full angle
  const [safetyFactorRaw, setSafetyFactor] = useURLState("safetyFactor", 1);
  const [beamDefinitionRaw, setBeamDefinition] = useURLState("beamDefinition", "1/e2");
  const [beamGrowthRaw, setBeamGrowth] = useURLState("beamGrowth", "linear");
  const growthId = useId();

  // URL values aren't range-checked: clamp them here, as the physics is only defined inside these ranges.
  const power = Math.max(powerRaw, 0);
  const wavelength = wavelengthRaw; // outside 180 nm – 1 mm the physics returns NaN and the page says so
  const exposure = Math.min(Math.max(exposureRaw, T_MIN), T_MAX);
  const beamDia = Math.max(beamDiaRaw, 1e-3);
  const divergence = Math.max(divergenceRaw, 0);
  const safetyFactor = Math.max(safetyFactorRaw, 1);
  const beamDefinition = parseBeamDefinition(beamDefinitionRaw);
  const growth = parseBeamGrowth(beamGrowthRaw);

  // ICNIRP 2013 eye limits and the beam model: src/physics/laser-safety/{eye-exposure-limits,hazard-distance}.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const to1e2 = beamDefinition === "1/e" ? Math.SQRT2 : 1; // 1/e values are 1/√2 of the 1/e² ones
  const d = beamDia * 1e-3 * to1e2; // m, 1/e²
  const phi = divergence * 1e-3 * to1e2; // rad, 1/e² full angle
  const effectivePower = power * 1e-3 * safetyFactor; // W; the safety factor divides every limit, which multiplies the power

  const beam = useMemo(() => roundBeam(d, phi, growth), [d, phi, growth]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const result = useMemo(
    () => nominalOcularHazardDistance(lambda, effectivePower, beam, exposure),
    [lambda, effectivePower, beam, exposure],
  );
  const covered = !Number.isNaN(result.distance);

  const rows = useMemo(
    () =>
      limits.map((limit) => ({
        limit,
        D: limitingAperture(limit, exposure),
        H: exposureLimit(limit, exposure),
        dSafe: limitSafeDiameter(limit, effectivePower, exposure),
        distance: result.limits.find((l) => l.kind === limit.kind)?.distance ?? NaN,
      })),
    [limits, exposure, effectivePower, result],
  );
  const governing = rows.find((r) => r.limit.kind === result.limiting);
  const nohd = result.distance;
  const nohdFinite = Number.isFinite(nohd) && nohd > 0;

  const nohdText = nohd === Infinity ? "∞ (the beam doesn't spread)" : nohd === 0 ? "0 — within the limits at the aperture" : fmtDistance(nohd);
  const showDiameter = nohdFinite && governing !== undefined;

  const ratios = useCallback(
    (r: number) => {
      const dr = effectiveDiameterAt(beam, r);
      return limits.map((limit) => ({ kind: limit.kind, ratio: effectivePower / limitMaxPower(limit, dr, exposure) }));
    },
    [beam, limits, effectivePower, exposure],
  );
  const rMin = nohdFinite ? Math.max(nohd * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(nohd * 10, rMin * 10) : 1000;
  const markers = useMemo(() => (nohdFinite ? [{ r: nohd, label: "NOHD" }] : []), [nohdFinite, nohd]);

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="mb-5 flex flex-wrap gap-2">
        {powerPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPower(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${power === preset ? "border-red-400 bg-red-500/15 text-red-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} mW
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposure} onChange={setExposure} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the aperture (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Full-angle divergence (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} step="any" />
        <LaserSafetyBeamDefinition value={beamDefinition} onChange={setBeamDefinition} />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <label htmlFor={growthId} className="block text-sm text-gray-300">
            How the beam widens
          </label>
          <select
            id={growthId}
            value={growth}
            onChange={(e) => setBeamGrowth(parseBeamGrowth(e.target.value))}
            className="mt-3 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="linear">Linear a + rφ (ANSI Z136.1 / IEC TR 60825-14)</option>
            <option value="gaussian">Gaussian √(a² + (rφ)²), waist at the aperture</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            The linear form is the standards&apos;. A beam with its waist at the aperture widens more slowly, so the Gaussian NOHD is a little longer.
          </p>
        </div>
      </div>

      {covered ? (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 mb-4 ${growth === "gaussian" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            <ResultCard
              label="NOHD"
              value={nohdText}
              tone={nohd === 0 ? "green" : "red"}
              subtext={`For ${fmtNum(power)} mW${safetyFactor > 1 ? ` × safety factor ${fmtNum(safetyFactor)}` : ""}, exposures up to ${fmtNum(exposure)} s`}
            />
            <ResultCard label="Governing limit" value={result.limiting ? LIMIT_LABELS[result.limiting] : "none"} tone="yellow" />
            <ResultCard
              label="1/e² diameter at the NOHD"
              value={showDiameter ? fmtDiameter(governing.dSafe) : "—"}
              tone="blue"
              subtext="Smallest beam that is within the governing limit"
            />
            {growth === "gaussian" ? (
              <ResultCard label="Rayleigh range" value={fmtDistance(d / phi)} tone="cyan" subtext="a/φ: the beam is √2 wider than at the aperture there" />
            ) : null}
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Aperture at t (mm)</th>
                  <th className="py-2 pr-4 font-normal">H at t (J/m²)</th>
                  <th className="py-2 pr-4 font-normal">Safe 1/e² diameter</th>
                  <th className="py-2 font-normal">Hazard distance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.limit.kind} className="border-b border-gray-900">
                    <td className="py-2 pr-4">{LIMIT_LABELS[r.limit.kind]}</td>
                    <td className="py-2 pr-4">{(r.D * 1e3).toFixed(2)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H)}</td>
                    <td className="py-2 pr-4">{r.dSafe > 0 ? fmtDiameter(r.dSafe) : "any size"}</td>
                    <td className="py-2">{fmtDistance(r.distance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              The safety factor multiplies the power, which is the same as dividing every limit by it. The photochemical
              limit applies from 10 s; before that only the thermal limit does.
            </p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Nominal ocular hazard distance of a direct beam on the ICNIRP 2013 eye limits (Health Phys. 105:271), at any
        wavelength from 180 nm to 1 mm, for one exposure of up to t. For each limit the beam is safe once the
        irradiance averaged over that limit&apos;s aperture (7 mm for the retina; 1–3.5 mm on the cornea) stays within it for
        every exposure up to t; the NOHD is where the beam&apos;s diameter reaches that size. For beams much wider than the
        aperture this is the standards&apos; NOHD = (√(4P/(πE)) − a)/φ with 1/e values; at the defaults it gives 97.8 m
        where the peak-irradiance formula gives 98.0 m. Not modelled: atmospheric attenuation, optical aids (binoculars
        and telescopes lengthen it), pulse trains, and elliptical beams (see the{" "}
        <Link href="/laser-safety/diode-laser-safety" className="underline hover:text-white">diode page</Link>).
      </p>

      {covered ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Exposure over limit against distance for each eye limit, with the beam&apos;s diameter growing as chosen. The
            beam is within the limits where every line is below the dashed limit line; the NOHD is where the highest
            line crosses it.
          </p>
        </div>
      ) : null}

      <LaserSafetySuiteLinks currentHref="/laser-safety/nohd" />
    </>
  );
}
