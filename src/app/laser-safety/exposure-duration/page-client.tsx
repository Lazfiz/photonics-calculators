"use client";

import { useMemo } from "react";
import ExposureTimeChart from "../../../components/exposure-time-chart";
import { fmtNum, fmtTime, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exposureDuration } from "../../../physics/laser-safety/eye-exposure-limits";

export default function ExposureDurationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [power, setPower] = useURLState("power", 100); // mW
  const [beamDiameter, setBeamDiameter] = useURLState("beamDiameter", 3); // mm, 1/e²

  // ICNIRP 2013 point-source eye limits: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const P = power * 1e-3;
  const d = beamDiameter * 1e-3;
  const result = useMemo(() => exposureDuration(lambda, P, d), [lambda, P, d]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0.001} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.01} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Safe Exposure Time</p>
          <p className="text-2xl font-bold text-green-400">{fmtTime(result.tMax)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Limited by</p>
          <p className="text-2xl font-bold text-yellow-400">
            {result.limiting ? LIMIT_LABELS[result.limiting] : "No limit reached in 30 000 s"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2 pr-4 font-normal">Limit</th>
              <th className="py-2 pr-4 font-normal">Max time</th>
              <th className="py-2 pr-4 font-normal">Aperture (mm)</th>
              <th className="py-2 pr-4 font-normal">Beam irradiance over it (W/m²)</th>
              <th className="py-2 font-normal">Limit (J/m²)</th>
            </tr>
          </thead>
          <tbody>
            {result.limits.map((l) => (
              <tr key={l.kind} className="border-b border-gray-900">
                <td className="py-2 pr-4">{LIMIT_LABELS[l.kind]}</td>
                <td className="py-2 pr-4">{fmtTime(l.tMax)}</td>
                <td className="py-2 pr-4">{(l.aperture * 1e3).toFixed(2)}</td>
                <td className="py-2 pr-4">{fmtNum(l.irradiance)}</td>
                <td className="py-2">{fmtNum(l.limit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">
          Aperture, irradiance and limit are at the limit&apos;s max time (at 30 000 s if it isn&apos;t reached).
        </p>
      </div>

      <p className="text-sm text-gray-400 mb-8">
        Exposure limits for the eye from ICNIRP 2013 (Health Phys. 105:271, Tables 3, 5, 7 and 8) for a point source
        (intrabeam viewing of a collimated beam, C_E = 1) and a CW exposure of 1 ns to 30 000 s. From 10 s on, the UV
        limits equal the EU limit values (Directive 2006/25/EC, Annex II, Table 2.3). The beam is a round Gaussian, centred, and its
        power is averaged over the limiting aperture: 7 mm for the retina; 1 mm, growing to 3.5 mm at 10 s, in the UV and
        from 1.4 µm to 100 µm; 11 mm beyond. A smaller pupil does not raise the limits. From 400 to 600 nm the thermal
        and the photochemical limits both apply; from 400 to 1400 nm the skin limit (twice it from 700 nm) protects
        the cornea and lens, which matters only from 1150 nm, where C_C raises the retinal limit. Not covered: pulses,
        extended sources, and beams under 1 mm, for which ICNIRP advises using the actual irradiance rather than the
        aperture average.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ExposureTimeChart lambda={lambda} P={P} d={d} />
        <p className="text-xs text-gray-500 mt-2">
          Each limit as an irradiance, H(t)/t, and the beam irradiance over that limit&apos;s aperture. The beam is safe
          up to the first crossing.
        </p>
      </div>
    </>
  );
}
