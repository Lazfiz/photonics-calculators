"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { couplingCoefficient } from "../../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V, MIN_V, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtDbm = (x: number) => (Number.isFinite(x) ? `${x.toFixed(2)} dBm` : "— (no power)");

export default function FiberCouplerCalculator() {
  const [couplingLength, setCouplingLength] = useURLState("couplingLength", 1.4, { min: 0, max: 1000 }); // mm
  const [coreSpacing, setCoreSpacing] = useURLState("coreSpacing", 12, { min: 1, max: 100 }); // µm, centre to centre
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1, { min: 0.5, max: 30 }); // µm
  const [na, setNa] = useURLState("na", 0.125, { min: 0.01, max: 0.5 });
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4494, { min: 1, max: 4 });
  const [excessLoss, setExcessLoss] = useURLState("excessLoss", 0.1, { min: 0, max: 30 }); // dB
  const [inputPower, setInputPower] = useURLState("inputPower", 0, { min: -100, max: 50 }); // dBm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2500 }); // nm

  const fiber = useMemo(() => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: na }), [coreRadius, coreIndex, na]);
  const kappaAt = useMemo(
    () => (lambda_nm: number) => couplingCoefficient(fiber, lambda_nm * 1e-9, coreSpacing * 1e-6) * 1e-3, // 1/mm
    [fiber, coreSpacing],
  );

  const lossLinear = 10 ** (-excessLoss / 10);
  const calc = useMemo(() => {
    const V = vNumber(fiber, wavelength * 1e-9);
    const kappa = kappaAt(wavelength); // 1/mm
    const ratio = Math.sin(kappa * couplingLength) ** 2; // fraction coupled to port 2 (identical cores)
    return {
      V, kappa, ratio,
      through: inputPower + 10 * Math.log10((1 - ratio) * lossLinear),
      coupled: inputPower + 10 * Math.log10(ratio * lossLinear),
      L5050: Math.PI / (4 * kappa),
      Lfull: Math.PI / (2 * kappa),
      // Fractional change of κ per nm, from κ at ±1 nm.
      slope: (kappaAt(wavelength + 1) - kappaAt(wavelength - 1)) / (2 * kappa),
    };
  }, [fiber, wavelength, kappaAt, couplingLength, inputPower, lossLinear]);

  const transferCurve = useMemo(() => {
    const lengths: number[] = [];
    const through: number[] = [];
    const coupled: number[] = [];
    const span = Number.isFinite(calc.Lfull) ? Math.max(3 * calc.Lfull, 1.2 * couplingLength) : 0;
    // ≥ 40 points per power-exchange period 2L_full, at most 6,000 (beyond that the curve is a solid band anyway).
    const n = Math.min(6000, Math.max(300, Math.ceil((40 * span) / (2 * calc.Lfull))));
    for (let i = 0; i <= n && span > 0; i++) {
      const l = (i * span) / n;
      const s2 = Math.sin(calc.kappa * l) ** 2;
      lengths.push(l);
      through.push((1 - s2) * lossLinear);
      coupled.push(s2 * lossLinear);
    }
    return [
      { x: lengths, y: through, type: "scatter" as const, mode: "lines" as const, name: "Through port", line: { color: "#3b82f6", width: 2 } },
      { x: lengths, y: coupled, type: "scatter" as const, mode: "lines" as const, name: "Coupled port", line: { color: "#ef4444", width: 2 } },
      { x: [couplingLength, couplingLength], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Current length", line: { color: "#22c55e", width: 1, dash: "dash" as const } },
    ];
  }, [calc.kappa, calc.Lfull, couplingLength, lossLinear]);

  const spectralResponse = useMemo(() => {
    const wavelengths: number[] = [];
    const throughSpec: (number | null)[] = [];
    const coupledSpec: (number | null)[] = [];
    // κL changes by ≈ |slope| κ L rad per nm: keep ≥ 40 points per π of it over the 200 nm window (200 to 6,000 points).
    const phasePerNm = Math.abs(calc.slope * calc.kappa * couplingLength);
    const n = Number.isFinite(phasePerNm) ? Math.min(6000, Math.max(200, Math.ceil((40 * 200 * phasePerNm) / Math.PI))) : 200;
    for (let i = 0; i <= n; i++) {
      const w = wavelength - 100 + (200 * i) / n;
      const kappa = kappaAt(w);
      const s2 = Math.sin(kappa * couplingLength) ** 2;
      wavelengths.push(w);
      throughSpec.push(Number.isFinite(s2) ? (1 - s2) * lossLinear : null);
      coupledSpec.push(Number.isFinite(s2) ? s2 * lossLinear : null);
    }
    return [
      { x: wavelengths, y: throughSpec, type: "scatter" as const, mode: "lines" as const, name: "Through port", line: { color: "#3b82f6", width: 2 } },
      { x: wavelengths, y: coupledSpec, type: "scatter" as const, mode: "lines" as const, name: "Coupled port", line: { color: "#ef4444", width: 2 } },
    ];
  }, [kappaAt, wavelength, couplingLength, lossLinear, calc.slope, calc.kappa]);

  const valid = Number.isFinite(calc.kappa);
  const chartLayout = (title: string, x: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    title,
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: "Normalized power", gridcolor: "#374151", range: [0, 1.05] },
    legend: { x: 0.02, y: 0.98 },
    margin: { t: 40, r: 30, b: 50, l: 60 }, height: 360,
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Coupling Length L (mm)" value={couplingLength} onChange={setCouplingLength} min={0} max={1000} step="0.1" />
        <ValidatedNumberInput label="Core Spacing D (µm)" value={coreSpacing} onChange={setCoreSpacing} min={1} max={100} step="0.1" />
        <ValidatedNumberInput label="Core Radius a (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={30} step="0.1" />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.01} max={0.5} step="0.001" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} step="1" />
        <ValidatedNumberInput label="Excess Loss (dB)" value={excessLoss} onChange={setExcessLoss} min={0} max={30} step="0.01" />
        <ValidatedNumberInput label="Input Power (dBm)" value={inputPower} onChange={setInputPower} min={-100} max={50} step="0.1" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs a core spacing D ≥ 2a = {(2 * coreRadius).toFixed(1)} µm (separate cores), 0 &lt; NA &lt; n₁ and
          V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}).
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; {LP11_CUTOFF_V.toFixed(3)}: the cores are not single-mode; only LP01 coupling is computed.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Coupling ratio" value={valid ? `${(calc.ratio * 100).toFixed(1)} : ${(100 - calc.ratio * 100).toFixed(1)}` : "—"} tone="purple" subtext="coupled : through, before excess loss" />
        <ResultCard label="Coupling coefficient κ" value={valid ? `${calc.kappa.toPrecision(3)} mm⁻¹` : "—"} tone="blue" subtext={`V = ${fmt(calc.V, 3)}; dκ/dλ ÷ κ = ${fmt(100 * calc.slope, 3, " %")} per nm`} />
        <ResultCard label="Length for 50:50" value={fmt(calc.L5050, 3, " mm")} tone="green" subtext={`full transfer at ${fmt(calc.Lfull, 3, " mm")}`} />
        <ResultCard label="Port powers" value={valid ? fmtDbm(calc.coupled) : "—"} tone="red" subtext={`coupled; through ${valid ? fmtDbm(calc.through) : "—"}`} />
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={transferCurve} layout={chartLayout("Power transfer vs coupling length", "Coupling length (mm)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={spectralResponse} layout={chartLayout(`Spectral response, L = ${couplingLength} mm`, "Wavelength (nm)")} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">P_coupled = P_in sin²(κL) 10^(−α/10),  P_through = P_in cos²(κL) 10^(−α/10)</p>
          <p className="font-mono">κ(λ) = (NA/(n₁a)) (U²/V³) K₀(WD/a) / K₁²(W),  L₅₀:₅₀ = π/(4κ)</p>
          <p>
            Two identical, parallel single-mode cores a distance D apart exchange power through their evanescent fields. κ is
            Snyder&apos;s coupled-mode coefficient, computed from the exact LP01 eigenvalues U and W at each wavelength. For well-separated cores a longer
            wavelength spreads the mode further into the cladding, so κ grows with λ and the coupler is wavelength-dependent; that is
            the wavelength dependence that WDM couplers exploit.
          </p>
          <p className="text-gray-400">
            Not included: fused biconical taper couplers, where the light couples through cladding modes of the narrowed waist and κ
            follows a different law; dispersion of n₁ and NA; unequal cores (incomplete transfer); and polarization dependence.
          </p>
        </div>
      </div>
    </>
  );
}
