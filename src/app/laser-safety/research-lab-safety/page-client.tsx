"use client";

import { useCallback, useMemo } from "react";
import { CLASS_TONES, fmtDistance, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { eyeLimits, limitMaxPower, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import {
  diffuseHazardDistance, effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../../physics/laser-safety/hazard-distance";
import { classifyCw } from "../../../physics/laser-safety/laser-classes";
import { peakIrradiance } from "../../../physics/laser-safety/visual-interference";

export default function ResearchLabSafetyPage() {
  const [power, setPower] = useURLState("power", 500); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 780); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 1.5); // mm, 1/e² at the output
  const [divergence, setDivergence] = useURLState("divergence", 1.5); // mrad, 1/e² full angle
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s
  const [labLength, setLabLength] = useURLState("labLength", 5); // m
  const [labWidth, setLabWidth] = useURLState("labWidth", 4); // m

  // SI inside. Class: laser-classes.ts; NOHD, OD, diffuse reflection: hazard-distance.ts (ICNIRP 2013 eye limits).
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const d = Math.max(beamDia, 1e-3) * 1e-3;
  const phi = Math.max(divergence, 0) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);
  const diagonal = Math.hypot(Math.max(labLength, 0), Math.max(labWidth, 0));

  const beam = useMemo(() => roundBeam(d, phi), [d, phi]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const cls = useMemo(() => classifyCw(lambda, P, { d, phi }), [lambda, P, d, phi]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, t), [lambda, P, beam, t]);
  const od = useMemo(() => requiredOpticalDensity(lambda, P, d, t), [lambda, P, d, t]);
  // A white wall (ρ = 1) lit by the beam at the output size: the worst diffuse reflection.
  const diffuse = useMemo(() => diffuseHazardDistance(lambda, P, d, t), [lambda, P, d, t]);
  const dWall = effectiveDiameterAt(beam, diagonal);
  const valid = limits.length > 0 && cls.laserClass !== null && !Number.isNaN(nohd.distance);

  const nohdFinite = Number.isFinite(nohd.distance) && nohd.distance > 0;
  const rMin = 0.01;
  const rMax = Math.max(nohdFinite ? nohd.distance * 3 : 0, diagonal * 3, 1);
  const ratios = useCallback(
    (r: number) => limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, effectiveDiameterAt(beam, r), t) })),
    [limits, P, beam, t],
  );
  const markers = useMemo(() => {
    const atWall = diagonal > 0 ? Math.max(...ratios(diagonal).map((x) => x.ratio)) : NaN;
    return [
      ...(nohdFinite ? [{ r: nohd.distance, label: "NOHD" }] : []),
      ...(Number.isFinite(atWall) && atWall > 0 ? [{ r: diagonal, y: atWall, label: "Room diagonal" }] : []),
    ];
  }, [nohdFinite, nohd.distance, diagonal, ratios]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="CW power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the output, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <div>
          <ValidatedNumberInput label="Eye exposure time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
          <p className="text-xs text-gray-500 mt-2">10 s for an accidental view of an invisible beam (ANSI Z136.1); 0.25 s only for visible beams.</p>
        </div>
        <ValidatedNumberInput label="Lab length (m)" value={labLength} onChange={setLabLength} min={0} step="any" />
        <ValidatedNumberInput label="Lab width (m)" value={labWidth} onChange={setLabWidth} min={0} step="any" />
      </div>

      {valid && cls.laserClass ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard label="Class (IEC 60825-1:2014)" value={`Class ${cls.laserClass}`} tone={CLASS_TONES[cls.laserClass]} />
            <ResultCard
              label="NOHD, direct beam"
              value={nohd.distance === 0 ? "0 — within the limit at the output" : fmtDistance(nohd.distance)}
              subtext={nohd.limiting ? LIMIT_LABELS[nohd.limiting] : undefined}
              tone="red"
            />
            <ResultCard
              label="Eyewear optical density"
              value={`OD ${od.od.toFixed(2)}`}
              subtext={od.od > 0 ? `for the ${fmtNum(d * 1e3)} mm beam; round up` : "none needed"}
              tone="purple"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <ResultCard
              label="Direct beam across the room"
              value={nohd.distance > diagonal ? "Hazardous at every wall" : "Safe before the walls"}
              subtext={`room diagonal ${fmtDistance(diagonal)}; beam ${fmtNum(dWall * 1e3)} mm, ${fmtNum(peakIrradiance(P, dWall) / 1e4)} W/cm² peak there`}
              tone={nohd.distance > diagonal ? "red" : "green"}
            />
            <ResultCard
              label="Diffuse reflection hazard, white wall"
              value={diffuse.distance === 0 ? "none" : fmtDistance(diffuse.distance)}
              subtext={diffuse.distance > 0 ? "viewing the spot closer than this exceeds the limit" : "the spot is safe to view at any distance"}
              tone="orange"
            />
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-8">The eye limits cover 180 nm to 1 mm.</p>
      )}

      {valid && P > 0 ? <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} /> : null}
      <p className="text-xs text-gray-500 mt-2 mb-6">
        Direct-beam exposure over each eye limit against distance (log scales); above 1 the limit is exceeded.
      </p>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Class: IEC 60825-1:2014 for a CW beam (naked eye and binoculars). NOHD: the distance beyond which the direct
          beam stays within the ICNIRP 2013 eye limits for the exposure time, averaged over each limit&apos;s aperture,
          with the beam spreading as d + rφ (ANSI Z136.1, IEC TR 60825-14). If it exceeds the room diagonal, the
          nominal hazard zone is the whole room wherever the beam can go, including after a specular reflection
          (mirrors, windows, optics), which keeps the beam&apos;s hazard.
        </p>
        <p>
          The optical density brings the whole output beam within every limit (OD = log₁₀ of the exposure over the
          limit); the filter must also survive the beam (EN 207). The diffuse reflection is a white (Lambertian, ρ = 1)
          surface lit by the beam at its output size: a larger spot is a larger, safer extended source. Class 3B and 4
          lasers need a laser safety officer, controlled area, interlocks and eyewear (IEC TR 60825-14, ANSI Z136.1).
          Not modelled: pulses, several beams at once (each beam has its own NOHD; they add only where they overlap),
          the skin.
        </p>
      </div>
    </>
  );
}
