"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  EARTH_ROTATION_RATE, RAD_PER_S_TO_DEG_PER_H, angleRandomWalkDegPerRootHour, noiseEquivalentRate, properFrequency,
  sagnacScaleFactor, shotNoisePhase, transitTime,
} from "../../../physics/fiber-optics/sagnac";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function FiberGyroscopePage() {
  const [coilDiameterRaw, setCoilDiameter] = useURLState("coilDiameter", 100); // mm
  const [fiberLengthRaw, setFiberLength] = useURLState("fiberLength", 500); // m
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [groupIndexRaw, setGroupIndex] = useURLState("n_g", 1.4682);
  const [sourcePowerRaw, setSourcePower] = useURLState("sourcePower", 10); // mW
  const [lossesRaw, setLosses] = useURLState("losses", 10); // dB, source to detector at the bias point
  const [qeRaw, setQe] = useURLState("qe", 1); // detector quantum efficiency

  const D_mm = clamp(coilDiameterRaw, 1, 1000);
  const L = clamp(fiberLengthRaw, 1, 10000);
  const lambda_nm = clamp(wavelengthRaw, 400, 2000);
  const nG = clamp(groupIndexRaw, 1, 2);
  const P_mW = clamp(sourcePowerRaw, 0.001, 1000);
  const loss_dB = clamp(lossesRaw, 0, 60);
  const qe = clamp(qeRaw, 0.01, 1);

  const calc = useMemo(() => {
    const lambda = lambda_nm * 1e-9;
    const S = sagnacScaleFactor(L, D_mm * 1e-3, lambda);
    const Pd = P_mW * 1e-3 * 10 ** (-loss_dB / 10);
    const sigma = shotNoisePhase(Pd, lambda, qe);
    const rate = noiseEquivalentRate(sigma, S);
    return {
      S, Pd, sigma,
      phaseEarth: S * EARTH_ROTATION_RATE,
      rateDegH: rate * RAD_PER_S_TO_DEG_PER_H,
      arw: angleRandomWalkDegPerRootHour(rate),
      tau: transitTime(L, nG),
      fp: properFrequency(L, nG),
      turns: L / (Math.PI * D_mm * 1e-3),
      maxRateDegS: ((Math.PI / (2 * S)) * 180) / Math.PI, // rate at which the Sagnac phase reaches π/2
    };
  }, [D_mm, L, lambda_nm, nG, P_mW, loss_dB, qe]);

  const chartData = useMemo(() => {
    // ARW against coil length at the same detected power (fibre loss lumped into the loss input).
    // Log-spaced, spanning at least 50–5000 m and always including L.
    const lMin = Math.min(50, L), lMax = Math.max(5000, L);
    const lengths = Array.from({ length: 100 }, (_, i) => lMin * (lMax / lMin) ** (i / 99));
    const sigma = calc.sigma;
    const arw = lengths.map(len =>
      angleRandomWalkDegPerRootHour(noiseEquivalentRate(sigma, sagnacScaleFactor(len, D_mm * 1e-3, lambda_nm * 1e-9))));
    const rMax = Math.min(20, 1.2 * calc.maxRateDegS); // °/s, never far past the unambiguous range
    const rates = Array.from({ length: 101 }, (_, i) => (i * rMax) / 100);
    const phases = rates.map(r => (calc.S * r * Math.PI) / 180);
    return [
      { x: lengths, y: arw, type: "scatter" as const, mode: "lines" as const, name: "ARW (°/√h)", line: { color: "#f87171" }, xaxis: "x", yaxis: "y" },
      { x: rates, y: phases, type: "scatter" as const, mode: "lines" as const, name: "Δφ (rad)", line: { color: "#60a5fa" }, xaxis: "x2", yaxis: "y2" },
      { x: [L], y: [calc.arw], type: "scatter" as const, mode: "markers" as const, name: "Current L", marker: { color: "#f87171", size: 11, symbol: "diamond" as const, line: { color: "#ffffff", width: 1 } }, xaxis: "x", yaxis: "y" },
      { x: [calc.maxRateDegS], y: [Math.PI / 2], type: "scatter" as const, mode: "markers" as const, name: "Δφ = π/2", marker: { color: "#facc15", size: 10 }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [calc.sigma, calc.S, calc.arw, calc.maxRateDegS, D_mm, lambda_nm, L]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Coil Diameter (mm)" value={coilDiameterRaw} onChange={setCoilDiameter} min={1} max={1000} />
        <ValidatedNumberInput label="Fiber Length (m)" value={fiberLengthRaw} onChange={setFiberLength} min={1} max={10000} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={400} max={2000} />
        <ValidatedNumberInput label="Group Index n_g (transit time only)" value={groupIndexRaw} onChange={setGroupIndex} min={1} max={2} step="any" />
        <ValidatedNumberInput label="Source Power (mW)" value={sourcePowerRaw} onChange={setSourcePower} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Loss, Source to Detector at Bias (dB)" value={lossesRaw} onChange={setLosses} min={0} max={60} step="any" />
        <ValidatedNumberInput label="Detector Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Scale Factor S" value={`${calc.S.toPrecision(5)} s`} sub="Δφ per rad/s" tone="text-red-400" />
        <Card label="ARW (shot noise)" value={`${calc.arw.toExponential(3)} °/√h`} sub={`Allan N; one-sided rate ASD ${calc.rateDegH.toExponential(3)} (°/h)/√Hz`} tone="text-blue-400" />
        <Card label="Earth-Rate Phase" value={`${calc.phaseEarth.toExponential(3)} rad`} sub="Ω_E = 15.04 °/h, axis at the pole" tone="text-green-400" />
        <Card label="Phase Noise σ_φ" value={`${(calc.sigma * 1e9).toPrecision(4)} nrad/√Hz`} sub={`P_d = ${(calc.Pd * 1e3).toPrecision(4)} mW at ±π/2 bias`} tone="text-yellow-400" />
        <Card label="Transit Time" value={`${(calc.tau * 1e6).toPrecision(4)} µs`} sub="n_g·L/c" tone="text-purple-400" />
        <Card label="Proper Frequency" value={`${(calc.fp / 1e3).toPrecision(4)} kHz`} sub="1/(2τ): bias modulation" tone="text-purple-400" />
        <Card label="Max unambiguous rate" value={`${calc.maxRateDegS.toPrecision(4)} °/s`} sub="Sagnac phase reaches π/2: π/(2S)" tone="text-gray-200" />
        <Card label="Turns" value={calc.turns.toFixed(0)} sub="L/(πD)" tone="text-gray-200" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Sagnac phase: Δφ = S·Ω, S = 2πLD/(λc) (no dependence on the fibre index)</p>
          <p>Shot noise at ±π/2 bias: σ_φ = √(2hν/(η·P_d)) rad/√Hz, P_d = P_source·10^(−loss/10)</p>
          <p>Rate noise (one-sided ASD): σ_Ω = σ_φ/S</p>
          <p>ARW (Allan, σ²(τ) = N²/τ): N [°/√h] = σ_Ω [(°/h)/√Hz] / (60·√2) (IEEE Std 952)</p>
          <p>Transit time τ = n_g·L/c; proper frequency f_p = 1/(2τ)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          The loss includes the 3 dB of the ±π/2 bias point, the coupler passes, the polarizer and splices.
          Datasheets that divide the one-sided ASD by 60 alone quote an ARW √2 higher. Ideal shot-noise limit. Broadband sources add excess intensity noise, often the larger term, and the
          length trade-off with fibre attenuation is left to the loss input.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Fiber Length (m)", gridcolor: "#374151", domain: [0, 0.45], type: "log" },
        yaxis: { title: "ARW (°/√h)", gridcolor: "#374151", type: "log" },
        xaxis2: { title: "Rotation Rate (°/s)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
        yaxis2: { title: "Sagnac Phase (rad)", gridcolor: "#374151", anchor: "x2" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </>
  );
}
