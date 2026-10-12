"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  SELLMEIER_FIBERS, type ChannelDispersion, type SellmeierFiberKey, channelAt, channelRmsWidth, dispersionLimitedLength,
  gaussianBandwidth, gaussianRmsFromBandwidth, optimumOutputRmsWidth, sellmeierDispersion, sellmeierSlope,
} from "../../../physics/fiber-optics/chromatic-dispersion";
import { MEAN_DGD_BIT_FRACTION, meanDgd, pmdLimitedLength } from "../../../physics/fiber-optics/polarization-mode-dispersion";

const nm = 1e-9, km = 1e3, ps = 1e-12;
const PS_NM_KM = 1e-6;
const PS_SQRT_KM = 1e-12 / Math.sqrt(1e3); // ps/√km → s/√m
const MHZ_KM = 1e9; // MHz·km → Hz·m
const KEYS = Object.keys(SELLMEIER_FIBERS) as SellmeierFiberKey[];
const RATES = [1, 2.5, 10, 25, 40, 50, 100, 200, 400]; // Gb/s
// Default source rms widths when a fibre is picked: a narrow DFB laser for SMF; a VCSEL for MMF at 850 nm.
const SMF_SOURCE_RMS_NM = 0.05;
const VCSEL_RMS_NM = 0.45;

/** Bit-rate limit 4Bσ ≤ 1 (chromatic with the optimum pulse, plus modal) and ⟨Δτ⟩ ≤ 0.1/B (PMD), 1/s. */
function bitRateLimit(ch: ChannelDispersion, pmd: number, L: number): number {
  return Math.min(1 / (4 * channelRmsWidth(ch, L)), pmd > 0 ? MEAN_DGD_BIT_FRACTION / meanDgd(pmd, L) : Infinity);
}

/** Longest link meeting both limits at bit rate B, m. */
function reach(ch: ChannelDispersion, pmd: number, bitRate: number): number {
  return Math.min(dispersionLimitedLength(ch, bitRate), pmd > 0 ? pmdLimitedLength(pmd, bitRate) : Infinity);
}

const fmt = (v: number, digits: number, unit: string) =>
  v === Infinity ? "∞" : Number.isFinite(v) ? `${v.toFixed(digits)} ${unit}` : "—";
/** Bit rate or bandwidth in Hz, shown in G or M units. */
const fmtRate = (v: number, unit: "b/s" | "Hz") =>
  v === Infinity ? "∞" : !Number.isFinite(v) ? "—" : v >= 1e9 ? `${(v / 1e9).toPrecision(3)} G${unit}` : `${(v / 1e6).toPrecision(3)} M${unit}`;
const fmtLength = (m: number) =>
  m === Infinity ? "> 10⁶ km" : !Number.isFinite(m) ? "—" : m >= 1e3 ? `${(m / 1e3).toPrecision(3)} km` : `${m.toPrecision(3)} m`;

export default function FiberBandwidthPage() {
  const [fiberKey, setFiberKey] = useURLState("fiberType", "SMF");
  const [length, setLength] = useURLState("length", 10); // km
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [sigmaLambda, setSigmaLambda] = useURLState("sourceLinewidth", SMF_SOURCE_RMS_NM); // nm, rms
  const [modalBW, setModalBW] = useURLState("modalBW", 2000); // MHz·km at 850 nm
  const [pmdCoeff, setPmdCoeff] = useURLState("pmd", 0.1); // ps/√km
  const [bitRate, setBitRate] = useURLState("bitRate", 10); // Gb/s

  const key: SellmeierFiberKey = (KEYS as string[]).includes(fiberKey) ? (fiberKey as SellmeierFiberKey) : "SMF";
  const isMmf = SELLMEIER_FIBERS[key].modalBandwidthLength > 0;

  const selectFiber = (k: SellmeierFiberKey) => {
    setFiberKey(k);
    const f = SELLMEIER_FIBERS[k];
    if (f.modalBandwidthLength > 0) {
      setModalBW(f.modalBandwidthLength / MHZ_KM);
      setWavelength(850);
      setSigmaLambda(VCSEL_RMS_NM);
    } else {
      setWavelength(1550);
      setSigmaLambda(SMF_SOURCE_RMS_NM);
    }
  };

  const valid = length > 0 && wavelength >= 800 && wavelength <= 1700 && sigmaLambda >= 0 && bitRate > 0
    && (isMmf ? modalBW > 0 : pmdCoeff >= 0);

  const calc = useMemo(() => {
    if (!valid) return null;
    const f = SELLMEIER_FIBERS[key];
    const lam = wavelength * nm, L = length * km;
    const D = sellmeierDispersion(lam, f.lambda0, f.S0);
    const S = sellmeierSlope(lam, f.lambda0, f.S0);
    const mod1 = isMmf ? gaussianRmsFromBandwidth(modalBW * MHZ_KM) : 0;
    const ch = channelAt({ D, S }, lam, sigmaLambda * nm, mod1);
    const pmd = isMmf ? 0 : pmdCoeff * PS_SQRT_KM;
    const sCd = optimumOutputRmsWidth(ch.beta2, ch.beta3, L, ch.sigmaOmega);
    const sMod = mod1 * L;
    const sTot = channelRmsWidth(ch, L);
    const dgd = meanDgd(pmd, L);
    return {
      D, ch, pmd, sCd, sMod, sTot, dgd,
      fMod: gaussianBandwidth(sMod),
      bPmd: MEAN_DGD_BIT_FRACTION / dgd,
      bMax: bitRateLimit(ch, pmd, L),
      reachAtB: reach(ch, pmd, bitRate * 1e9),
    };
  }, [valid, key, isMmf, length, wavelength, sigmaLambda, modalBW, pmdCoeff, bitRate]);

  const limitVsLength = useMemo(() => {
    if (!calc) return [];
    const lengths = Array.from({ length: 121 }, (_, i) => 10 ** (-3 + i * 0.05)); // 1 m … 1000 km
    const finite = (v: number) => (Number.isFinite(v) ? v / 1e9 : null);
    const { ch, pmd } = calc;
    return [
      { x: lengths, y: lengths.map(l => finite(1 / (4 * optimumOutputRmsWidth(ch.beta2, ch.beta3, l * km, ch.sigmaOmega)))), type: "scatter" as const, mode: "lines" as const, name: "Chromatic", line: { color: "#f87171" } },
      ...(isMmf ? [{ x: lengths, y: lengths.map(l => finite(1 / (4 * (ch.extraRmsPerM ?? 0) * l * km))), type: "scatter" as const, mode: "lines" as const, name: "Modal", line: { color: "#34d399" } }] : []),
      ...(pmd > 0 ? [{ x: lengths, y: lengths.map(l => finite(MEAN_DGD_BIT_FRACTION / meanDgd(pmd, l * km))), type: "scatter" as const, mode: "lines" as const, name: "PMD", line: { color: "#a78bfa" } }] : []),
      { x: lengths, y: lengths.map(l => finite(bitRateLimit(ch, pmd, l * km))), type: "scatter" as const, mode: "lines" as const, name: "Combined", line: { color: "#f3f4f6", width: 3 } },
      { x: [length], y: [finite(calc.bMax)], type: "scatter" as const, mode: "markers" as const, name: "This link", marker: { color: "#fbbf24", size: 10 } },
    ];
  }, [calc, isMmf, length]);

  const reachData = useMemo(() => {
    if (!calc) return [];
    const reaches = RATES.map(r => reach(calc.ch, calc.pmd, r * 1e9) / km);
    return [{
      x: RATES.map(String),
      y: reaches.map(v => (Number.isFinite(v) ? v : null)),
      type: "bar" as const, name: "Max reach",
      marker: { color: reaches.map(v => (v >= length ? "#34d399" : "#f87171")) },
    }];
  }, [calc, length]);

  const card = "bg-gray-900 border border-gray-800 rounded-lg p-4";
  const axis = { color: "#9ca3af", gridcolor: "#374151" };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Type</span>
          <select value={key} onChange={e => selectFiber(e.target.value as SellmeierFiberKey)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {KEYS.map(k => <option key={k} value={k}>{SELLMEIER_FIBERS[k].label}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Length (km)" value={length} onChange={setLength} min={0.001} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} />
        <ValidatedNumberInput label="Source rms Spectral Width σ_λ (nm)" value={sigmaLambda} onChange={setSigmaLambda} min={0} step="0.01" />
        <ValidatedNumberInput label="Bit Rate (Gb/s)" value={bitRate} onChange={setBitRate} min={0.001} step="any" />
        {isMmf ? (
          <ValidatedNumberInput label="Modal Bandwidth at 850 nm (MHz·km)" value={modalBW} onChange={setModalBW} min={10} />
        ) : (
          <ValidatedNumberInput label="PMD Coefficient (ps/√km)" value={pmdCoeff} onChange={setPmdCoeff} min={0} max={5} step="0.01" />
        )}
      </div>
      {isMmf && Math.abs(wavelength - 850) > 30 && (
        <p className="-mt-6 mb-6 text-xs text-yellow-400">The OM grades rate modal bandwidth at 850 nm; enter the value at {wavelength} nm from the fibre datasheet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <div className={card}>
          <p className="text-sm text-gray-400">Bit-Rate Limit</p>
          <p className="text-xl font-bold text-green-400">{calc ? fmtRate(calc.bMax, "b/s") : "—"}</p>
          <p className="text-xs text-gray-500">over {length} km, all mechanisms</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">Max Reach at {bitRate} Gb/s</p>
          <p className="text-xl font-bold text-cyan-400">{calc ? fmtLength(calc.reachAtB) : "—"}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-400">D(λ)</p>
          <p className="text-xl font-bold text-blue-400">{calc ? fmt(calc.D / PS_NM_KM, 2, "ps/(nm·km)") : "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className={card}>
          <p className="text-sm text-gray-400">Chromatic</p>
          <p className="text-lg font-bold text-red-400">σ = {calc ? fmt(calc.sCd / ps, 2, "ps") : "—"}</p>
          <p className="text-xs text-gray-500">optimum input pulse · B ≤ {calc ? fmtRate(1 / (4 * calc.sCd), "b/s") : "—"}</p>
        </div>
        {isMmf ? (
          <div className={card}>
            <p className="text-sm text-gray-400">Modal</p>
            <p className="text-lg font-bold text-yellow-400">σ = {calc ? fmt(calc.sMod / ps, 1, "ps") : "—"}</p>
            <p className="text-xs text-gray-500">f₃dB {calc ? fmtRate(calc.fMod, "Hz") : "—"} · B ≤ {calc ? fmtRate(1 / (4 * calc.sMod), "b/s") : "—"}</p>
          </div>
        ) : (
          <div className={card}>
            <p className="text-sm text-gray-400">PMD</p>
            <p className="text-lg font-bold text-purple-400">⟨Δτ⟩ = {calc ? fmt(calc.dgd / ps, 3, "ps") : "—"}</p>
            <p className="text-xs text-gray-500">B ≤ 0.1/⟨Δτ⟩ = {calc ? fmtRate(calc.bPmd, "b/s") : "—"}</p>
          </div>
        )}
        <div className={card}>
          <p className="text-sm text-gray-400">Combined rms Width</p>
          <p className="text-lg font-bold text-gray-200">σ = {calc ? fmt(calc.sTot / ps, 2, "ps") : "—"}</p>
          <p className="text-xs text-gray-500">chromatic ⊕ modal · B ≤ {calc ? fmtRate(1 / (4 * calc.sTot), "b/s") : "—"}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Bit-Rate Limit vs Distance</h3>
        <ChartPanel data={limitVsLength} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", type: "log", ...axis },
          yaxis: { title: "Bit-rate limit (Gb/s)", type: "log", ...axis },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.75, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Maximum Reach by Data Rate</h3>
        <ChartPanel data={reachData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Data Rate (Gb/s)", type: "category", ...axis },
          yaxis: { title: "Max Distance (km)", type: "log", ...axis },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          showlegend: false,
        }} />
        <p className="mt-2 text-xs text-gray-500">Green: reaches the {length} km link length.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>D(λ) = (S₀/4)(λ − λ₀⁴/λ³)</p>
          <p>σ_CD² ≈ (|D|Lσ_λ)² + |β₂|L  [input pulse width chosen to minimise σ; β₃ also included]</p>
          <p>σ_modal = 0.187 · L / (BW·L)  [Gaussian with the rated 3-dB bandwidth]</p>
          <p>σ = √(σ_CD² + σ_modal²),  B ≤ 1/(4σ)</p>
          <p>PMD: ⟨Δτ⟩ = PMD·√L ≤ 0.1/B</p>
          <p>Modal bandwidth at 850 nm: OM1 200, OM2 500, OM3 2000 (EMB), OM4 4700 (EMB) MHz·km</p>
        </div>
      </div>
    </>
  );
}
