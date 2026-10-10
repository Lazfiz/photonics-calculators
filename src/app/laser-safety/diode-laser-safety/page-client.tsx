"use client";

import { useCallback, useMemo } from "react";
import { fmtDistance, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { FWHM_PER_D1E2 } from "../../../physics/laser-safety/beam-diameter";
import { exposureLimit, eyeLimits, limitingAperture, limitMaxPower, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import {
  axisDiameterAt, effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, type BeamGeometry,
} from "../../../physics/laser-safety/hazard-distance";

export default function DiodeLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 500); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 808); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 1); // mm, 1/e² at the emitting aperture, both axes
  const [divergenceH, setDivergenceH] = useURLState("divergenceH", 10); // mrad, slow axis
  const [divergenceV, setDivergenceV] = useURLState("divergenceV", 30); // mrad, fast axis
  const [angleDefinition, setAngleDefinition] = useURLState("angleDefinition", "1/e2"); // "1/e2" | "fwhm"
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s

  // ICNIRP 2013 eye limits and the beam model: src/physics/laser-safety/hazard-distance.ts. SI inside.
  const fwhm = angleDefinition === "fwhm";
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const a = Math.max(beamDia, 1e-3) * 1e-3;
  const toFullE2 = fwhm ? 1 / FWHM_PER_D1E2 : 1; // a 1/e² width is the FWHM / √(ln2/2)
  const phiSlow = Math.max(divergenceH, 0) * 1e-3 * toFullE2;
  const phiFast = Math.max(divergenceV, 0) * 1e-3 * toFullE2;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  const beam = useMemo<BeamGeometry>(() => ({ d: [a, a], phi: [phiSlow, phiFast], growth: "linear" }), [a, phiSlow, phiFast]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, t), [lambda, P, beam, t]);
  const od = useMemo(() => requiredOpticalDensity(lambda, P, a, t), [lambda, P, a, t]);
  const valid = !Number.isNaN(nohd.distance) && !Number.isNaN(od.od);

  const rows = useMemo(
    () =>
      limits.map((limit) => ({
        limit,
        H: exposureLimit(limit, t),
        D: limitingAperture(limit, t),
        distance: nohd.limits.find((l) => l.kind === limit.kind)?.distance ?? NaN,
      })),
    [limits, t, nohd],
  );

  const nohdText = nohd.distance === 0 ? "0 — within the limits at the aperture" : fmtDistance(nohd.distance);
  const sizeAtNohd = Number.isFinite(nohd.distance)
    ? `${fmtNum(axisDiameterAt(a, phiSlow, nohd.distance, "linear") * 100)} × ${fmtNum(axisDiameterAt(a, phiFast, nohd.distance, "linear") * 100)} cm`
    : "—";
  const peakIrradiance = (8 * P) / (Math.PI * a * a) / 1e4; // W/cm² at the aperture

  const nohdFinite = Number.isFinite(nohd.distance) && nohd.distance > 0;
  const rMin = nohdFinite ? Math.max(nohd.distance * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(nohd.distance * 10, rMin * 10) : 1000;
  const ratios = useCallback(
    (r: number) => limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, effectiveDiameterAt(beam, r), t) })),
    [limits, P, beam, t],
  );
  const markers = useMemo(() => (nohdFinite ? [{ r: nohd.distance, label: "NOHD" }] : []), [nohdFinite, nohd.distance]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the emitting aperture, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Slow-axis divergence, full angle (mrad)" value={divergenceH} onChange={setDivergenceH} min={0} step="any" />
        <ValidatedNumberInput label="Fast-axis divergence, full angle (mrad)" value={divergenceV} onChange={setDivergenceV} min={0} step="any" />
        <div>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Divergences are quoted at</span>
            <select
              value={fwhm ? "fwhm" : "1/e2"}
              onChange={(e) => setAngleDefinition(e.target.value)}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="1/e2">1/e² intensity</option>
              <option value="fwhm">FWHM (half maximum)</option>
            </select>
          </label>
          <p className="text-xs text-gray-500 mt-2">Diode data sheets usually quote FWHM, 1.7× narrower than the 1/e² angle.</p>
        </div>
        <div>
          <ValidatedNumberInput label="Exposure time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
          <p className="text-xs text-gray-500 mt-2">
            0.25 s (the blink reflex) only protects for visible beams; 10 s is the usual assumption for unintended viewing
            of near-IR (ANSI Z136.1).
          </p>
        </div>
      </div>

      {valid ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard label="NOHD" value={nohdText} tone="red" />
            <ResultCard label="Governing limit" value={nohd.limiting ? LIMIT_LABELS[nohd.limiting] : "None exceeded"} tone="yellow" />
            <ResultCard label="Beam size at the NOHD, slow × fast (1/e²)" value={sizeAtNohd} tone="orange" />
            <ResultCard
              label="Optical density needed at the aperture"
              value={`OD ${od.od.toFixed(2)}`}
              tone="purple"
              subtext={od.limiting ? `Set by: ${LIMIT_LABELS[od.limiting]}` : "No eyewear needed"}
            />
            <ResultCard label="Peak irradiance at the aperture" value={`${fmtNum(peakIrradiance)} W/cm²`} tone="blue" />
          </div>

          <div className="overflow-x-auto mb-4">
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
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        An elliptical beam counts as the round beam with the same peak irradiance, of diameter √(d<sub>slow</sub>{" "}
        d<sub>fast</sub>), each axis growing as a + rφ (ANSI Z136.1, IEC TR 60825-14). The limits are ICNIRP 2013
        (Health Phys. 105:271) at any wavelength, for one exposure of up to t, averaged over each limit&apos;s aperture.
        A bare bar or stack seen up close is an extended source whose larger retinal image raises the limit; that is not
        modelled, so these are the conservative point-source values. Collimating optics change a and φ: enter the
        values after them.
      </p>

      {valid && P > 0 ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Exposure over limit for each eye limit against distance from the emitter. The beam is within the limits
            where every line is below the dashed line; the marker is the NOHD.
          </p>
        </div>
      ) : null}
    </>
  );
}
