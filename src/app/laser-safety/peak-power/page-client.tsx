"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { PULSE_SHAPE_FACTOR, peakPower, pulseTrain } from "../../../physics/laser-safety/peak-power";

/** x with a unit prefix: the largest of `units` (value per unit, ascending) that leaves a number of at least 1. */
function withUnit(x: number, units: readonly (readonly [number, string])[]): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0 " + units[0][1];
  let unit = units[0];
  for (const u of units) {
    if (Math.abs(x) >= u[0] * 0.9995) unit = u;
  }
  return (x / unit[0]).toPrecision(4) + " " + unit[1];
}

const ENERGY_UNITS = [[1e-15, "fJ"], [1e-12, "pJ"], [1e-9, "nJ"], [1e-6, "µJ"], [1e-3, "mJ"], [1, "J"]] as const;
const TIME_UNITS = [[1e-15, "fs"], [1e-12, "ps"], [1e-9, "ns"], [1e-6, "µs"], [1e-3, "ms"], [1, "s"]] as const;
const POWER_UNITS = [[1e-3, "mW"], [1, "W"], [1e3, "kW"], [1e6, "MW"], [1e9, "GW"], [1e12, "TW"]] as const;

export default function PeakPowerPage() {
  const [avgPower, setAvgPower] = useURLState("avgPower", 10); // W
  const [repRate, setRepRate] = useURLState("repRate", 80e6); // Hz
  const [dutyCycle, setDutyCycle] = useURLState("dutyCycle", 0.1); // %

  // Physics in SI: src/physics/laser-safety/peak-power.ts. The duty cycle is entered in % and used as a fraction.
  const train = useMemo(() => pulseTrain(avgPower, repRate, dutyCycle / 100), [avgPower, repRate, dutyCycle]);
  const peaks = {
    rectangular: peakPower(train.energy, train.duration, "rectangular"),
    gaussian: peakPower(train.energy, train.duration, "gaussian"),
    sech2: peakPower(train.energy, train.duration, "sech2"),
  };

  const chartData = useMemo(() => {
    // Duty cycle 0.001 % – 100 % on a log axis, 12 points per decade.
    const dcs = Array.from({ length: 61 }, (_, i) => 0.001 * Math.pow(10, i / 12));
    const points = dcs
      .map((d) => ({ d, p: pulseTrain(avgPower, repRate, d / 100).peak }))
      .filter((q) => Number.isFinite(q.p) && q.p > 0);
    const traces: Record<string, unknown>[] = [
      { x: points.map((q) => q.d), y: points.map((q) => q.p), type: "scatter", mode: "lines", name: "Peak power (rectangular pulse)", line: { color: "#f87171" } },
    ];
    if (Number.isFinite(train.peak) && train.peak > 0) {
      traces.push({ x: [dutyCycle], y: [train.peak], type: "scatter", mode: "markers", name: "Current", marker: { color: "#60a5fa", size: 12 } });
    }
    return traces;
  }, [avgPower, repRate, dutyCycle, train.peak]);

  const hasResult = Number.isFinite(train.peak) && train.peak > 0;

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Average Power (W)" value={avgPower} onChange={setAvgPower} min={0.000001} max={1000000} step="any" />
        <ValidatedNumberInput label="Repetition Rate (Hz)" value={repRate} onChange={setRepRate} min={0.001} max={1e12} step="any" />
        <ValidatedNumberInput label="Duty Cycle (%)" value={dutyCycle} onChange={setDutyCycle} min={0.001} max={100} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pulse Energy</p>
          <p className="text-2xl font-bold text-blue-400">{withUnit(train.energy, ENERGY_UNITS)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pulse Duration (FWHM)</p>
          <p className="text-2xl font-bold text-green-400">{withUnit(train.duration, TIME_UNITS)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak/Avg Ratio (rectangular)</p>
          <p className="text-2xl font-bold text-yellow-400">{Number.isFinite(train.peak) ? (100 / dutyCycle).toPrecision(4) + "×" : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power, Rectangular</p>
          <p className="text-2xl font-bold text-red-400">{withUnit(peaks.rectangular, POWER_UNITS)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power, Gaussian</p>
          <p className="text-2xl font-bold text-red-400">{withUnit(peaks.gaussian, POWER_UNITS)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power, sech²</p>
          <p className="text-2xl font-bold text-red-400">{withUnit(peaks.sech2, POWER_UNITS)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 text-sm text-gray-300 space-y-2">
        <p className="font-mono">
          E = P<sub>avg</sub> / f, τ = D / f, P<sub>peak</sub> = k · E / τ = k · P<sub>avg</sub> / D
        </p>
        <p>
          D is the duty cycle (the percentage above divided by 100) and τ the pulse duration at half maximum. The shape
          factor k is {PULSE_SHAPE_FACTOR.rectangular} for a rectangular pulse, 2√(ln 2/π) = {PULSE_SHAPE_FACTOR.gaussian.toFixed(4)} for
          a Gaussian pulse and ln(1+√2) = {PULSE_SHAPE_FACTOR.sech2.toFixed(4)} for a sech² pulse. At D = 100 % the
          peak power equals the average power.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        {hasResult ? (
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Duty Cycle (%)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "Peak Power (W)", type: "log", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        ) : (
          <p className="text-sm text-gray-400">Enter an average power, a repetition rate and a duty cycle to see the chart.</p>
        )}
      </div>
    </>
  );
}
