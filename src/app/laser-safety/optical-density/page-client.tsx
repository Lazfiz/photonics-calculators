"use client";

import Link from "next/link";
import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import { fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyBeamDefinition, { parseBeamDefinition } from "../../../components/laser-safety-beam-definition";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { limitingAperture, eyeLimits, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { requiredOpticalDensity } from "../../../physics/laser-safety/hazard-distance";

const linkClass = "underline hover:text-white";

export default function OpticalDensityPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [powerRaw, setPower] = useURLState("power", 500); // mW
  const [beamDiamRaw, setBeamDiam] = useURLState("beamDiam", 3); // mm
  const [exposureRaw, setExposure] = useURLState("exposure", 0.25); // s
  const [safetyFactorRaw, setSafetyFactor] = useURLState("safetyFactor", 10);
  const [beamDefinitionRaw, setBeamDefinition] = useURLState("beamDefinition", "1/e2");

  // URL values aren't range-checked: clamp them here; outside 180 nm – 1 mm there are no limits and the page says so.
  const power = Math.max(powerRaw, 0);
  const beamDiam = Math.max(beamDiamRaw, 0);
  const exposure = Math.min(Math.max(exposureRaw, T_MIN), T_MAX);
  const safetyFactor = Math.max(safetyFactorRaw, 1);
  const beamDefinition = parseBeamDefinition(beamDefinitionRaw);

  // ICNIRP 2013 eye limits over each aperture: src/physics/laser-safety/{eye-exposure-limits,hazard-distance}.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const d = beamDiam * 1e-3 * (beamDefinition === "1/e" ? Math.SQRT2 : 1); // m, 1/e² (1/e values are 1/√2 of it)
  const P = power * 1e-3 * safetyFactor; // W; the safety factor divides every limit, which multiplies the power

  const result = useMemo(() => requiredOpticalDensity(lambda, P, d, exposure), [lambda, P, d, exposure]);
  const covered = !Number.isNaN(result.od);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const rows = result.limits
    .map((l) => ({ ...l, D: limitingAperture(limits.find((x) => x.kind === l.kind)!, exposure) }))
    .filter((r) => r.pMax < Infinity);
  // The largest power within every limit, before the safety factor.
  const pAllowed = result.limits.reduce((m, l) => Math.min(m, l.pMax), Infinity) / safetyFactor;

  // Required OD against the exposure time for this beam, 1 ms to 30 000 s.
  const chartPoints = useMemo(() => {
    if (!covered) return [];
    return Array.from({ length: 121 }, (_, i) => {
      const t = 1e-3 * Math.pow(3e7, i / 120);
      return { x: t, y: requiredOpticalDensity(lambda, P, d, t).od };
    }).filter((p) => Number.isFinite(p.y));
  }, [covered, lambda, P, d]);

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposure} onChange={setExposure} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} step="any" />
        <LaserSafetyBeamDefinition value={beamDefinition} onChange={setBeamDefinition} withDivergence={false} />
      </div>

      {covered ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <ResultCard
              label="Required OD"
              value={`OD ${result.od.toFixed(2)}`}
              tone={result.od > 0 ? "red" : "green"}
              subtext={result.od > 0 ? `Round up: eyewear of OD ${Math.ceil(result.od - 1e-9)} or more` : "No filter needed"}
            />
            <ResultCard label="Governing limit" value={result.limiting ? LIMIT_LABELS[result.limiting] : "none"} tone="yellow" />
            <ResultCard
              label="Largest power within the limits"
              value={fmtPower(pAllowed)}
              tone="blue"
              subtext={safetyFactor > 1 ? `Including the safety factor ${fmtNum(safetyFactor)}` : "For this beam"}
            />
            <ResultCard
              label="OD without the safety factor"
              value={`OD ${Math.max(0, result.od - Math.log10(safetyFactor)).toFixed(2)}`}
              tone="green"
              subtext={`The safety factor adds up to ${Math.log10(safetyFactor).toFixed(2)}`}
            />
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Aperture at t (mm)</th>
                  <th className="py-2 pr-4 font-normal">Max power{safetyFactor > 1 ? " ÷ safety factor" : ""}</th>
                  <th className="py-2 font-normal">OD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kind} className="border-b border-gray-900">
                    <td className="py-2 pr-4">{LIMIT_LABELS[r.kind]}</td>
                    <td className="py-2 pr-4">{(r.D * 1e3).toFixed(2)}</td>
                    <td className="py-2 pr-4">{fmtPower(r.pMax / safetyFactor)}</td>
                    <td className="py-2">{r.od.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              Each limit holds for every exposure up to t. The photochemical limit starts at 10 s; before that only the
              thermal limit applies.
            </p>
          </div>

          {chartPoints.length > 0 ? (
            <SimpleLineChart
              title="Required OD against the exposure time"
              xLabel="Exposure time (s)"
              yLabel="Required OD"
              xScale="log"
              series={[{ name: "Required OD", color: "#f87171", points: chartPoints }]}
            />
          ) : null}
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Optical density a filter needs so that a CW beam stays within every ICNIRP 2013 eye limit (Health Phys.
        105:271) for exposures up to t: OD = log₁₀(P / P_max), where P_max is the largest power of this beam whose
        irradiance, averaged over each limit&apos;s aperture (7 mm for the retina, 3.5 mm for the anterior eye, 1 → 3.5 mm
        on the cornea in the UV and from 1.4 µm), stays within the limit. A filter scales the power, not the beam
        profile, so this is the same as log₁₀(H/MPE) in ANSI Z136.1 and EN 207. Typical exposure times: 0.25 s for
        visible beams (aversion response), 10 s for invisible ones, longer for staring. Not modelled: pulses (see{" "}
        <Link href="/laser-safety/pulsed-mpe" className={linkClass}>pulsed MPE</Link>), EN 207 / EN 208 scale numbers,
        and whether the filter survives the beam.
      </p>

      <LaserSafetySuiteLinks currentHref="/laser-safety/optical-density" />
    </>
  );
}
