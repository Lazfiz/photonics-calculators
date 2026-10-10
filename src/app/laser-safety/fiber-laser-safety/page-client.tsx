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
  effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../../physics/laser-safety/hazard-distance";

export default function FiberLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 1000); // mW launched into the fiber
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [fiberCoreDia, setFiberCoreDia] = useURLState("fiberCoreDia", 10); // µm, 1/e² beam diameter at the fiber end
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // m
  const [attenuation, setAttenuation] = useURLState("attenuation", 0.2); // dB/km
  const [na, setNa] = useURLState("na", 0.12); // multimode
  const [fiberType, setFiberType] = useURLState("fiberType", "single"); // "single" | "multi"
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s
  const [viewingDistance, setViewingDistance] = useURLState("viewingDistance", 0.1); // m

  // ICNIRP 2013 eye limits and the beam model: src/physics/laser-safety/hazard-distance.ts. SI inside.
  const multimode = fiberType === "multi";
  const lambda = wavelength * 1e-9;
  const d = Math.max(fiberCoreDia, 1) * 1e-6;
  const lossDb = (Math.max(attenuation, 0) * Math.max(fiberLength, 0)) / 1000;
  const P = Math.max(power, 0) * 1e-3 * Math.pow(10, -lossDb / 10); // W out of the fiber
  const NA = Math.min(Math.max(na, 0), 0.99);
  const rView = Math.max(viewingDistance, 0);
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  // 1/e² full-angle divergence: a TEM₀₀ mode diffracting from its waist w₀ = d/2, or the output filling the NA.
  const phi = multimode ? 2 * Math.tan(Math.asin(NA)) : (2 * lambda) / (Math.PI * (d / 2));
  const equivalentNA = Math.sin(Math.min(phi / 2, Math.PI / 2));

  const beam = useMemo(() => roundBeam(d, phi, "gaussian"), [d, phi]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, t), [lambda, P, beam, t]);
  const od = useMemo(() => requiredOpticalDensity(lambda, P, effectiveDiameterAt(beam, rView), t), [lambda, P, beam, rView, t]);
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

  const nohdText = nohd.distance === 0 ? "0 — within the limits at the fiber end" : fmtDistance(nohd.distance);
  const peakIrradiance = (8 * P) / (Math.PI * d * d) / 1e4; // W/cm² at the fiber end

  const nohdFinite = Number.isFinite(nohd.distance) && nohd.distance > 0;
  const rMin = nohdFinite ? Math.max(nohd.distance * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(nohd.distance * 10, rMin * 10) : 1000;
  const ratios = useCallback(
    (r: number) => limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, effectiveDiameterAt(beam, r), t) })),
    [limits, P, beam, t],
  );
  const markers = useMemo(() => {
    const list: { r: number; y?: number; label: string }[] = [];
    if (nohdFinite) list.push({ r: nohd.distance, label: "NOHD" });
    const viewRatio = Math.max(...ratios(rView).map((x) => x.ratio));
    if (rView > 0 && Number.isFinite(viewRatio) && viewRatio > 0) list.push({ r: rView, y: viewRatio, label: "Viewing distance" });
    return list;
  }, [nohdFinite, nohd.distance, ratios, rView]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Launched power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Mode-field / core diameter (µm)" value={fiberCoreDia} onChange={setFiberCoreDia} min={1} step="any" />
        <ValidatedNumberInput label="Fiber length (m)" value={fiberLength} onChange={setFiberLength} min={0} step="any" />
        <ValidatedNumberInput label="Attenuation (dB/km)" value={attenuation} onChange={setAttenuation} min={0} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber type</span>
          <select
            value={multimode ? "multi" : "single"}
            onChange={(e) => setFiberType(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="single">Single-mode</option>
            <option value="multi">Multimode</option>
          </select>
        </label>
        {multimode ? (
          <ValidatedNumberInput label="Numerical aperture (NA)" value={na} onChange={setNa} min={0} max={0.99} step="any" />
        ) : null}
        <ValidatedNumberInput label="Exposure time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
        <div>
          <ValidatedNumberInput label="Viewing distance (m)" value={viewingDistance} onChange={setViewingDistance} min={0} step="any" />
          <p className="text-xs text-gray-500 mt-2">
            100 mm is the closest distance at which the eye focuses (IEC 60825-1 measurement condition 3).
          </p>
        </div>
      </div>

      {valid ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard label="Output power" value={fmtPower(P)} tone="blue" subtext={`Fiber loss: ${lossDb.toPrecision(3)} dB`} />
            <ResultCard label="NOHD" value={nohdText} tone="red" />
            <ResultCard label="Governing limit" value={nohd.limiting ? LIMIT_LABELS[nohd.limiting] : "None exceeded"} tone="yellow" />
            <ResultCard
              label="Beam divergence, 1/e² full angle"
              value={`${(phi * 1e3).toPrecision(4)} mrad`}
              tone="orange"
              subtext={multimode ? "2 tan(asin NA)" : `2λ / (π w₀); equivalent NA = ${equivalentNA.toPrecision(3)}`}
            />
            <ResultCard label="Peak irradiance at the fiber end" value={`${fmtNum(peakIrradiance)} W/cm²`} tone="red" />
            <ResultCard
              label={`Optical density needed at ${fmtDistance(rView)}`}
              value={`OD ${od.od.toFixed(2)}`}
              tone="purple"
              subtext={od.limiting ? `Set by: ${LIMIT_LABELS[od.limiting]}` : "No eyewear needed"}
            />
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
        A bare fiber end is a Gaussian beam with its waist at the end face, so its diameter at range r is √(d² + (rφ)²).
        Single-mode: the mode diffracts at the half-angle λ/(πw₀). Multimode: the beam fills the NA (real profiles are not
        Gaussian, and NA is sometimes quoted at 5 % rather than 1/e²). The limits are ICNIRP 2013 (Health Phys. 105:271)
        at any wavelength, for one exposure of up to t, averaged over each limit&apos;s aperture. The fiber core seen from
        100 mm is far below 1.5 mrad, so it is a point source. Connectors, splices and lensed or collimated outputs change
        the beam.
      </p>

      {valid && P > 0 ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Exposure over limit for each eye limit against distance from the fiber end. The beam is within the limits
            where every line is below the dashed line; the markers are the NOHD and the viewing distance.
          </p>
        </div>
      ) : null}
    </>
  );
}
