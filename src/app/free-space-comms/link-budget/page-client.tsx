"use client";

import { useMemo } from "react";
import Link from "next/link";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import { useURLState } from "../../../hooks/use-url-state";
import {
  apertureGain, freeSpacePathLoss, friisReceivedPower, gaussianTxGain, toDb,
} from "../../../physics/free-space-comms/link-budget";
import { pointingCapture } from "../../../physics/free-space-comms/pointing-loss";
import { waistFromDivergence } from "../../../physics/wave-optics/gaussian-beam";

const presets = [
  { label: "Short urban", txPower: 10, divergence: 3, rxAperture: 8, range: 0.5, wavelength: 1550, atmosphere: 3, misc: 3 },
  { label: "Campus", txPower: 13, divergence: 2, rxAperture: 10, range: 1.5, wavelength: 1550, atmosphere: 3, misc: 3 },
  { label: "Long link", txPower: 20, divergence: 1, rxAperture: 20, range: 4, wavelength: 1550, atmosphere: 3, misc: 3 },
];
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/**
 * Budget in dBm with a Gaussian transmitter of full divergence θ (mrad) and a receiver of diameter D (cm). The received
 * power uses the exact capture 1 − exp(−2a²/w(R)²); the Friis value is its far-field, small-aperture limit.
 */
function budget(txPower: number, divergence: number, rxAperture: number, range: number, wavelength: number, atmosphere: number, misc: number) {
  const lambda = wavelength * 1e-9, R = range * 1e3;
  const gt = gaussianTxGain(divergence * 1e-3 / 2), gr = apertureGain(rxAperture * 1e-2, lambda);
  const friis = friisReceivedPower(1e-3 * 10 ** (txPower / 10), gt, gr, R, lambda);
  const exact = pointingCapture(lambda, waistFromDivergence(lambda, divergence * 1e-3 / 2), R, rxAperture * 1e-2, 0, 0).alignedFraction;
  const other = atmosphere * range + misc;
  return {
    txGain: toDb(gt), rxGain: toDb(gr), fspl: toDb(freeSpacePathLoss(R, lambda)), atmos: atmosphere * range,
    pr: txPower + toDb(exact) - other, friisPr: toDb(friis.power / 1e-3) - other, capped: friis.capped,
  };
}

export default function LinkBudgetPage() {
  const [txPowerRaw, setTxPower] = useURLState("txPower", 10); // dBm
  const [divergenceRaw, setDivergence] = useURLState("divergence", 2); // mrad, full angle
  const [rxApertureRaw, setRxAperture] = useURLState("rxAperture", 10); // cm
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [atmosphereRaw, setAtmosphere] = useURLState("atmosphere", 3); // dB/km
  const [miscRaw, setMisc] = useURLState("misc", 2); // dB
  const [sensitivityRaw, setSensitivity] = useURLState("sensitivity", -30); // dBm
  const txPower = clamp(txPowerRaw, -10, 30, 10);
  const divergence = clamp(divergenceRaw, 0.05, 10, 2);
  const rxAperture = clamp(rxApertureRaw, 1, 50, 10);
  const range = clamp(rangeRaw, 0.05, 10, 1);
  const wavelength = clamp(wavelengthRaw, 780, 1600, 1550);
  const atmosphere = clamp(atmosphereRaw, 0, 100, 3);
  const misc = clamp(miscRaw, 0, 20, 2);
  const sensitivity = clamp(sensitivityRaw, -60, 0, -30);

  const calc = useMemo(
    () => budget(txPower, divergence, rxAperture, range, wavelength, atmosphere, misc),
    [txPower, divergence, rxAperture, range, wavelength, atmosphere, misc],
  );
  const margin = calc.pr - sensitivity;

  const series = useMemo(() => {
    const ranges = Array.from({ length: 200 }, (_, i) => 0.05 + i * 0.05);
    return [
      { name: "Received power", color: "#06b6d4", points: ranges.map((x) => ({ x, y: budget(txPower, divergence, rxAperture, x, wavelength, atmosphere, misc).pr })) },
      { name: "Sensitivity", color: "#ef4444", dashed: true, points: ranges.map((x) => ({ x, y: sensitivity })) },
      { name: "Current", color: "#22c55e", showPoints: true, points: [{ x: range, y: calc.pr }] },
    ];
  }, [txPower, divergence, rxAperture, wavelength, atmosphere, misc, sensitivity, range, calc.pr]);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setTxPower(preset.txPower); setDivergence(preset.divergence); setRxAperture(preset.rxAperture); setRange(preset.range);
              setWavelength(preset.wavelength); setAtmosphere(preset.atmosphere); setMisc(preset.misc);
            }}
            className={`rounded-full border px-3 py-1 text-sm transition ${txPower === preset.txPower && divergence === preset.divergence && range === preset.range ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <InputSlider label="TX power" value={txPower} onChange={setTxPower} min={-10} max={30} step={0.1} unit="dBm" />
        <InputSlider label="TX divergence (full, 1/e²)" value={divergence} onChange={setDivergence} min={0.05} max={10} step={0.05} unit="mrad" />
        <InputSlider label="RX aperture diameter" value={rxAperture} onChange={setRxAperture} min={1} max={50} step={0.5} unit="cm" />
        <InputSlider label="Range" value={range} onChange={setRange} min={0.05} max={10} step={0.05} unit="km" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={780} max={1600} step={1} unit="nm" />
        <InputSlider label="Atmospheric attenuation" value={atmosphere} onChange={setAtmosphere} min={0} max={100} step={0.1} unit="dB/km" />
        <InputSlider label="Misc loss (optics, pointing)" value={misc} onChange={setMisc} min={0} max={20} step={0.1} unit="dB" />
        <InputSlider label="RX sensitivity" value={sensitivity} onChange={setSensitivity} min={-60} max={0} step={0.5} unit="dBm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="TX gain 8/θ²" value={`${calc.txGain.toFixed(2)} dBi`} tone="purple" subtext={`θ = ${(divergence / 2).toPrecision(3)} mrad half-angle`} />
        <ResultCard label="RX gain (πD/λ)²" value={`${calc.rxGain.toFixed(2)} dBi`} tone="purple" />
        <ResultCard label="Free-space path loss" value={`${calc.fspl.toFixed(2)} dB`} tone="blue" subtext={`atmosphere ${calc.atmos.toFixed(1)} dB`} />
        <ResultCard label="Received power" value={`${calc.pr.toFixed(2)} dBm`} tone="green" subtext={`Friis: ${calc.friisPr.toFixed(2)} dBm`} />
        <ResultCard label={`Margin vs ${sensitivity} dBm`} value={`${margin.toFixed(2)} dB`} tone={margin >= 0 ? "yellow" : "red"} />
      </div>

      {calc.friisPr - calc.pr > 0.1 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-200">
          Friis overestimates this link by {(calc.friisPr - calc.pr).toFixed(2)} dB{calc.capped ? " even capped at P_t" : ""}: the
          receiver is inside the beam&apos;s Rayleigh range or catches a large part of it. The received power above is the
          exact Gaussian capture (see the <Link href="/free-space-comms/geometric-loss" className="underline">geometric loss</Link> calculator).
        </p>
      )}

      <SimpleLineChart title="Received power vs range" xLabel="Range (km)" yLabel="Received power (dBm)" series={series} />

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model (Friis transmission)</h3>
        <p className="font-mono">P_r = P_t + G_t + G_r − 20 log₁₀(4πR/λ) − γ_atm·R − L_misc   [dB]</p>
        <p>
          The transmitter is a Gaussian beam of full 1/e² divergence θ, so its on-axis gain is 8/(θ/2)². The receiver
          collects the plane wave over its aperture: G_r = (πD/λ)². The free-space path loss and the two gains together are
          the beam spreading: for a small receiver the product equals 2a²/w(R)², the share of a Gaussian beam of radius
          w = θR/2 that falls on an aperture of radius a. Closer in, or for a large receiver, the card shows the exact
          capture 1 − exp(−2a²/w(R)²) with w(R) = w₀√(1 + (R/z_R)²). Atmospheric attenuation is per kilometre: take it from the{" "}
          <Link href="/free-space-comms/fog-attenuation" className="underline">fog</Link>,{" "}<Link href="/free-space-comms/rain-attenuation" className="underline">rain</Link> or{" "}
          <Link href="/free-space-comms/snow-attenuation" className="underline">snow</Link> calculators.
        </p>
        <p className="text-gray-500">
          Not modelled: turbulence fading, pointing jitter statistics and background noise. The sensitivity is the
          receiver&apos;s power at the target bit error rate.
        </p>
      </div>
    </>
  );
}
