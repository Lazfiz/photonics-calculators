"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { wavelengthWidth } from "../../../physics/spectroscopy/wavenumber";
import { fwmPhaseMismatch } from "../../../physics/fiber-optics/fiber-nonlinear";
import {
  beta2FromD, beta3FromDS, linearDispersion, linearZeroDispersionWavelength, presetDispersion,
} from "../../../physics/fiber-optics/chromatic-dispersion";

const nm = 1e-9, km = 1e3;
const PS_NM_KM = 1e-6, PS_NM2_KM = 1e3;
// The linear model about 1550 nm holds across the S, C and L bands only.
const BAND_MIN = 1460, BAND_MAX = 1625;
const C_BAND = [1530, 1565] as const; // nm

export default function NonzeroDispersionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: BAND_MIN, max: BAND_MAX }); // nm
  const [length, setLength] = useURLState("length", 80, { min: 0.001 }); // km
  const [dispSlope, setDispSlope] = useURLState("dispSlope", 0.05, { min: -0.2, max: 0.2 }); // ps/(nm²·km)
  const [dispAt1550, setDispAt1550] = useURLState("dispAt1550", 4.5, { min: -20, max: 20 }); // ps/(nm·km), typical NZ-DSF+
  const [channelSpacing, setChannelSpacing] = useURLState("channelSpacing", 100, { min: 1 }); // GHz

  const valid = wavelength >= BAND_MIN && wavelength <= BAND_MAX && length > 0 && channelSpacing > 0;

  const calc = useMemo(() => {
    const lam = wavelength * nm;
    const fiber = { D: dispAt1550 * PS_NM_KM, S: dispSlope * PS_NM2_KM };
    const D = linearDispersion(fiber, lam);
    const lambda0 = linearZeroDispersionWavelength(fiber);
    // Channel spacing in wavelength Δλ = λ²Δν/c; FWM phase mismatch between adjacent channels (degenerate, equal spacing),
    // Δβ = −(2πΔν)²[β₂ + β₃·2πΔν], including β₃; the smaller of the ± offsets (stronger FWM) is shown.
    const dnu = channelSpacing * 1e9;
    const deltaLambda = wavelengthWidth(lam, dnu);
    const beta2 = beta2FromD(D, lam);
    const beta3 = beta3FromDS(D, fiber.S, lam);
    const deltaBeta = Math.min(
      Math.abs(fwmPhaseMismatch(beta2, dnu, dnu, beta3)),
      Math.abs(fwmPhaseMismatch(beta2, -dnu, -dnu, beta3)),
    );
    const lambda0InBand = Number.isFinite(lambda0) && dispSlope !== 0 && lambda0 / nm >= BAND_MIN && lambda0 / nm <= BAND_MAX;
    // Linear D(λ) is monotonic, so the C-band extremes are at its ends.
    const dC1 = linearDispersion(fiber, C_BAND[0] * nm), dC2 = linearDispersion(fiber, C_BAND[1] * nm);
    const dCMin = Math.min(dC1, dC2), dCMax = Math.max(dC1, dC2);
    const dSMF = presetDispersion("G652", lam);
    const dDSF = presetDispersion("DSF", lam);
    return { D, lambda0, lambda0InBand, dCMin, dCMax, totalDisp: D * length * km, deltaLambda, deltaBeta, dSMF, dDSF };
  }, [wavelength, length, dispSlope, dispAt1550, channelSpacing]);

  const dispCurveData = useMemo(() => {
    const wls = Array.from({ length: (BAND_MAX - BAND_MIN) / 5 + 1 }, (_, i) => BAND_MIN + i * 5);
    const fiber = { D: dispAt1550 * PS_NM_KM, S: dispSlope * PS_NM2_KM };
    return [
      { x: wls, y: wls.map(w => presetDispersion("G652", w * nm) / PS_NM_KM), type: "scatter" as const, mode: "lines" as const, name: "SMF (G.652)", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: wls.map(w => presetDispersion("DSF", w * nm) / PS_NM_KM), type: "scatter" as const, mode: "lines" as const, name: "DSF (G.653)", line: { color: "#a78bfa", dash: "dot" } },
      { x: wls, y: wls.map(w => linearDispersion(fiber, w * nm) / PS_NM_KM), type: "scatter" as const, mode: "lines" as const, name: "NZ-DSF (G.655)", line: { color: "#34d399", width: 2.5 } },
      { x: [wavelength], y: [valid ? calc.D / PS_NM_KM : null], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelength, dispSlope, dispAt1550, valid, calc.D]);

  const accumulatedData = useMemo(() => {
    const lengths = Array.from({ length: 101 }, (_, i) => (i * 1.5 * length) / 100);
    const toPsNm = (D: number) => (D * km) / (PS_NM_KM * km); // per km of length
    return [
      { x: lengths, y: lengths.map(l => l * toPsNm(calc.dSMF)), type: "scatter" as const, mode: "lines" as const, name: "SMF", line: { color: "#f87171" } },
      { x: lengths, y: lengths.map(l => l * toPsNm(calc.dDSF)), type: "scatter" as const, mode: "lines" as const, name: "DSF", line: { color: "#a78bfa" } },
      { x: lengths, y: lengths.map(l => l * toPsNm(calc.D)), type: "scatter" as const, mode: "lines" as const, name: "NZ-DSF", line: { color: "#34d399", width: 2 } },
      { x: [length], y: [valid ? length * toPsNm(calc.D) : null], type: "scatter" as const, mode: "markers" as const, name: "Link length", marker: { color: "#fbbf24", size: 10 } },
    ];
  }, [length, valid, calc]);

  const show = (v: number, digits: number, unit = "") =>
    !valid ? "—" : Number.isFinite(v) ? `${v.toFixed(digits)}${unit}` : "—";
  // |D| below 1e-3 ps/(nm·km) counts as zero: λ − 1550 nm in floating point leaves ~1e-22 s/m² at λ₀.
  const nzZero = Math.abs(calc.D) < 1e-3 * PS_NM_KM;
  const fwmRisk = valid && (Math.min(Math.abs(calc.dCMin), Math.abs(calc.dCMax)) < 1 * PS_NM_KM || calc.dCMin * calc.dCMax < 0);
  const ratio = Math.abs(calc.dSMF) / Math.abs(calc.D);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={BAND_MIN} max={BAND_MAX} />
        <ValidatedNumberInput label="Link Length (km)" value={length} onChange={setLength} min={0.001} />
        <ValidatedNumberInput label="D @ 1550 nm (ps/nm/km)" value={dispAt1550} onChange={setDispAt1550} min={-20} max={20} step="0.1" />
        <ValidatedNumberInput label="Dispersion Slope S (ps/nm²/km)" value={dispSlope} onChange={setDispSlope} min={-0.2} max={0.2} step="0.001" />
        <ValidatedNumberInput label="Channel Spacing (GHz)" value={channelSpacing} onChange={setChannelSpacing} min={1} />
      </div>

      {fwmRisk && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          D runs from {(calc.dCMin / PS_NM_KM).toFixed(2)} to {(calc.dCMax / PS_NM_KM).toFixed(2)} ps/(nm·km) over {C_BAND[0]}–{C_BAND[1]} nm
          (linear model): four-wave mixing risk. NZ-DSF keeps |D| ≥ 1 ps/(nm·km) across the C band.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D(λ) NZ-DSF</p>
          <p className="text-xl font-bold text-green-400">{show(calc.D / PS_NM_KM, 2, " ps/nm/km")}</p>
          <p className="text-xs text-gray-500">{!valid ? "λ₀ = —" : calc.lambda0InBand ? `λ₀ = ${(calc.lambda0 / nm).toFixed(0)} nm` : `no zero in ${BAND_MIN}–${BAND_MAX} nm`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Accumulated D·L</p>
          <p className="text-xl font-bold text-yellow-400">{show(calc.totalDisp / (PS_NM_KM * km), 0, " ps/nm")}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Channel Spacing Δλ</p>
          <p className="text-xl font-bold text-blue-400">{show(calc.deltaLambda / nm, 3, " nm")}</p>
          <p className="text-xs text-gray-500">FWM Δβ = {show(calc.deltaBeta * km, 3, " rad/km")}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SMF (G.652) at this λ</p>
          <p className="text-xl font-bold text-red-400">{show(calc.dSMF / PS_NM_KM, 1, " ps/nm/km")}</p>
          <p className="text-xs text-gray-500">{!valid ? "—" : nzZero ? "NZ-DSF D ≈ 0 here" : `|D| ${ratio.toFixed(1)}× the NZ-DSF value`}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Chromatic Dispersion vs Wavelength</h3>
        <ChartPanel data={dispCurveData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "D (ps/nm·km)", color: "#9ca3af", gridcolor: "#374151", zeroline: true, zerolinecolor: "#6b7280" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Accumulated Dispersion vs Distance</h3>
        <ChartPanel data={accumulatedData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Total Dispersion (ps/nm)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>D(λ) = D(1550) + S · (λ − 1550 nm),  λ₀ = 1550 nm − D(1550)/S</p>
          <p>G.652 reference: D(λ) = (S₀/4)(λ − λ₀⁴/λ³), S₀ = 0.092, λ₀ = 1310 nm</p>
          <p>Δλ = λ² · Δν / c</p>
          <p>Δβ_FWM = −(2πΔν)²[β₂ + β₃·2πΔν],  β₂ = −λ²D/(2πc),  β₃ = (λ²/2πc)²(S + 2D/λ)</p>
          <p>G.655.C: 1 ≤ |D| ≤ 10 ps/(nm·km) over 1530–1565 nm</p>
          <p>Trade-off: low |D| → stronger FWM; high |D| → more compensation needed</p>
        </div>
      </div>
    </>
  );
}
