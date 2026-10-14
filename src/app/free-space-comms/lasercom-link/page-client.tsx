"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  apertureGain, fraunhoferDistance, freeSpacePathLoss, friisReceivedPower, toDb,
} from "../../../physics/free-space-comms/link-budget";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (!Number.isFinite(x) ? "—" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2));

const inputs = [
  { key: "txPower", label: "TX power (dBm)", def: 20, min: -10, max: 50 },
  { key: "txAperture", label: "TX aperture diameter (cm)", def: 5, min: 0.1, max: 100 },
  { key: "rxAperture", label: "RX aperture diameter (cm)", def: 10, min: 0.1, max: 1000 },
  { key: "wavelength", label: "Wavelength (nm)", def: 1550, min: 400, max: 11000 },
  { key: "range", label: "Range (km)", def: 500, min: 0.001, max: 4e5 },
  { key: "txEfficiency", label: "TX antenna efficiency", def: 0.8, min: 0.01, max: 1 },
  { key: "rxEfficiency", label: "RX antenna efficiency", def: 0.7, min: 0.01, max: 1 },
  { key: "pointingLoss", label: "Pointing loss (dB)", def: 3, min: 0, max: 30 },
  { key: "atmosLoss", label: "Atmospheric loss (dB)", def: 2, min: 0, max: 30 },
] as const;
type InputKey = (typeof inputs)[number]["key"];

export default function LasercomLinkPage() {
  const raw = {
    txPower: useURLState("txPower", 20), // dBm
    txAperture: useURLState("txAperture", 5), // cm
    rxAperture: useURLState("rxAperture", 10), // cm
    wavelength: useURLState("wavelength", 1550), // nm
    range: useURLState("range", 500), // km
    txEfficiency: useURLState("txEfficiency", 0.8),
    rxEfficiency: useURLState("rxEfficiency", 0.7),
    pointingLoss: useURLState("pointingLoss", 3), // dB
    atmosLoss: useURLState("atmosLoss", 2), // dB
  };
  const v = Object.fromEntries(inputs.map((i) => [i.key, clamp(raw[i.key][0], i.min, i.max, i.def)])) as Record<InputKey, number>;
  const { txPower, txAperture, rxAperture, wavelength, range, txEfficiency, rxEfficiency, pointingLoss, atmosLoss } = v;

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const dTx = txAperture * 1e-2, dRx = rxAperture * 1e-2, R = range * 1e3;
    const gt = apertureGain(dTx, lambda, 0, txEfficiency);
    const gr = apertureGain(dRx, lambda, 0, rxEfficiency);
    const friis = friisReceivedPower(1e-3 * 10 ** (txPower / 10), gt, gr, R, lambda, txEfficiency * rxEfficiency);
    return {
      txGain: toDb(gt), rxGain: toDb(gr), fspl: toDb(freeSpacePathLoss(R, lambda)),
      pr: toDb(friis.power / 1e-3) - pointingLoss - atmosLoss, capped: friis.capped,
      // 1/e² radius of the Gaussian beam with the same on-axis gain: θ = √(8/G_t).
      spot: Math.sqrt(8 / gt) * R,
      farField: fraunhoferDistance(dTx, lambda),
      // Share of the beam the receiver catches, before the antenna efficiencies.
      capture: friis.fraction / (txEfficiency * rxEfficiency),
    };
  }, [txPower, txAperture, rxAperture, wavelength, range, txEfficiency, rxEfficiency, pointingLoss, atmosLoss]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const gt = apertureGain(txAperture * 1e-2, lambda, 0, txEfficiency);
    const gr = apertureGain(rxAperture * 1e-2, lambda, 0, rxEfficiency);
    const rMax = Math.max(3000, 2 * range);
    const ranges = Array.from({ length: 300 }, (_, i) => (rMax * (i + 1)) / 300);
    const powers = ranges.map((r) =>
      toDb(friisReceivedPower(1e-3 * 10 ** (txPower / 10), gt, gr, r * 1e3, lambda, txEfficiency * rxEfficiency).power / 1e-3)
      - pointingLoss - atmosLoss);
    return [
      { x: ranges, y: powers, type: "scatter", mode: "lines", name: "Rx power (dBm)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: ranges, y: ranges.map((r) => Math.sqrt(8 / gt) * r * 1e3), type: "scatter", mode: "lines", name: "Spot radius (m)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [txPower, txAperture, rxAperture, wavelength, range, txEfficiency, rxEfficiency, pointingLoss, atmosLoss]);

  const nearField = range * 1e3 < calc.farField;
  const bigCapture = calc.capture > 0.1;

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {inputs.map((i) => (
            <div key={i.key}>
              <ValidatedNumberInput label={i.label} value={v[i.key]} onChange={raw[i.key][1]} min={i.min} max={i.max} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">TX gain</span><span>{calc.txGain.toFixed(2)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">RX gain</span><span>{calc.rxGain.toFixed(2)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Free-space path loss</span><span>{calc.fspl.toFixed(2)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Spot radius at RX (1/e²)</span><span>{fmt(calc.spot)} m</span></div>
              <div className="flex justify-between font-bold"><span className="text-gray-300">Received power</span><span className={calc.pr > -40 ? "text-green-400" : "text-red-400"}>{calc.pr.toFixed(2)} dBm</span></div>
            </div>
          </div>
          {(nearField || bigCapture) && (
            <p className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-200">
              {calc.capped
                ? "Friis would put more power at the receiver than the transmitter sends, so the result is capped at P_t·η_tx·η_rx. "
                : ""}
              {nearField
                ? `The range is inside the far-field distance 2D²/λ = ${fmt(calc.farField / 1e3)} km of the transmitter, where the Friis formula overestimates the received power.`
                : bigCapture && !calc.capped
                  ? `The receiver catches ${(calc.capture * 100).toFixed(0)} % of the beam by Friis, which only holds while it catches a small part.`
                  : ""}
            </p>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">Friis:</strong> P<sub>r</sub> = P<sub>t</sub> G<sub>t</sub> G<sub>r</sub> (λ / 4πR)² · L<sub>point</sub> · L<sub>atm</sub></p>
            <p><strong className="text-gray-400">Gains:</strong> G = (π D / λ)² η, with η the antenna efficiency (Gaussian illumination, truncation, obscuration, optics)</p>
            <p><strong className="text-gray-400">FSPL:</strong> 20 log₁₀(4πR/λ). It isn&apos;t a loss on its own: the gains cancel it, and together they count the beam spreading once.</p>
            <p><strong className="text-gray-400">Spot radius:</strong> w = θR with θ = √(8/G<sub>t</sub>), the Gaussian beam with the same on-axis gain</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Rx power (dBm)", color: "#06b6d4", gridcolor: "#374151" },
              yaxis2: { title: "Spot radius (m)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </>
  );
}
