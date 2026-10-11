"use client";

import { useMemo } from "react";
import { fmtEnergy, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import PulseTrainChart from "../../../components/pulse-train-chart";
import PulseTrainTable from "../../../components/pulse-train-table";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX } from "../../../physics/laser-safety/eye-exposure-limits";
import { pulseTrainLimits, timeTi } from "../../../physics/laser-safety/pulse-train";

const RULE_NAMES = { 1: "single pulse", 2: "pulse groups (average)", 3: "C_P × single pulse" } as const;

export default function PulsedMPEPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [pulseEnergyRaw, setPulseEnergy] = useURLState("pulseEnergy", 1); // µJ
  const [pulseDurationRaw, setPulseDuration] = useURLState("pulseDuration", 10); // ns
  const [prfRaw, setPrf] = useURLState("prf", 1000); // Hz
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10); // s
  const [beamDiamRaw, setBeamDiam] = useURLState("beamDiam", 2); // mm, 1/e² at the eye
  const [alphaRaw, setAlpha] = useURLState("alpha", 1.5); // mrad

  // URL values aren't range-checked: clamp them here. SI inside; physics in src/physics/laser-safety/pulse-train.ts.
  const lambda = wavelength * 1e-9;
  const Q = Math.max(pulseEnergyRaw, 0) * 1e-6;
  const tau = Math.min(Math.max(pulseDurationRaw, 1e-6), T_MAX * 1e9) * 1e-9;
  const prf = Math.max(prfRaw, 0);
  const T = Math.min(Math.max(exposureRaw, tau), T_MAX);
  const d = Math.max(beamDiamRaw, 0) * 1e-3;
  const alpha = Math.max(alphaRaw, 0) * 1e-3;
  const overlap = prf * tau > 1;

  const train = useMemo(() => ({ duration: tau, prf, exposure: T }), [tau, prf, T]);
  const result = useMemo(() => pulseTrainLimits(lambda, d, train, alpha), [lambda, d, train, alpha]);
  const covered = result.limits.length > 0 && Number.isFinite(result.qMax);
  const ratio = Q / result.qMax;
  const Ti = timeTi(lambda);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Pulse energy (µJ)" value={pulseEnergyRaw} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Pulse duration (ns)" value={pulseDurationRaw} onChange={setPulseDuration} min={1e-6} max={3e13} step="any" />
        <ValidatedNumberInput label="Repetition rate (Hz, 0 = one pulse)" value={prfRaw} onChange={setPrf} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-15} max={30000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the eye, 1/e² (mm)" value={beamDiamRaw} onChange={setBeamDiam} min={0} step="any" />
        <ValidatedNumberInput label="Source subtense α (mrad)" value={alphaRaw} onChange={setAlpha} min={0} step="any" />
      </div>

      {overlap ? (
        <p className="text-amber-300 mb-4">The pulses overlap: the repetition rate times the pulse duration is above 1.</p>
      ) : !covered ? (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <ResultCard
              label="Max energy per pulse"
              value={fmtEnergy(result.qMax)}
              tone="yellow"
              subtext={`${result.limiting ? LIMIT_LABELS[result.limiting] : ""}, rule ${result.rule}: ${result.rule ? RULE_NAMES[result.rule] : ""}`}
            />
            <ResultCard
              label="Your pulse / max"
              value={`${fmtNum(ratio)}×`}
              tone={ratio > 1 ? "red" : "green"}
              subtext={ratio > 1 ? `Exceeds: eyewear OD ${fmtNum(Math.log10(ratio))} needed` : "Within every eye limit"}
            />
            <ResultCard
              label="Pulses in the exposure"
              value={result.pulses >= 1e5 ? result.pulses.toExponential(2) : result.pulses.toLocaleString("en-US")}
              tone="blue"
              subtext={`${fmtNum(T)} s from the start of the first pulse to the end of the last`}
            />
            <ResultCard
              label="Max average power"
              value={prf > 0 && result.pulses > 1 ? fmtPower(result.qMax * prf) : "—"}
              tone="cyan"
              subtext={prf > 0 ? `Yours: ${fmtPower(Q * prf)}` : "One pulse"}
            />
          </div>
          <PulseTrainTable result={result} energy={Q} />
        </>
      )}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          ICNIRP 2013 (Health Phys. 105:271, p. 287) applies three rules to every repetitively pulsed or scanned
          exposure, and the lowest wins: (1) each pulse within the limit for one pulse of its duration; (2) every group
          of pulses within the limit for the time it spans, up to the whole exposure, which is the average-power rule;
          (3) for the retinal thermal limit (400–1400 nm), each pulse within C_P times the single-pulse limit, with n the
          number of pulses within T₂ (10 s for a small source).
        </p>
        <p>
          C_P: pulses longer than T_i ({Number.isNaN(Ti) ? "5 µs below 1050 nm, 13 µs above" : `${fmtNum(Ti * 1e6)} µs here`}) from a source
          up to 5 mrad get no reduction (C_P = 1); larger sources get n^−0.25, but not below 0.4 (α ≤ α_max) or 0.2
          (α_max &lt; α &lt; 100 mrad), and none from 100 mrad. Pulses of T_i or shorter get C_P = 1 up to 0.25 s and
          5 n^−0.25 beyond (more than 600 pulses); in the visible ICNIRP applies that only to intentional viewing, so
          use 0.25 s for an accidental glance (the blink reflex) and 10 s for invisible near-infrared beams. Pulses closer
          together than T_i count as one pulse for C_P, as in IEC 60825-1:2014 (rule 2 already adds their energies).
          IEC 60825-1:2014 also floors the 5 n^−0.25 at 0.4; ICNIRP gives no floor, so none is used here.
        </p>
        <p>
          Below 1 ns ICNIRP Table 5 gives retinal limits of 1 mJ/m² (× C_C above 1050 nm) from 100 fs to 10 ps; shorter
          pulses, and the corneal limits below 1 ns, keep the irradiance of the shortest tabulated duration. The beam is a
          round Gaussian centred on each aperture (7 mm for the retina, 1–3.5 mm for the cornea). Not modelled:
          irregular trains and bursts, scanned beams, skin.
        </p>
      </div>

      {covered && !overlap ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <PulseTrainChart lambda={lambda} d={d} duration={tau} exposure={T} alpha={alpha} energy={Q} prf={prf} />
          <p className="text-xs text-gray-500 mt-2">
            Largest energy per pulse against the repetition rate for this pulse duration, exposure and beam: the single-pulse
            limit is flat, the C_P rule falls as n^−0.25 once it applies, and the average-power rule falls as 1/f at high
            rates. The thick line is the lowest; your pulse is within the limits where it lies below it.
          </p>
        </div>
      ) : null}
    </>
  );
}
