"use client";

import { useCallback, useMemo } from "react";
import { fmtDistance, fmtEnergy, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import PulseTrainTable from "../../../components/pulse-train-table";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX } from "../../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, rangeToDiameter, roundBeam } from "../../../physics/laser-safety/hazard-distance";
import { pulseTrainLimits, pulseTrainSafeDiameter } from "../../../physics/laser-safety/pulse-train";

const RULE_NAMES = { 1: "single pulse", 2: "average power", 3: "C_P × single pulse" } as const;
const presets: readonly [number, string][] = [[905, "905 nm diode"], [1550, "1550 nm fibre"]];

export default function LidarSafetyPage() {
  const [pulseEnergyRaw, setPulseEnergy] = useURLState("pulseEnergy", 10); // µJ
  const [repRateRaw, setRepRate] = useURLState("repRate", 200); // kHz
  const [pulseWidthRaw, setPulseWidth] = useURLState("pulseWidth", 5); // ns
  const [wavelength, setWavelength] = useURLState("wavelength", 905); // nm
  const [beamDiaRaw, setBeamDia] = useURLState("beamDia", 3); // mm, 1/e²
  const [divergenceRaw, setDivergence] = useURLState("divergence", 3); // mrad, 1/e² full angle
  const [rangeRaw, setRange] = useURLState("scanRange", 10); // m, where the eye is
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10); // s

  // URL values aren't range-checked: clamp them here. SI inside; physics in src/physics/laser-safety/pulse-train.ts.
  const lambda = wavelength * 1e-9;
  const Q = Math.max(pulseEnergyRaw, 0) * 1e-6;
  const prf = Math.max(repRateRaw, 0) * 1e3;
  const tau = Math.max(pulseWidthRaw, 1e-4) * 1e-9;
  const T = Math.min(Math.max(exposureRaw, tau), T_MAX);
  const d = Math.max(beamDiaRaw, 1e-3) * 1e-3;
  const phi = Math.max(divergenceRaw, 0) * 1e-3;
  const range = Math.max(rangeRaw, 0);
  const overlap = prf * tau > 1;

  const beam = useMemo(() => roundBeam(d, phi), [d, phi]);
  const train = useMemo(() => ({ duration: tau, prf, exposure: T }), [tau, prf, T]);
  const dEye = effectiveDiameterAt(beam, range);
  const atEye = useMemo(() => pulseTrainLimits(lambda, dEye, train), [lambda, dEye, train]);
  const atOutput = useMemo(() => pulseTrainLimits(lambda, d, train), [lambda, d, train]);
  const covered = atEye.limits.length > 0 && Number.isFinite(atEye.qMax);
  const ratioEye = Q / atEye.qMax;
  const ratioOut = Q / atOutput.qMax;
  const nohd = useMemo(() => rangeToDiameter(beam, pulseTrainSafeDiameter(lambda, Q, train)), [beam, lambda, Q, train]);
  const nohdFinite = Number.isFinite(nohd) && nohd > 0;

  const ratios = useCallback(
    (r: number) => pulseTrainLimits(lambda, effectiveDiameterAt(beam, r), train).limits.map((l) => ({ kind: l.kind, ratio: Q / l.qMax })),
    [lambda, beam, train, Q],
  );
  const rMin = nohdFinite ? Math.max(nohd * 1e-3, 0.01) : 0.01;
  const rMax = nohdFinite ? Math.max(nohd * 10, rMin * 10) : 1000;
  const markers = useMemo(() => {
    const m: { r: number; y?: number; label: string }[] = [];
    if (nohdFinite) m.push({ r: nohd, label: "NOHD" });
    if (range > 0 && Number.isFinite(ratioEye) && ratioEye > 0) m.push({ r: range, y: ratioEye, label: "Viewing distance" });
    return m;
  }, [nohdFinite, nohd, range, ratioEye]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map(([nm, name]) => (
          <button
            key={nm}
            type="button"
            onClick={() => setWavelength(nm)}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === nm ? "border-red-400 bg-red-500/15 text-red-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pulse energy (µJ)" value={pulseEnergyRaw} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Repetition rate (kHz, 0 = one pulse)" value={repRateRaw} onChange={setRepRate} min={0} step="any" />
        <ValidatedNumberInput label="Pulse duration (ns)" value={pulseWidthRaw} onChange={setPulseWidth} min={1e-4} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the window, 1/e² (mm)" value={beamDiaRaw} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Full-angle divergence, 1/e² (mrad)" value={divergenceRaw} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Viewing distance (m)" value={rangeRaw} onChange={setRange} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-13} max={30000} step="any" />
      </div>

      {overlap ? (
        <p className="text-amber-300 mb-4">The pulses overlap: the repetition rate times the pulse duration is above 1.</p>
      ) : !covered ? (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <ResultCard label="Average power" value={fmtPower(Q * prf)} tone="blue" subtext={`Peak power E/τ: ${fmtPower(Q / tau)}`} />
            <ResultCard
              label="NOHD (stationary beam)"
              value={nohd === Infinity ? "∞ (the beam doesn't spread)" : nohd === 0 ? "0 — within at the window" : fmtDistance(nohd)}
              tone={nohd === 0 ? "green" : "red"}
              subtext={`Exposures up to ${fmtNum(T)} s, beam a + rφ`}
            />
            <ResultCard
              label={`At ${fmtDistance(range)}: pulse / max`}
              value={`${fmtNum(ratioEye)}×`}
              tone={ratioEye > 1 ? "red" : "green"}
              subtext={`Max ${fmtEnergy(atEye.qMax)} per pulse (${atEye.limiting ? LIMIT_LABELS[atEye.limiting] : ""}, ${atEye.rule ? RULE_NAMES[atEye.rule] : ""})`}
            />
            <ResultCard
              label="Eyewear OD at the window"
              value={ratioOut > 1 ? fmtNum(Math.log10(ratioOut)) : "0 (within)"}
              tone={ratioOut > 1 ? "red" : "green"}
              subtext={`Beam ${fmtNum(d * 1e3)} mm; at ${fmtDistance(range)} it is ${fmtNum(dEye * 1e3)} mm`}
            />
          </div>
          <p className="text-sm text-gray-300 mb-2">Each rule for an eye at the viewing distance:</p>
          <PulseTrainTable result={atEye} energy={Q} />
        </>
      )}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          A lidar beam is a pulse train: the ICNIRP 2013 repetitive-pulse rules hold each pulse to the single-pulse limit,
          every group of pulses (up to the whole exposure) to the limit for the time it spans, and on the retina each
          pulse to C_P times the single-pulse limit. At 905 nm and hundreds of kHz the average-power rule binds; at
          1550 nm the cornea absorbs the beam and its limit (1 mm aperture below 0.35 s, growing to 3.5 mm at 10 s) is
          far higher, which is why 1550 nm lidars can emit much more. 10 s is ICNIRP&apos;s exposure for unintended viewing
          in the near infrared.
        </p>
        <p>
          This is the stationary beam: the worst case, and what a scanner failure leaves. A scanning lidar sweeps the beam
          across the pupil, so each pass is a short pulse group and the limits are higher (not modelled here). NOHD is
          the distance where the beam&apos;s 1/e² diameter a + rφ has grown enough for every rule, on the averaging apertures
          (7 mm on the retina). Not modelled: scanning, several beams overlapping, optical aids (binoculars lengthen the
          NOHD), atmospheric attenuation, the IEC 60825-1 class of the product.
        </p>
      </div>

      {covered && !overlap ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Pulse energy over the largest allowed energy per pulse against distance, for each eye limit, as the beam widens.
            The beam is within the limits where every line is below the dashed line; the NOHD is where the highest crosses
            it.
          </p>
        </div>
      ) : null}
    </>
  );
}
