"use client";

import { useCallback, useMemo } from "react";
import { fmtDistance, fmtNum, fmtTime, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { eyeLimits, limitMaxPower, T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam } from "../../../physics/laser-safety/hazard-distance";
import {
  diffractionLimitedSpot, focusedDivergence, thermalRelaxationTime, TISSUE_DIFFUSIVITY, type TargetShape,
} from "../../../physics/laser-safety/surgical-laser";

const SHAPES: Record<TargetShape, string> = {
  cylinder: "Cylinder (vessel, hair shaft)",
  sphere: "Sphere (melanosome, cell)",
  layer: "Layer (heated depth)",
};

export default function MedicalLaserSafetyPage() {
  const [power, setPower] = useURLState("power", 10000); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 10600); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 8); // mm, 1/e² on the focusing lens
  const [focalLength, setFocalLength] = useURLState("focalLength", 100); // mm
  const [spotSize, setSpotSize] = useURLState("spotSize", 0.2); // mm, 1/e² at the focus
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 0.1); // s, pulse or dwell on tissue
  const [targetSize, setTargetSize] = useURLState("targetSize", 100); // µm
  const [targetShape, setTargetShape] = useURLState("targetShape", "cylinder");
  const [eyeExposure, setEyeExposure] = useURLState("eyeExposure", 10); // s

  // SI inside. Eye limits: ICNIRP 2013 (eye-exposure-limits.ts); beam: surgical-laser.ts and hazard-distance.ts.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const b0 = Math.max(beamDia, 1e-3) * 1e-3;
  const f = Math.max(focalLength, 1) * 1e-3;
  const spot = Math.max(spotSize, 1e-4) * 1e-3;
  const tTissue = Math.max(exposureTime, 0);
  const tEye = Math.min(Math.max(eyeExposure, T_MIN), T_MAX);
  const shape: TargetShape = targetShape in SHAPES ? (targetShape as TargetShape) : "cylinder";

  // Tissue side: power density over the 1/e² spot (the clinical P/A), fluence, thermal relaxation of the target.
  const powerDensity = P / ((Math.PI * spot * spot) / 4) / 1e4; // W/cm²
  const fluence = powerDensity * tTissue; // J/cm²
  const trt = thermalRelaxationTime(Math.max(targetSize, 0) * 1e-6, shape);
  const minSpot = diffractionLimitedSpot(lambda, b0, f);

  // Eye side: the beam spreads beyond the focus at b₀/f; OD for the beam at its narrowest (the focus) and on the lens.
  const phi = focusedDivergence(b0, f);
  const beam = useMemo(() => roundBeam(spot, phi), [spot, phi]);
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, tEye), [lambda, P, beam, tEye]);
  const odFocus = useMemo(() => requiredOpticalDensity(lambda, P, spot, tEye), [lambda, P, spot, tEye]);
  const odLens = useMemo(() => requiredOpticalDensity(lambda, P, b0, tEye), [lambda, P, b0, tEye]);
  const valid = limits.length > 0 && !Number.isNaN(nohd.distance) && !Number.isNaN(odFocus.od);

  const nohdFinite = Number.isFinite(nohd.distance) && nohd.distance > 0;
  const rMin = nohdFinite ? Math.max(nohd.distance * 1e-3, 1e-3) : 1e-3;
  const rMax = nohdFinite ? Math.max(nohd.distance * 10, rMin * 10) : 100;
  const ratios = useCallback(
    (r: number) => limits.map((limit) => ({ kind: limit.kind, ratio: P / limitMaxPower(limit, effectiveDiameterAt(beam, r), tEye) })),
    [limits, P, beam, tEye],
  );
  const markers = useMemo(() => (nohdFinite ? [{ r: nohd.distance, label: "NOHD" }] : []), [nohdFinite, nohd.distance]);

  const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";
  return (
    <>
      <LaserSafetyDisclaimer />
      <h2 className="text-lg font-semibold text-gray-200 mb-3">Laser and handpiece</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter on the focusing lens, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Focal length of the handpiece (mm)" value={focalLength} onChange={setFocalLength} min={1} step="any" />
        <div>
          <ValidatedNumberInput label="Spot diameter at the focus, 1/e² (mm)" value={spotSize} onChange={setSpotSize} min={0.0001} step="any" />
          {spot < minSpot * (1 - 1e-9) ? (
            <p className="text-xs text-amber-300 mt-2">
              Smaller than the diffraction limit 4λf/(πb₀) = {fmtNum(minSpot * 1e3)} mm of this beam and lens.
            </p>
          ) : null}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-200 mb-3">Tissue</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Pulse or dwell time on tissue (s)" value={exposureTime} onChange={setExposureTime} min={0} step="any" />
        <ValidatedNumberInput label="Target size (µm)" value={targetSize} onChange={setTargetSize} min={0} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Target shape</span>
          <select value={shape} onChange={(e) => setTargetShape(e.target.value)} className={selectClass}>
            {(Object.keys(SHAPES) as TargetShape[]).map((k) => (
              <option key={k} value={k}>
                {SHAPES[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Power density at the spot, P/(πd²/4)" value={`${fmtNum(powerDensity)} W/cm²`} tone="red" />
        <ResultCard label="Fluence per pulse or dwell" value={`${fmtNum(fluence)} J/cm²`} tone="yellow" />
        <ResultCard
          label="Thermal relaxation time of the target"
          value={fmtTime(trt)}
          tone="orange"
          subtext={
            tTissue <= trt
              ? "Pulse within it: the heat stays in the target"
              : "Pulse longer: heat spreads beyond the target"
          }
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-200 mb-3">Eyes of the staff</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div>
          <ValidatedNumberInput label="Eye exposure time (s)" value={eyeExposure} onChange={setEyeExposure} min={1e-9} max={30000} step="any" />
          <p className="text-xs text-gray-500 mt-2">
            10 s for an accidental view of an invisible beam (ANSI Z136.1); 0.25 s only for visible beams.
          </p>
        </div>
      </div>
      {valid ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <ResultCard
            label="NOHD beyond the focus"
            value={nohd.distance === 0 ? "0 — within the limits at the focus" : fmtDistance(nohd.distance)}
            tone="red"
            subtext={`Beam spreads at ${fmtNum(phi * 1e3)} mrad (b₀/f)`}
          />
          <ResultCard label="Governing limit" value={nohd.limiting ? LIMIT_LABELS[nohd.limiting] : "None exceeded"} tone="yellow" />
          <ResultCard
            label="Eyewear optical density"
            value={`OD ${odFocus.od.toFixed(2)}`}
            tone="purple"
            subtext={`For the beam at its focus (all of it inside the aperture); OD ${odLens.od.toFixed(2)} for the ${fmtNum(b0 * 1e3)} mm beam at the lens`}
          />
        </div>
      ) : (
        <p className="text-amber-300 mb-6">The eye limits cover 180 nm to 1 mm.</p>
      )}

      {valid && P > 0 ? (
        <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
      ) : null}
      <p className="text-xs text-gray-500 mt-2 mb-6">
        Exposure over each eye limit against distance beyond the focus (log scales); above 1 the limit is exceeded.
      </p>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Tissue: the power density is the clinical P/A over the 1/e² spot (the peak of a Gaussian spot is twice it). The
          thermal relaxation time is the time for the centre temperature of a target of size d to halve (selective
          photothermolysis, Anderson &amp; Parrish 1983): d²/(16κ) for a cylinder, d²/(27κ) for a sphere, 3d²/(16κ) for
          a layer, with κ = {fmtNum(TISSUE_DIFFUSIVITY * 1e6)} mm²/s for soft tissue.
        </p>
        <p>
          Eyes: beyond the focus the beam spreads at b₀/f, so the hazard distance is the standards&apos;
          lens-on-laser value (f/b₀)√(4P/(πE)) (ANSI Z136.1 App. B, ANSI Z136.3), here on the ICNIRP 2013 limits for
          an exposure of up to t, averaged over each limit&apos;s aperture. The optical density brings the whole beam
          within every limit; the filter must also survive the beam (EN 207). Not modelled: bare fibres (use the fiber
          laser page), specular reflections from instruments, pulses, the skin.
        </p>
      </div>
    </>
  );
}
