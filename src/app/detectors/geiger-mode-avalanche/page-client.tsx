"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { afterpulseProbability } from "../../../physics/detectors/dead-time";
import {
  darkCountRate, doublingInterval, overbiasAtTemperature, trapEfficiencyAtOverbias, triggerProbability,
} from "../../../physics/detectors/spad";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const K = 273.15;
const T_REF = 25; // °C

// Defaults: one 50 µm microcell of a Hamamatsu S13360-3050CS (datasheet KAPD1052E: V_BR 53 V, 3 V overvoltage,
// PDE 40 % at 450 nm, 54 mV/°C, 500 kcps over 3600 cells = 139 cps per cell). Otte et al. 2017: α = 0.0395 at
// 452 nm (V_c = 0.0395 · 53 V = 2.09 V) and dark-rate slope b = 8.43 per relative overvoltage (0.159 /V).
// Webster & Henderson 2013: E_a = 0.85 eV. The trap and dead time are the afterpulsing page's illustrative values.
// Non-finite dark rates (overflow) become gaps in the charts.
const finiteOrNaN = (x: number) => (Number.isFinite(x) ? x : NaN);

export default function GeigerModeAPDPage() {
  const [overbiasRaw, setOverbias] = useURLState("overbias", 3); // V at 25 °C
  const [vcRaw, setVc] = useURLState("voltageScale", 2.09); // V
  const [pdeMaxRaw, setPdeMax] = useURLState("pdeMax", 0.525);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 25); // °C
  const [tempCoeffRaw, setTempCoeff] = useURLState("tempCoeff", 54); // mV/°C
  const [dcrRaw, setDarkCountRate] = useURLState("darkCountRate", 139); // cps at 25 °C
  const [eaRaw, setEa] = useURLState("activationEnergy", 0.85); // eV
  const [slopeRaw, setSlope] = useURLState("fieldSlope", 0.159); // 1/V
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 50); // ns
  const [etaRaw, setEta] = useURLState("trapEfficiency", 0.05);
  const [trapTauRaw, setTrapTau] = useURLState("trapLifetime", 20); // ns

  const overbiasRef = clamp(overbiasRaw, 0.1, 20, 3);
  const vc = clamp(vcRaw, 0.01, 50, 2.09);
  const pdeMax = clamp(pdeMaxRaw, 0, 1, 0.525);
  const temperature = clamp(temperatureRaw, -60, 100, 25);
  const beta = clamp(tempCoeffRaw, 0, 2000, 54) * 1e-3; // V/K
  const dcrRef = clamp(dcrRaw, 0, 1e8, 139);
  const ea = clamp(eaRaw, 0, 1.5, 0.85);
  const slope = clamp(slopeRaw, 0, 5, 0.159);
  const deadTime_ns = clamp(deadTimeRaw, 1, 1e5, 50);
  const eta = clamp(etaRaw, 0, 1, 0.05);
  const trapTau_ns = clamp(trapTauRaw, 0.1, 1e5, 20);

  const dcrAt = (dv: number, t_C: number) => finiteOrNaN(darkCountRate({
    dcrRef, temperature: t_C + K, refTemperature: T_REF + K, activationEnergy: ea,
    overbias: dv, overbiasRef, voltageScale: vc, fieldSlope: slope,
  }));
  const bvShift = beta * (temperature - T_REF);
  const dv = overbiasAtTemperature(overbiasRef, beta, temperature, T_REF);
  const pt = triggerProbability(dv, vc);
  const pde = pdeMax * pt;
  const dcr = dcrAt(dv, temperature);
  const pap = afterpulseProbability([{ eta: trapEfficiencyAtOverbias(eta, dv, overbiasRef, vc), tau: trapTau_ns * 1e-9 }], deadTime_ns * 1e-9);
  const maxRate = 1e9 / deadTime_ns;
  const doubling = doublingInterval(ea, temperature + K);
  const belowBreakdown = dv <= 0;

  // Excess bias from 0 to 3× the reference, at the operating temperature's dark-rate scale.
  const dvs = Array.from({ length: 121 }, (_, i) => (i * 3 * overbiasRef) / 120);
  const biasChart = [
    { x: dvs, y: dvs.map((v) => triggerProbability(v, vc) * 100), type: "scatter" as const, mode: "lines" as const, name: "Trigger probability P_t (%)", line: { color: "#60a5fa" } },
    { x: dvs, y: dvs.map((v) => pdeMax * triggerProbability(v, vc) * 100), type: "scatter" as const, mode: "lines" as const, name: "PDE (%)", line: { color: "#34d399" } },
    { x: dvs, y: dvs.map((v) => dcrAt(v, T_REF)), type: "scatter" as const, mode: "lines" as const, name: "DCR at 25 °C (cps)", line: { color: "#a78bfa", dash: "dash" as const }, yaxis: "y2" },
  ];
  // −40 to 85 °C (widened to include T) at the fixed supply: the breakdown voltage rises and the excess bias shrinks.
  const tLo = Math.min(-40, temperature);
  const temps = Array.from({ length: 126 }, (_, i) => tLo + (i * (Math.max(85, temperature) - tLo)) / 125);
  const tempChart = [
    { x: temps, y: temps.map((t) => dcrAt(overbiasAtTemperature(overbiasRef, beta, t, T_REF), t)), type: "scatter" as const, mode: "lines" as const, name: "DCR (cps)", line: { color: "#a78bfa" } },
    { x: Number.isFinite(dcr) ? [temperature] : [], y: Number.isFinite(dcr) ? [dcr] : [], type: "scatter" as const, mode: "markers" as const, name: "Operating point", marker: { color: "#fbbf24", size: 8 } },
    { x: temps, y: temps.map((t) => pdeMax * triggerProbability(overbiasAtTemperature(overbiasRef, beta, t, T_REF), vc) * 100), type: "scatter" as const, mode: "lines" as const, name: "PDE (%)", line: { color: "#34d399" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Excess Bias at 25 °C (V)" value={overbiasRaw} onChange={setOverbias} min={0.1} max={20} step="0.1" />
        <ValidatedNumberInput label="P_t Voltage Scale V_c (V)" value={vcRaw} onChange={setVc} min={0.01} max={50} step="0.1" />
        <ValidatedNumberInput label="PDE at Full Trigger Probability" value={pdeMaxRaw} onChange={setPdeMax} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Temperature (°C)" value={temperatureRaw} onChange={setTemperature} min={-60} max={100} step="1" />
        <ValidatedNumberInput label="V_br Temp Coeff (mV/°C)" value={tempCoeffRaw} onChange={setTempCoeff} min={0} max={2000} step="1" />
        <ValidatedNumberInput label="DCR at 25 °C (cps)" value={dcrRaw} onChange={setDarkCountRate} min={0} max={1e8} step="10" />
        <ValidatedNumberInput label="DCR Activation Energy (eV)" value={eaRaw} onChange={setEa} min={0} max={1.5} step="0.01" />
        <ValidatedNumberInput label="DCR Field Slope (1/V)" value={slopeRaw} onChange={setSlope} min={0} max={5} step="0.01" />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTimeRaw} onChange={setDeadTime} min={1} max={1e5} step="5" />
        <ValidatedNumberInput label="Trap Efficiency η at 25 °C Bias" value={etaRaw} onChange={setEta} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Trap Lifetime (ns)" value={trapTauRaw} onChange={setTrapTau} min={0.1} max={1e5} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ResultCard label="V_br Shift" value={`${bvShift >= 0 ? "+" : ""}${bvShift.toFixed(2)} V`} tone="red" />
        <ResultCard label="Excess Bias" value={`${dv.toFixed(2)} V`} tone="blue" />
        <ResultCard label="Trigger Probability" value={`${(pt * 100).toFixed(1)}%`} tone="cyan" />
        <ResultCard label="PDE" value={`${(pde * 100).toFixed(1)}%`} tone="green" />
        <ResultCard label="Dark Count Rate" value={Number.isFinite(dcr) ? `${dcr.toExponential(2)} cps` : "—"} tone="purple" subtext={Number.isFinite(doubling) ? `doubles every ${doubling.toFixed(1)} °C at fixed excess bias` : undefined} />
        <ResultCard label="Afterpulse Probability" value={Number.isFinite(pap) ? `${(pap * 100).toFixed(3)}%` : "—"} tone="orange" />
        <ResultCard label="Afterpulse Rate (dark)" value={Number.isFinite(pap * dcr) ? `${(pap * dcr).toExponential(2)} cps` : "—"} tone="yellow" />
        <ResultCard label="Max Count Rate 1/τ" value={`${(maxRate / 1e6).toFixed(1)} Mcps`} tone="gray" />
      </div>
      {belowBreakdown && (
        <p className="mb-6 text-sm text-yellow-400">
          At {temperature} °C the breakdown voltage has risen {bvShift.toFixed(2)} V, past the {overbiasRef} V excess bias: the diode is
          below breakdown and cannot count.
        </p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 mt-6 text-sm text-gray-300 font-mono space-y-1">
        <p>ΔV(T) = ΔV(25 °C) − β·(T − 25 °C);  P_t = 1 − exp(−ΔV/V_c);  PDE = PDE_max·P_t</p>
        <p>DCR = DCR₀ · exp[−(E_a/k_B)(1/T − 1/T₀)] · exp[b(ΔV − ΔV₀)] · P_t(ΔV)/P_t(ΔV₀)</p>
        <p>P_ap = η·(ΔV·P_t)/(ΔV₀·P_t₀) · exp(−t_d/τ_trap)</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={biasChart} layout={{
          title: { text: "Versus excess bias", font: { size: 12 } },
          xaxis: { title: "Excess Bias (V)", gridcolor: "#374151" },
          yaxis: { title: "Probability (%)", gridcolor: "#374151", range: [0, 100] },
          yaxis2: { title: "DCR (cps)", type: "log", gridcolor: "#374151", overlaying: "y", side: "right" },
        }} />
        <ChartPanel data={tempChart} layout={{
          title: { text: "Versus temperature at a fixed supply", font: { size: 12 } },
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "DCR (cps)", type: "log", gridcolor: "#374151" },
          yaxis2: { title: "PDE (%)", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 100] },
        }} />
      </div>
    </>
  );
}
