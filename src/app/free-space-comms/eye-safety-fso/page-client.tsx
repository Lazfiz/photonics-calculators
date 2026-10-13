"use client";

import { useCallback, useMemo } from "react";
import { CLASS_TONES, fmtDistance, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { eyeLimits, limitMaxPower, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, nominalOcularHazardDistance, roundBeam } from "../../../physics/laser-safety/hazard-distance";
import { classifyCw } from "../../../physics/laser-safety/laser-classes";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const PRESETS: readonly [string, number, number][] = [["1550 nm, 100 mW", 1550, 100], ["850 nm, 10 mW", 850, 10], ["1064 nm, 50 mW", 1064, 50]];

export default function EyeSafetyFsoPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [powerRaw, setTxPower] = useURLState("txPower", 100); // mW
  const [apertureRaw, setAperture] = useURLState("beamDia", 10); // mm, 1/e² at the transmitter
  const [divergenceRaw, setBeamDivergence] = useURLState("beamDivergence", 0.5); // mrad, 1/e² full angle
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", 10); // s
  const [distanceRaw, setDistance] = useURLState("distance", 2); // m

  // URL values aren't range-checked: clamp them before the physics.
  const wavelength = clamp(wavelengthRaw, 180, 1e6);
  const power = clamp(powerRaw, 0, 1e7);
  const aperture = clamp(apertureRaw, 0, 1000);
  const divergence = clamp(divergenceRaw, 0, 1000);
  const exposure = clamp(exposureRaw, T_MIN, T_MAX);
  const distance = clamp(distanceRaw, 0, 1e6);

  // ICNIRP 2013 eye limits, aperture-averaged Gaussian beam: src/physics/laser-safety/*. SI inside.
  const lambda = wavelength * 1e-9;
  const P = power * 1e-3;
  const d = aperture * 1e-3;
  const phi = divergence * 1e-3;

  const beam = useMemo(() => roundBeam(d, phi), [d, phi]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, exposure), [lambda, P, beam, exposure]);
  const laserClass = useMemo(() => classifyCw(lambda, P, { d, phi }).laserClass, [lambda, P, d, phi]);

  const atRange = useMemo(() => {
    const dr = effectiveDiameterAt(beam, distance);
    const perLimit = limits.map((limit) => ({ kind: limit.kind, pMax: limitMaxPower(limit, dr, exposure) }));
    const worst = perLimit.reduce<(typeof perLimit)[number] | null>((w, l) => (w === null || l.pMax < w.pMax ? l : w), null);
    return { dr, worst, margin: worst && P > 0 ? worst.pMax / P : Infinity };
  }, [beam, distance, limits, exposure, P]);

  const ratios = useCallback(
    (r: number) => {
      const dr = effectiveDiameterAt(beam, r);
      return limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, dr, exposure) }));
    },
    [beam, limits, P, exposure],
  );
  const nohdFinite = Number.isFinite(nohd.distance) && nohd.distance > 0;
  const rMin = nohdFinite ? Math.max(nohd.distance * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(nohd.distance * 10, rMin * 10) : 1000;
  const markers = useMemo(() => {
    const m: { r: number; y?: number; label: string }[] = nohdFinite ? [{ r: nohd.distance, label: "NOHD" }] : [];
    const ratio = atRange.margin > 0 ? 1 / atRange.margin : NaN;
    if (distance > 0 && Number.isFinite(ratio) && ratio > 0) m.push({ r: distance, y: ratio, label: "Check distance" });
    return m;
  }, [nohdFinite, nohd.distance, atRange.margin, distance]);

  const valid = !Number.isNaN(nohd.distance);
  const safe = atRange.margin >= 1;

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Transmitter</h2>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={180} max={1e6} step="any" />
          <ValidatedNumberInput label="TX Power (mW)" value={powerRaw} onChange={setTxPower} min={0} max={1e7} step="any" />
          <ValidatedNumberInput label="Beam Diameter at Aperture (mm, 1/e²)" value={apertureRaw} onChange={setAperture} min={0} max={1000} step="any" />
          <ValidatedNumberInput label="Beam Divergence (mrad, 1/e² full angle)" value={divergenceRaw} onChange={setBeamDivergence} min={0} max={1000} step="any" />
          <ValidatedNumberInput label="Exposure Time (s)" value={exposureRaw} onChange={setExposureTime} min={T_MIN} max={T_MAX} step="any" />
          <ValidatedNumberInput label="Check Distance (m)" value={distanceRaw} onChange={setDistance} min={0} max={1e6} step="any" />
          <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-800">
            {PRESETS.map(([name, w, p]) => (
              <button key={name} type="button" onClick={() => { setWavelength(w); setTxPower(p); }}
                className="bg-gray-800 hover:bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">{name}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {valid ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultCard label="NOHD" value={fmtDistance(nohd.distance)} tone="cyan"
                subtext={nohd.limiting ? `set by the ${LIMIT_LABELS[nohd.limiting]} limit` : "within every limit at the aperture"} />
              <ResultCard label="Laser class (IEC 60825-1)" value={laserClass ? `Class ${laserClass}` : "—"}
                tone={laserClass ? CLASS_TONES[laserClass] : "gray"} subtext="CW, Conditions 1 and 3" />
              <ResultCard label={`Margin at ${fmtNum(distance)} m`} value={Number.isFinite(atRange.margin) ? `${fmtNum(atRange.margin)}×` : "∞"}
                tone={safe ? "green" : "red"}
                subtext={atRange.worst ? `${safe ? "within" : "exceeds"} the ${LIMIT_LABELS[atRange.worst.kind]} limit; P_max ${fmtPower(atRange.worst.pMax)}` : undefined} />
              <ResultCard label={`Beam Ø at ${fmtNum(distance)} m`} value={`${fmtNum(atRange.dr * 1e3)} mm`} tone="gray" subtext="1/e², a + rφ" />
            </div>
          ) : (
            <p className="text-sm text-red-400">The eye limits are defined from 180 nm to 1 mm.</p>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-400 space-y-1">
            <p>Limits: ICNIRP 2013 eye exposure limits, the irradiance averaged over each limit&apos;s aperture (7 mm retinal, 3.5 mm or larger corneal).</p>
            <p>Margin = largest power within every limit at that distance ÷ TX power; below 1 the exposure exceeds a limit.</p>
            <p>NOHD: the distance where the Gaussian beam, growing as a + rφ, falls within every limit for exposures up to t.</p>
            <p>Not modelled: atmospheric attenuation (which only shortens the NOHD), binoculars or telescopes, scintillation hot spots, pulsed modulation.</p>
          </div>
          {valid && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
