"use client";

import { useMemo } from "react";
import { fmtDistance, fmtEnergy, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import PulseTrainChart from "../../../components/pulse-train-chart";
import PulseTrainTable from "../../../components/pulse-train-table";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX } from "../../../physics/laser-safety/eye-exposure-limits";
import { rangeToDiameter, roundBeam } from "../../../physics/laser-safety/hazard-distance";
import { pulseTrainLimits, pulseTrainSafeDiameter } from "../../../physics/laser-safety/pulse-train";

const RULE_NAMES = { 1: "single pulse", 2: "average power", 3: "C_P × single pulse" } as const;

export default function UltrafastLaserSafetyPage() {
  const [pulseEnergyRaw, setPulseEnergy] = useURLState("pulseEnergy", 0.0125); // µJ
  const [repRateRaw, setRepRate] = useURLState("repRate", 80); // MHz
  const [pulseWidthRaw, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [beamDiaRaw, setBeamDia] = useURLState("beamDia", 2); // mm, 1/e²
  const [divergenceRaw, setDivergence] = useURLState("divergence", 1); // mrad, 1/e² full angle
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10); // s

  // URL values aren't range-checked: clamp them here. SI inside; physics in src/physics/laser-safety/pulse-train.ts.
  const lambda = wavelength * 1e-9;
  const Q = Math.max(pulseEnergyRaw, 0) * 1e-6;
  const tau = Math.max(pulseWidthRaw, 1) * 1e-15;
  const prf = Math.max(repRateRaw, 0) * 1e6;
  const T = Math.min(Math.max(exposureRaw, tau), T_MAX);
  const d = Math.max(beamDiaRaw, 1e-3) * 1e-3;
  const phi = Math.max(divergenceRaw, 0) * 1e-3;
  const overlap = prf * tau > 1;

  const train = useMemo(() => ({ duration: tau, prf, exposure: T }), [tau, prf, T]);
  const result = useMemo(() => pulseTrainLimits(lambda, d, train), [lambda, d, train]);
  const covered = result.limits.length > 0 && Number.isFinite(result.qMax);
  const ratio = Q / result.qMax;
  const od = ratio > 1 ? Math.log10(ratio) : 0;
  // The single-pulse rule on its own, as an ultrafast safety check often stops there.
  const singleOnly = Math.min(...result.limits.map((l) => l.singlePulse));
  const odSingle = Q > singleOnly ? Math.log10(Q / singleOnly) : 0;
  const nohd = useMemo(() => {
    const dSafe = pulseTrainSafeDiameter(lambda, Q, train);
    return rangeToDiameter(roundBeam(d, phi), dSafe);
  }, [lambda, Q, train, d, phi]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pulse energy (µJ)" value={pulseEnergyRaw} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Repetition rate (MHz, 0 = one pulse)" value={repRateRaw} onChange={setRepRate} min={0} step="any" />
        <ValidatedNumberInput label="Pulse duration (fs)" value={pulseWidthRaw} onChange={setPulseWidth} min={1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter, 1/e² (mm)" value={beamDiaRaw} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Full-angle divergence, 1/e² (mrad)" value={divergenceRaw} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-15} max={30000} step="any" />
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
              label="Max energy per pulse"
              value={fmtEnergy(result.qMax)}
              tone="yellow"
              subtext={`${result.limiting ? LIMIT_LABELS[result.limiting] : ""}, ${result.rule ? RULE_NAMES[result.rule] : ""}`}
            />
            <ResultCard
              label="Eyewear OD needed"
              value={ratio > 1 ? fmtNum(od) : "0 (within)"}
              tone={ratio > 1 ? "red" : "green"}
              subtext={`At the output, ${fmtNum(T)} s; the single-pulse rule alone gives ${fmtNum(odSingle)}`}
            />
            <ResultCard
              label="NOHD"
              value={nohd === Infinity ? "∞ (the beam doesn't spread)" : nohd === 0 ? "0 — within at the output" : fmtDistance(nohd)}
              tone={nohd === 0 ? "green" : "red"}
              subtext="Direct beam, diameter a + rφ"
            />
          </div>
          <PulseTrainTable result={result} energy={Q} />
        </>
      )}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          A mode-locked oscillator puts tens of millions of pulses into the eye each second, so the average power, not the
          single pulse, sets the limit: ICNIRP 2013&apos;s rule 2 holds every group of pulses to the limit for the time it
          spans, up to the whole exposure. Pulses closer together than T_i (5 µs below 1050 nm, 13 µs above) also count as
          one pulse for the C_P rule. The single-pulse limits below 1 ns are ICNIRP 2013 Table 5&apos;s: 1 mJ/m² over the
          7 mm pupil from 100 fs to 10 ps (× C_C above 1050 nm; no C_A), 2 C_A mJ/m² from 10 ps; shorter than 100 fs, and
          on the cornea below 1 ns, the irradiance is held at the shortest tabulated value.
        </p>
        <p>
          Below 10 ps the retina is damaged by non-linear effects (laser-induced breakdown) rather than heat, which is why
          ICNIRP drops C_A there; it states that its limits also preclude non-linear injury. Eyewear for ultrafast lasers
          must keep its OD at the peak power: absorbing filters can saturate or bleach, so EN 207 tests mode-locked lasers separately (&quot;M&quot;). Use 0.25 s for an accidental
          glance at a visible beam and 10 s for the near infrared. Not modelled: pulse bursts, supercontinuum and harmonic
          lines (see the multiple-wavelength page), atmospheric attenuation, focusing optics.
        </p>
      </div>

      {covered && !overlap ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <PulseTrainChart lambda={lambda} d={d} duration={tau} exposure={T} energy={Q} prf={prf} />
          <p className="text-xs text-gray-500 mt-2">
            Largest energy per pulse against the repetition rate at the output, for this pulse duration and exposure. Above a
            few kHz the average-power rule falls as 1/f and takes over from the single-pulse limit.
          </p>
        </div>
      ) : null}
    </>
  );
}
