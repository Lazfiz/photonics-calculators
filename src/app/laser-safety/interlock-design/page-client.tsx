"use client";

import { useMemo } from "react";
import ExposureTimeChart from "../../../components/exposure-time-chart";
import { fmtDistance, fmtTime, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { interlockTiming } from "../../../physics/laser-safety/interlock";

export default function InterlockDesignPage() {
  const [laserPower, setLaserPower] = useURLState("laserPower", 5000, { min: 0 }); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 1064, { min: 180, max: 1000000 }); // nm
  const [beamDiamRaw, setBeamDiam] = useURLState("beamDiam", 5, { min: 0 }); // mm, 1/e² where the beam can be reached
  const [stopTimeRaw, setStopTime] = useURLState("shutterTime", 50, { min: 0 }); // ms, guard opening → emission off
  const [distanceRaw, setDistance] = useURLState("accessDistance", 50, { min: 0 }); // cm, opening → beam
  const [speedRaw, setSpeed] = useURLState("approachSpeed", 2, { min: 0.01 }); // m/s

  // URL values aren't range-checked: clamp them here. SI inside; physics in src/physics/laser-safety/interlock.ts.
  const lambda = wavelength * 1e-9;
  const P = Math.max(laserPower, 0) * 1e-3;
  const d = Math.max(beamDiamRaw, 0) * 1e-3;
  const T = Math.max(stopTimeRaw, 0) * 1e-3;
  const S = Math.max(distanceRaw, 0) * 1e-2;
  const K = Math.max(speedRaw, 0.01);
  const r = useMemo(() => interlockTiming(lambda, P, d, T, S, K), [lambda, P, d, T, S, K]);
  const covered = !Number.isNaN(r.accessTime);
  const marks = useMemo(
    () => (r.exposure > 0 ? [{ t: r.exposure, name: "Time in the beam before the stop", color: "#e5e7eb" }] : []),
    [r.exposure],
  );
  const limitName = r.limiting ? LIMIT_LABELS[r.limiting] : "";

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser power (mW)" value={laserPower} onChange={setLaserPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter where it can be reached, 1/e² (mm)" value={beamDiamRaw} onChange={setBeamDiam} min={0} step="any" />
        <ValidatedNumberInput label="Stopping time: guard opens → emission off (ms)" value={stopTimeRaw} onChange={setStopTime} min={0} step="any" />
        <ValidatedNumberInput label="Distance from the opening to the beam (cm)" value={distanceRaw} onChange={setDistance} min={0} step="any" />
        <ValidatedNumberInput label="Approach speed (m/s)" value={speedRaw} onChange={setSpeed} min={0.01} step="any" />
      </div>

      {!covered ? (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      ) : (
        <>
          <div className={`bg-gray-900 border rounded-lg p-6 mb-6 ${r.within ? "border-green-700" : "border-red-700"}`}>
            <p className="text-sm text-gray-400">Interlock timing</p>
            <p className={`text-2xl font-bold ${r.within ? "text-green-400" : "text-red-400"}`}>
              {r.within ? (r.exposure > 0 ? "Fast enough, with an exposure within the limit" : "Fast enough: the emission stops before anyone reaches the beam") : "Too slow"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {r.tMax === Infinity
                ? "This beam stays within the eye limits for 30 000 s: the eye needs no interlock (skin and reflections aside)."
                : r.exposure > 0
                  ? `An eye can be in the beam for ${fmtTime(r.exposure)} before the emission stops; the limit is reached after ${fmtTime(r.tMax)}.`
                  : `A hand or eye reaches the beam after ${fmtTime(r.accessTime)}; the emission stops after ${fmtTime(T)}.`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <ResultCard
              label="Limit reached after (beam held on the eye)"
              value={fmtTime(r.tMax)}
              tone={r.tMax === Infinity ? "green" : "red"}
              subtext={limitName}
            />
            <ResultCard label="Time to reach the beam (S/K)" value={fmtTime(r.accessTime)} tone="blue" subtext={`${fmtDistance(S)} at ${K} m/s`} />
            <ResultCard
              label="Longest stopping time"
              value={r.latestStop === Infinity ? "any" : fmtTime(r.latestStop)}
              tone={r.within ? "green" : "red"}
              subtext={`S/K + t_max; yours is ${fmtTime(T)}`}
            />
            <ResultCard
              label="Shortest distance for your stopping time"
              value={fmtDistance(r.minDistance)}
              tone="cyan"
              subtext="K × (T − t_max), ISO 13855 without an intrusion allowance"
            />
          </div>
        </>
      )}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          An interlocked guard has to stop the emission before anyone who opens it can put an eye in the beam for longer
          than the eye limits allow. From the moment the guard starts to open, a person moving at the approach speed K
          reaches a beam S behind the opening after S/K; the emission stops after the stopping time T (sensor, logic and
          shutter or laser shut-down). The eye is then in the beam for T − S/K at most, which must not exceed t_max, the
          time the beam takes to exceed the first ICNIRP 2013 eye limit when held on the eye (retina over 7 mm, cornea
          over 1–3.5 mm; a round Gaussian beam centred on the pupil, the worst case).
        </p>
        <p>
          ISO 13855 uses K = 2.0 m/s for hands and arms and 1.6 m/s for the body, and adds an intrusion allowance C for
          sensing devices such as light curtains (S = K·T + C). In the retinal hazard region (400–1400 nm) t_max is
          nanoseconds to microseconds, so the shutter has to close before the beam can be reached: T ≤ S/K. In the mid
          and far infrared t_max can be milliseconds to seconds. Not modelled: reflections inside
          the enclosure, the skin, the interlock&apos;s reliability (ISO 13849 performance level) and IEC 60825-1&apos;s
          rule that a Class 3B or 4 product&apos;s interlocks prevent access to radiation above the Class 1 limits.
        </p>
      </div>

      {covered ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <ExposureTimeChart lambda={lambda} P={P} d={d} marks={marks} />
          <p className="text-xs text-gray-500 mt-2">
            Each eye limit as an irradiance, H(t)/t, and the beam irradiance over that limit&apos;s aperture: the beam is
            within the limits up to the first crossing (t_max). The diamond marks the time an eye spends in the beam before
            the emission stops.
          </p>
        </div>
      ) : null}
    </>
  );
}
