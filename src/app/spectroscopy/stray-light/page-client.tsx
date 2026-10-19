"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  absorbanceError, apparentAbsorbanceLimit, maxStrayRatio, measuredAbsorbance, measuredTransmittance, orderSortingWindow,
  overlappingOrders,
} from "../../../physics/spectroscopy/stray-light";
import { overlapFreeLimit } from "../../../physics/spectroscopy/spectral-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");

const chartLayout = (yTitle: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: "True Absorbance (AU)", gridcolor: "#374151" },
  yaxis: { title: yTitle, gridcolor: "#374151" },
  margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
});

export default function StrayLightPage() {
  const [sRaw, setStrayLightRatio] = useURLState("strayLightRatio", 0.001); // stray / total detected reference power
  const [aRaw, setAbsorbance] = useURLState("absorbance", 3); // AU
  const [tsRaw, setStrayTransmittance] = useURLState("strayTransmittance", 1); // sample transmittance for the stray light
  const [tolRaw, setTolerance] = useURLState("tolerance", 0.01); // AU
  const [orderRaw, setOrder] = useURLState("order", 1);
  const [wlRaw, setCentralWavelength] = useURLState("centralWavelength", 600); // nm
  const [minRaw, setLambdaMin] = useURLState("lambdaMin", 200); // nm
  const [maxRaw, setLambdaMax] = useURLState("lambdaMax", 1100); // nm

  const s = clamp(sRaw, 0, 0.5, 0.001);
  const A = clamp(aRaw, 0, 8, 3);
  const Ts = clamp(tsRaw, 0, 1, 1);
  const tol = clamp(tolRaw, 1e-4, 1, 0.01);
  const order = Math.round(clamp(orderRaw, 1, 10, 1));
  const wl = clamp(wlRaw, 100, 20000, 600);
  const lo = clamp(minRaw, 100, 20000, 200);
  const hi = Math.max(clamp(maxRaw, 100, 20000, 1100), lo);

  const Tm = measuredTransmittance(10 ** -A, s, Ts);
  const Am = measuredAbsorbance(A, s, Ts);
  const dA = absorbanceError(A, s, Ts);
  const aMax = apparentAbsorbanceLimit(s, Ts);
  const sMax = maxStrayRatio(A, tol, Ts);
  const overlaps = overlappingOrders(wl * 1e-9, order, lo * 1e-9, hi * 1e-9);
  const band = orderSortingWindow(wl * 1e-9, order);
  const clean = overlapFreeLimit(lo * 1e-9, order) * 1e9;

  const charts = (() => {
    const as = Array.from({ length: 241 }, (_, i) => (6 * i) / 240);
    const line = (y: number[], name: string, color: string, dash?: string) =>
      ({ x: as, y, type: "scatter", mode: "lines", name, line: { color, width: 2, ...(dash ? { dash } : {}) } });
    return {
      reading: [
        line(as, "True", "#60a5fa", "dash"),
        line(as.map((a) => r6(measuredAbsorbance(a, s, Ts))), `Measured, s = ${fmt(s * 100, 3)} %`, "#f87171"),
      ],
      error: [line(as.map((a) => r6(absorbanceError(a, s, Ts))), "ΔA", "#34d399")],
    };
  })();

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Photometric Error</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Stray Light Ratio s (of detected power)" value={sRaw} onChange={setStrayLightRatio} min={0} max={0.5} />
        <ValidatedNumberInput label="True Absorbance A (AU)" value={aRaw} onChange={setAbsorbance} min={0} max={8} />
        <ValidatedNumberInput label="Sample Transmittance for Stray Light T_s" value={tsRaw} onChange={setStrayTransmittance} min={0} max={1} />
        <ValidatedNumberInput label="Absorbance Tolerance (AU)" value={tolRaw} onChange={setTolerance} min={1e-4} max={1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Measured Transmittance" value={fmt(Tm)} tone="blue" subtext={`true ${fmt(10 ** -A)}; (1 − s)T + s·T_s`} />
        <ResultCard label="Measured Absorbance" value={`${fmt(Am)} AU`} tone="red" subtext="−log₁₀ T_m" />
        <ResultCard label="Absorbance Error ΔA" value={`${fmt(dA, 3)} AU`} tone="yellow"
          subtext={A > 0 ? `${fmt((100 * dA) / A, 3)} % of A, read as concentration` : "A = 0"} />
        <ResultCard label="Highest Readable Absorbance" value={Number.isFinite(aMax) ? `${fmt(aMax)} AU` : "∞ (no stray light)"} tone="purple"
          subtext="A_max = −log₁₀(s·T_s), as A → ∞" />
        <ResultCard label={`Largest s for |ΔA| ≤ ${tol} AU at A = ${A}`} value={Number.isFinite(sMax) ? `${fmt(sMax, 3)} (${fmt(sMax * 100, 3)} %)` : "—"}
          tone="green" subtext={Number.isFinite(sMax) ? "T(10^δ − 1)/(T_s − T)" : "T_s ≤ T: stray light does not lower the reading"} />
        <ResultCard label="Stray Light Level (optical density)" value={s > 0 ? `OD ${fmt(-Math.log10(s), 3)}` : "—"} tone="cyan"
          subtext="−log₁₀ s, the rejection quoted for monochromators" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Measured vs True Absorbance</h3>
        <ChartPanel data={charts.reading} layout={chartLayout("Absorbance (AU)")} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Absorbance Error ΔA = A_m − A</h3>
        <ChartPanel data={charts.error} layout={chartLayout("ΔA (AU)")} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Order Overlap</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Working Order m" value={orderRaw} onChange={setOrder} min={1} max={10} step="1" />
        <ValidatedNumberInput label="Set Wavelength λ (nm)" value={wlRaw} onChange={setCentralWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Source/Detector λ Min (nm)" value={minRaw} onChange={setLambdaMin} min={100} max={20000} />
        <ValidatedNumberInput label="Source/Detector λ Max (nm)" value={maxRaw} onChange={setLambdaMax} min={100} max={20000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ResultCard label="Order-Sorting Filter Pass Band" tone="yellow"
          value={`${fmt(band.low * 1e9)} – ${Number.isFinite(band.high) ? `${fmt(band.high * 1e9)} nm` : "∞ (long-pass)"}`}
          subtext={order > 1 ? "block mλ/(m + 1) and mλ/(m − 1)" : "a long-pass above mλ/(m + 1) is enough in first order"} />
        <ResultCard label={`Overlap-Free Band from ${lo} nm (order ${order})`} value={`${lo} – ${fmt(clean)} nm`} tone="green"
          subtext="λ_min(m + 1)/m; the free spectral range λ_min/m" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Wavelengths Arriving with {wl} nm (order {order})</h3>
        {overlaps.length === 0 ? (
          <p>No other order inside {lo}–{hi} nm reaches this angle.</p>
        ) : (
          <ul className="space-y-1">
            {overlaps.map((o) => (
              <li key={o.order}>
                Order {o.order}: <span className="text-yellow-400">{fmt(o.wavelength * 1e9)} nm</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">T_m = (1 − s)·T + s·T_s,   A_m = −log₁₀ T_m,   ΔA = −log₁₀(1 − s + s·T_s·10^A),   A_max = −log₁₀(s·T_s)</p>
        <p className="font-mono">n·λ′ = m·λ   (same diffraction angle at a fixed grating setting)</p>
        <p>
          s is the stray radiant power ratio: stray power divided by the total power detected in the reference (blank)
          measurement. The opaque-filter method of ASTM E387 measures it as the reading through a cut-off filter that blocks
          the set wavelength but passes the stray light, divided by the blank reading. The sample attenuates the in-band light by
          T = 10^−A and the stray light by T_s; T_s = 1 (sample transparent where the stray light lies) is the usual worst
          case. Some texts give the stray power relative to the in-band power, S = P_s/P₀, and write
          T_m = (T + S·T_s)/(1 + S); that is the same model with s = S/(1 + S). With T_s &gt; T, stray light
          makes high absorbances read low, which bends a Beer–Lambert calibration line towards A_max.
        </p>
        <p>
          At a fixed grating angle, order n of λ′ = mλ/n leaves along the same direction as order m of λ, whatever the
          groove density. These overlapping orders are not grating ghosts: ghosts (Rowland, Lyman) come from periodic
          ruling errors and are not modelled here, nor is the spectrum of the scattered light.
        </p>
        <p className="text-gray-500">
          References: ASTM E387, Standard Test Method for Estimating Stray Radiant Power Ratio of Dispersive
          Spectrophotometers by the Opaque Filter Method; D. A. Skoog, F. J. Holler, S. R. Crouch, <em>Principles of
          Instrumental Analysis</em>, ch. 13; C. Palmer, E. Loewen, <em>Diffraction Grating Handbook</em>, 6th ed. (Newport,
          2005), ch. 2.
        </p>
      </div>
    </>
  );
}
