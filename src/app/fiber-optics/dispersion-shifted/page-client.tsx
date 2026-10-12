"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  FIBER_PRESETS, G652_LAMBDA0, G652_S0, type FiberPresetKey, channelAt, dispersionLimitedLength, linearZeroDispersionWavelength,
  presetDispersion, sellmeierSlope,
} from "../../../physics/fiber-optics/chromatic-dispersion";

const nm = 1e-9, km = 1e3;
const PS_NM_KM = 1e-6, PS_NM2_KM = 1e3;
const KEYS = Object.keys(FIBER_PRESETS) as FiberPresetKey[];
const COLORS: Record<FiberPresetKey, string> = {
  G652: "#f87171", DSF: "#a78bfa", NZDSF_PLUS: "#34d399", NZDSF_MINUS: "#60a5fa", DCF: "#fbbf24",
};
// Linear-about-1550 presets are valid across the S, C and L bands only.
const BAND_MIN = 1460, BAND_MAX = 1625;

export default function DispersionShiftedCalculator() {
  const [fiberKey, setFiberKey] = useURLState("fiberType", "NZDSF_PLUS");
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 80); // km
  const [bitRate, setBitRate] = useURLState("bitRate", 10); // Gb/s
  const [sigmaLambda, setSigmaLambda] = useURLState("spectralWidth", 0.1); // nm, rms

  const key: FiberPresetKey = (KEYS as string[]).includes(fiberKey) ? (fiberKey as FiberPresetKey) : "NZDSF_PLUS";
  const p = FIBER_PRESETS[key];
  const valid = wavelength >= BAND_MIN && wavelength <= BAND_MAX && fiberLength > 0 && bitRate > 0 && sigmaLambda >= 0;

  const calc = useMemo(() => {
    const preset = FIBER_PRESETS[key];
    const lam = wavelength * nm;
    const D = presetDispersion(key, lam);
    const S = key === "G652" ? sellmeierSlope(lam, G652_LAMBDA0, G652_S0) : preset.S;
    const lambda0 = key === "G652" ? G652_LAMBDA0 : linearZeroDispersionWavelength(preset);
    const Lmax = dispersionLimitedLength(channelAt({ D, S }, lam, sigmaLambda * nm), bitRate * 1e9);
    return { D, S, lambda0, Lmax, total: D * fiberLength * km, loss: preset.alphaDbPerKm * fiberLength };
  }, [key, wavelength, fiberLength, bitRate, sigmaLambda]);

  const plotData = useMemo(() => {
    const wls = Array.from({ length: (BAND_MAX - BAND_MIN) / 5 + 1 }, (_, i) => BAND_MIN + i * 5);
    return [
      ...KEYS.map(k => ({
        x: wls, y: wls.map(w => presetDispersion(k, w * nm) / PS_NM_KM), type: "scatter" as const, mode: "lines" as const,
        name: FIBER_PRESETS[k].label, line: { color: COLORS[k], width: k === key ? 3 : 1, dash: k === key ? undefined : ("dot" as const) },
      })),
      {
        x: [wavelength], y: [valid ? calc.D / PS_NM_KM : null], type: "scatter" as const, mode: "markers" as const,
        name: "Current λ", marker: { color: "#f3f4f6", size: 12 },
      },
    ];
  }, [key, wavelength, valid, calc.D]);

  const layout = {
    title: "Dispersion vs Wavelength (S, C and L bands)",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Dispersion D (ps/(nm·km))", gridcolor: "#374151", zeroline: true, zerolinecolor: "#ef4444" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.02 }, height: 420,
  };

  const row = (label: string, value: string, cls = "font-mono") => (
    <div className="flex justify-between"><span className="text-gray-400">{label}</span><span className={cls}>{value}</span></div>
  );
  const show = (v: number, digits: number, unit: string) =>
    !valid ? "—" : v === Infinity ? "∞" : Number.isFinite(v) ? `${v.toFixed(digits)} ${unit}` : "—";

  return (
    <>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Type</label>
              <select value={key} onChange={(e) => setFiberKey(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                {KEYS.map(k => <option key={k} value={k}>{FIBER_PRESETS[k].label}</option>)}
              </select>
            </div>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={BAND_MIN} max={BAND_MAX} step="1" />
            <ValidatedNumberInput label="Fiber Length (km)" value={fiberLength} onChange={setFiberLength} min={0.001} step="10" />
            <ValidatedNumberInput label="Bit Rate (Gb/s)" value={bitRate} onChange={setBitRate} min={0.001} step="1" />
            <ValidatedNumberInput label="Source rms Spectral Width σ_λ (nm)" value={sigmaLambda} onChange={setSigmaLambda} min={0} step="0.01" />
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                {row("Zero-dispersion λ₀:", key !== "G652" && !(calc.lambda0 >= BAND_MIN * nm && calc.lambda0 <= BAND_MAX * nm) ? "outside 1460–1625 nm" : show(calc.lambda0 / nm, 0, "nm"))}
                {row("Dispersion slope S(λ):", show(calc.S / PS_NM2_KM, 4, "ps/(nm²·km)"))}
                {row("D(λ):", show(calc.D / PS_NM_KM, 2, "ps/(nm·km)"), "font-mono text-lg text-blue-400")}
                {row("Accumulated D·L:", show(calc.total / (PS_NM_KM * km), 0, "ps/nm"))}
                {row("Attenuation (typical):", `${p.alphaDbPerKm} dB/km`)}
                {row("Fibre loss:", show(calc.loss, 1, "dB"))}
                {row("Dispersion-limited length:", show(calc.Lmax / km, 1, "km"), "font-mono text-green-400")}
              </div>
              <p className="mt-3 text-xs text-gray-500">Limit: 4Bσ ≤ 1 on the output rms width, with the input pulse width chosen to minimise it (Agrawal; covers broad and narrow sources and β₃ at λ₀).</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">D(λ) = D₁₅₅₀ + S·(λ − 1550 nm)</p>
              <p className="font-mono text-sm mt-1">G.652: D(λ) = (S₀/4)(λ − λ₀⁴/λ³)</p>
              <p className="font-mono text-sm mt-1">σ_D = L·√((Dσ_λ)² + ½(Sσ_λ²)²)</p>
              <p className="font-mono text-sm mt-1">σ² ≈ σ_D² + |β₂|L (optimum input width), L_max: 4Bσ = 1</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
    </>
  );
}
