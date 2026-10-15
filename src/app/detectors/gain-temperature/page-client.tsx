"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { driftExponent, gainAtTemperature, gainTemperatureCoefficient } from "../../../physics/detectors/apd";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
// Breakdown (Infinity) and invalid points become gaps.
const finite = (x: number) => (Number.isFinite(x) ? x : NaN);
const fmtGain = (x: number) => (x === Infinity ? "— (breakdown)" : Number.isFinite(x) ? x.toFixed(2) : "—");

export default function GainTemperaturePage() {
  const [detectorRaw, setDetector] = useURLState("detector", "apd");
  const [gainRefRaw, setGainRef] = useURLState("gainRef", 10);
  const [tempRefRaw, setTempRef] = useURLState("tempRef", 22);
  const [breakdownRaw, setBreakdown] = useURLState("breakdownVoltage", 50);
  const [marginRaw, setMargin] = useURLState("margin", 4);
  const [vbrCoeffRaw, setVbrCoeff] = useURLState("vbrCoeff", 0.14);
  const [pmtCoeffRaw, setPmtCoeff] = useURLState("pmtCoeff", -0.3);
  const [tempMinRaw, setTempMin] = useURLState("tempMin", 0);
  const [tempMaxRaw, setTempMax] = useURLState("tempMax", 60);

  const detector = detectorRaw === "pmt" ? "pmt" : "apd";
  const gainRef = clamp(gainRefRaw, 1.01, 1e8, 10);
  const tempRef = clamp(tempRefRaw, -100, 150, 22);
  const breakdown = clamp(breakdownRaw, 1, 5000, 50);
  const margin = clamp(marginRaw, 1e-3, breakdown * 0.999, 4);
  const vbrCoeff = clamp(vbrCoeffRaw, 0, 10, 0.14);
  const pmtCoeff = clamp(pmtCoeffRaw, -2, 2, -0.3); // %/°C
  const tempMin = clamp(tempMinRaw, -100, 150, 0);
  const tempMax = Math.max(tempMin + 1, clamp(tempMaxRaw, -100, 150, 60));

  const apd = { gainRef, breakdownRef: breakdown, marginRef: margin, breakdownCoeff: vbrCoeff };
  const n = driftExponent(apd);
  // PMT: constant relative coefficient β (1/°C), M = M_ref·exp(β·ΔT).
  const gainAt = (T: number) =>
    detector === "apd" ? gainAtTemperature(apd, T - tempRef) : gainRef * Math.exp((pmtCoeff / 100) * (T - tempRef));
  const coeffPercent = detector === "apd" ? 100 * gainTemperatureCoefficient(apd) : pmtCoeff;
  // V_br(T) reaches the bias V_br,ref − margin at ΔT = −margin/γ.
  const breakdownTemp = detector === "apd" && vbrCoeff > 0 ? tempRef - margin / vbrCoeff : NaN;

  const gainAtMin = gainAt(tempMin);
  const gainAtMax = gainAt(tempMax);
  const ratio = gainAtMin / gainAtMax;

  const temps = Array.from({ length: 300 }, (_, i) => tempMin + (i * (tempMax - tempMin)) / 299);
  const chartData = [
    { x: temps, y: temps.map((T) => finite(gainAt(T))), type: "scatter" as const, mode: "lines" as const, name: "Gain", line: { color: "#60a5fa", width: 2 } },
  ];
  const deltaT = Array.from({ length: 101 }, (_, i) => -10 + i * 0.2);
  const stabilityChart = [
    { x: deltaT, y: deltaT.map((dT) => finite(100 * (gainAt(tempRef + dT) / gainRef - 1))), type: "scatter" as const, mode: "lines" as const, name: "Gain change (%)", line: { color: "#f87171", width: 2 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <label htmlFor="detector" className="block text-sm text-gray-300">Detector Type</label>
          <select id="detector" value={detector} onChange={(e) => setDetector(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="apd">APD at fixed bias</option>
            <option value="pmt">PMT at fixed high voltage</option>
          </select>
        </div>
        <ValidatedNumberInput label="Gain at Reference Temperature" value={gainRefRaw} onChange={setGainRef} min={1.01} max={1e8} step="1" />
        <ValidatedNumberInput label="Reference Temperature (°C)" value={tempRefRaw} onChange={setTempRef} min={-100} max={150} step="1" />
        {detector === "apd" ? (
          <>
            <ValidatedNumberInput label="Breakdown Voltage at Reference (V)" value={breakdownRaw} onChange={setBreakdown} min={1} max={5000} step="1" />
            <ValidatedNumberInput label="Bias Below Breakdown V_br − V (V)" value={marginRaw} onChange={setMargin} min={0.001} max={breakdown} step="0.5" />
            <ValidatedNumberInput label="V_br Temperature Coefficient (V/°C)" value={vbrCoeffRaw} onChange={setVbrCoeff} min={0} max={10} step="0.01" />
          </>
        ) : (
          <ValidatedNumberInput label="PMT Gain Temperature Coefficient (%/°C)" value={pmtCoeffRaw} onChange={setPmtCoeff} min={-2} max={2} step="0.1" />
        )}
        <ValidatedNumberInput label="Plot From (°C)" value={tempMinRaw} onChange={setTempMin} min={-100} max={150} step="5" />
        <ValidatedNumberInput label="Plot To (°C)" value={tempMaxRaw} onChange={setTempMax} min={-100} max={150} step="5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Gain @ ${tempMin} °C`} value={fmtGain(gainAtMin)} tone="blue" />
        <ResultCard label={`Gain @ ${tempMax} °C`} value={fmtGain(gainAtMax)} tone="red" />
        <ResultCard label={`Gain Ratio ${tempMin}/${tempMax} °C`} value={Number.isFinite(ratio) ? `×${ratio.toFixed(3)}` : "—"} tone="yellow" />
        <ResultCard label={`Gain Coefficient @ ${tempRef} °C`} value={Number.isFinite(coeffPercent) ? `${coeffPercent.toFixed(2)} %/°C` : "—"} tone="green" />
      </div>
      {detector === "apd" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <ResultCard label="Fitted Miller Exponent n" value={Number.isFinite(n) ? n.toFixed(4) : "—"} tone="purple" />
          <ResultCard label="Fixed Bias V" value={`${(breakdown - margin).toFixed(2)} V`} tone="cyan" />
          <ResultCard label="Breakdown Reached Below" value={Number.isFinite(breakdownTemp) ? `${breakdownTemp.toFixed(1)} °C` : "—"} tone="orange" />
        </div>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>APD: V_br(T) = V_br,ref + γ·(T − T_ref), M(T) = 1 / [1 − (V/V_br(T))^n]</p>
        <p>n fitted through the operating point: n = ln(1 − 1/M_ref) / ln(V/V_br,ref)</p>
        <p>(1/M)·dM/dT = −n·(M − 1)·γ / V_br: the drift grows with the gain</p>
        <p>PMT: M(T) = M_ref·exp(β·ΔT), β entered</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Gain", type: "log", gridcolor: "#374151" } }} title="Gain vs Temperature" />
      <ChartPanel data={stabilityChart} layout={{ xaxis: { title: "ΔT from Reference (°C)", gridcolor: "#374151" }, yaxis: { title: "Gain Change (%)", gridcolor: "#374151" } }} title="Gain Change vs ΔT" />
    </>
  );
}
