"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  FWHM_TO_RMS, beta2FromD, beta3FromDS, dispersionLength, gaussianPulseRmsWidth, sellmeierDispersion, sellmeierSlope,
  optimumOutputRmsWidth, sigmaOmegaFromLambda, transformLimitedBitRate,
} from "../../../physics/fiber-optics/chromatic-dispersion";
import { dispersionPenaltyDb, rmsBroadening } from "../../../physics/fiber-optics/dispersion-comp";

const nm = 1e-9, km = 1e3, ps = 1e-12;
const PS_NM_KM = 1e-6, PS_NM2_KM = 1e3, PS2_KM = 1e-27, PS3_KM = 1e-39;

const fmt = (v: number, digits: number, unit: string) =>
  v === Infinity ? "∞" : Number.isFinite(v) ? `${v.toFixed(digits)} ${unit}` : "—";

export default function ChromaticDispersionPage() {
  const [S0, setS0] = useURLState("dispersionSlope", 0.092, { min: 0.01, max: 0.2 }); // ps/(nm²·km), G.652 maximum
  const [lambda0, setLambda0] = useURLState("zeroDispWavelength", 1310, { min: 1200, max: 1700 }); // nm
  const [length, setLength] = useURLState("length", 80, { min: 0.001 }); // km
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 1260, max: 1625 }); // nm
  const [sigmaLambda, setSigmaLambda] = useURLState("sourceLineWidth", 0.1, { min: 0 }); // nm, rms
  const [pulseFwhm, setPulseFwhm] = useURLState("pulseWidth", 50, { min: 0.01 }); // ps
  const [bitRate, setBitRate] = useURLState("bitRate", 1, { min: 0.001 }); // Gb/s

  const valid = S0 > 0 && lambda0 > 0 && length > 0 && wavelength >= 1260 && wavelength <= 1625 && sigmaLambda >= 0 && pulseFwhm > 0 && bitRate > 0;

  const calc = useMemo(() => {
    if (!valid) return null;
    const lam = wavelength * nm, L = length * km, sl = sigmaLambda * nm;
    const D = sellmeierDispersion(lam, lambda0 * nm, S0 * PS_NM2_KM);
    const S = sellmeierSlope(lam, lambda0 * nm, S0 * PS_NM2_KM);
    const beta2 = beta2FromD(D, lam);
    const beta3 = beta3FromDS(D, S, lam);
    const sigma0 = pulseFwhm * ps * FWHM_TO_RMS;
    const sigmaOmega = sigmaOmegaFromLambda(sl, lam);
    const sigmaOut = gaussianPulseRmsWidth({ sigma0, beta2, beta3, L, sigmaOmega });
    const sigmaD = rmsBroadening(D * L, S * L, sl);
    return {
      D, S, beta2, beta3, sigma0, sigmaOut, sigmaD,
      V: 2 * sigmaOmega * sigma0,
      LD: dispersionLength(Math.SQRT2 * sigma0, beta2),
      bOptimum: 1 / (4 * optimumOutputRmsWidth(beta2, beta3, L, sigmaOmega)),
      bCoherent: transformLimitedBitRate(beta2, L),
      penalty: dispersionPenaltyDb(bitRate * 1e9, sigmaD),
    };
  }, [valid, S0, lambda0, length, wavelength, sigmaLambda, pulseFwhm, bitRate]);

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 183 }, (_, i) => 1260 + i * 2);
    const D = wls.map(w => (valid ? sellmeierDispersion(w * nm, lambda0 * nm, S0 * PS_NM2_KM) / PS_NM_KM : null));
    return [
      { x: wls, y: D, type: "scatter" as const, mode: "lines" as const, name: "D(λ)", line: { color: "#3b82f6", width: 2 } },
      { x: [wavelength], y: [calc ? calc.D / PS_NM_KM : null], type: "scatter" as const, mode: "markers" as const, name: "Operating λ", marker: { color: "#f87171", size: 10 } },
      { x: [lambda0], y: [0], type: "scatter" as const, mode: "markers" as const, name: "λ₀", marker: { color: "#fbbf24", size: 10, symbol: "diamond" } },
    ];
  }, [valid, S0, lambda0, wavelength, calc]);

  const lengthData = useMemo(() => {
    if (!valid) return [];
    const lam = wavelength * nm, sl = sigmaLambda * nm;
    const D = sellmeierDispersion(lam, lambda0 * nm, S0 * PS_NM2_KM);
    const S = sellmeierSlope(lam, lambda0 * nm, S0 * PS_NM2_KM);
    const beta2 = beta2FromD(D, lam), beta3 = beta3FromDS(D, S, lam);
    const sigma0 = pulseFwhm * ps * FWHM_TO_RMS;
    const sigmaOmega = sigmaOmegaFromLambda(sl, lam);
    const lengths = Array.from({ length: 100 }, (_, i) => ((i + 1) * 2 * length) / 100);
    const width = lengths.map(l => gaussianPulseRmsWidth({ sigma0, beta2, beta3, L: l * km, sigmaOmega }) / ps);
    // Plotly can't draw Infinity: a closed eye shows as a gap.
    const penalty = lengths.map(l => {
      const p = dispersionPenaltyDb(bitRate * 1e9, rmsBroadening(D * l * km, S * l * km, sl));
      return Number.isFinite(p) ? p : null;
    });
    return [
      { x: lengths, y: width, type: "scatter" as const, mode: "lines" as const, name: "Output rms width (ps)", line: { color: "#22c55e" }, yaxis: "y" },
      { x: lengths, y: penalty, type: "scatter" as const, mode: "lines" as const, name: "Penalty (dB)", line: { color: "#f97316" }, yaxis: "y2" },
    ];
  }, [valid, S0, lambda0, length, wavelength, sigmaLambda, pulseFwhm, bitRate]);

  const card = "bg-gray-900 border border-gray-800 rounded-lg p-4";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Zero-Dispersion Wavelength λ₀ (nm)" value={lambda0} onChange={setLambda0} min={1200} max={1700} step="1" />
        <ValidatedNumberInput label="Zero-Dispersion Slope S₀ (ps/nm²/km)" value={S0} onChange={setS0} min={0.01} max={0.2} step="0.001" />
        <ValidatedNumberInput label="Operating Wavelength (nm)" value={wavelength} onChange={setWavelength} min={1260} max={1625} step="1" />
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0.001} step="1" />
        <ValidatedNumberInput label="Source rms Spectral Width σ_λ (nm)" value={sigmaLambda} onChange={setSigmaLambda} min={0} step="0.01" />
        <ValidatedNumberInput label="Input Pulse FWHM (ps)" value={pulseFwhm} onChange={setPulseFwhm} min={0.01} step="1" />
        <ValidatedNumberInput label="Bit Rate (Gb/s)" value={bitRate} onChange={setBitRate} min={0.001} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className={card}>
          <p className="text-sm text-gray-400">D(λ)</p>
          <p className="text-xl font-bold text-blue-400">{calc ? fmt(calc.D / PS_NM_KM, 2, "ps/(nm·km)") : "—"}</p>
          <p className="text-xs text-gray-500">S(λ) = {calc ? (calc.S / PS_NM2_KM).toFixed(4) : "—"} ps/(nm²·km)</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Accumulated Dispersion D·L</p>
          <p className="text-xl font-bold text-green-400">{calc ? fmt((calc.D * length * km) / (PS_NM_KM * km), 0, "ps/nm") : "—"}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">β₂ / β₃</p>
          <p className="text-xl font-bold text-purple-400">{calc ? fmt(calc.beta2 / PS2_KM, 2, "ps²/km") : "—"}</p>
          <p className="text-xs text-gray-500">β₃ = {calc ? (calc.beta3 / PS3_KM).toFixed(4) : "—"} ps³/km</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Dispersion Length L_D</p>
          <p className="text-xl font-bold text-purple-400">{calc ? fmt(calc.LD / km, 2, "km") : "—"}</p>
          <p className="text-xs text-gray-500">T₀ = √2·σ₀ (1/e half-width)</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className={card}>
          <p className="text-sm text-gray-400">Output rms Width σ</p>
          <p className="text-xl font-bold text-yellow-400">{calc ? fmt(calc.sigmaOut / ps, 2, "ps") : "—"}</p>
          <p className="text-xs text-gray-500">from σ₀ = {calc ? (calc.sigma0 / ps).toFixed(2) : "—"} ps; V_ω = {calc ? calc.V.toFixed(2) : "—"}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Bit-Rate Limit, Optimum Pulse</p>
          <p className="text-xl font-bold text-cyan-400">{calc ? fmt(calc.bOptimum / 1e9, 2, "Gb/s") : "—"}</p>
          <p className="text-xs text-gray-500">4Bσ ≤ 1 with σ₀ chosen to minimise σ (this source)</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Limit for σ_λ → 0, β₃ = 0</p>
          <p className="text-xl font-bold text-cyan-400">{calc ? fmt(calc.bCoherent / 1e9, 2, "Gb/s") : "—"}</p>
          <p className="text-xs text-gray-500">B√(|β₂|L) ≤ ¼</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Dispersion Penalty at {bitRate} Gb/s</p>
          <p className={`text-xl font-bold ${!calc || !(calc.penalty <= 1) ? "text-red-400" : calc.penalty > 0.5 ? "text-yellow-400" : "text-green-400"}`}>
            {calc ? (calc.penalty === Infinity ? "eye closed" : fmt(calc.penalty, 2, "dB")) : "—"}
          </p>
          <p className="text-xs text-gray-500">{calc && calc.V < 1 ? "V_ω < 1: narrow source, use the transform-limited limit" : "broad source, −5 log₁₀(1 − (4Bσ_D)²)"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Dispersion vs Wavelength</h3>
        <ChartPanel data={spectralData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "D (ps/(nm·km))", gridcolor: "#374151", color: "#9ca3af" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Pulse Width & Penalty vs Length</h3>
        <ChartPanel data={lengthData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Length (km)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Output rms width (ps)", gridcolor: "#374151", color: "#22c55e" },
          yaxis2: { title: "Penalty (dB)", gridcolor: "#374151", color: "#f97316", overlaying: "y", side: "right" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 60, b: 40, l: 60 }, height: 350,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>D(λ) = (S₀/4)(λ − λ₀⁴/λ³)  [ITU-T G.652; S₀ ≤ 0.092, 1300 ≤ λ₀ ≤ 1324 nm]</p>
          <p>β₂ = −λ²D/(2πc),  β₃ = (λ²/2πc)²(S + 2D/λ)</p>
          <p>σ²/σ₀² = 1 + (1 + V²)(β₂L/2σ₀²)² + ½(1 + V²)²(β₃L/4σ₀³)²,  V = 2σ_ωσ₀  [Agrawal §2.4.2, unchirped]</p>
          <p>σ_D = √((DLσ_λ)² + ½(SLσ_λ²)²)  [broad source]; optimum σ₀, β₃ = 0: σ² = σ_D² + |β₂|L</p>
          <p>Penalty = −5 log₁₀(1 − (4Bσ_D)²) dB</p>
        </div>
      </div>
    </>
  );
}
