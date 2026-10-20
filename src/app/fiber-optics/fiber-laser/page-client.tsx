"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  efficiencyBeyondStokes, optimumOutputCoupler, rigrodOutput, stokesEfficiency,
} from "../../../physics/fiber-optics/doped-fiber-gain";
import { DB_PER_NEPER, lp11CutoffWavelength, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import { guidedModeCount, MAX_EXACT_MODE_V, petermannIIRadius } from "../../../physics/fiber-optics/step-index-modes";

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

export default function FiberLaserCalculator() {
  const [pumpRaw, setPump] = useURLState("pumpPower", 100); // W
  const [lpRaw, setLp] = useURLState("pumpWavelength", 976); // nm
  const [llRaw, setLl] = useURLState("laserWavelength", 1064); // nm
  const [slopeRaw, setSlope] = useURLState("slopeEfficiency", 80); // %
  const [thresholdRaw, setThreshold] = useURLState("thresholdPower", 2); // W
  const [gainRaw, setGain] = useURLState("smallSignalGain", 13); // dB, single pass
  const [couplingRaw, setCoupling] = useURLState("outputCoupling", 10); // %, transmission
  const [lossRaw, setLoss] = useURLState("cavityLoss", 0.5); // dB, round trip
  const [coreRaw, setCore] = useURLState("coreDiameter", 10); // µm
  const [naRaw, setNA] = useURLState("NA", 0.08);

  const pump = clamp(pumpRaw, 0, 1e5);
  const lp_nm = clamp(lpRaw, 400, 2200);
  const ll_nm = clamp(llRaw, 400, 2200);
  const slope = clamp(slopeRaw, 0, 100) / 100;
  const threshold = clamp(thresholdRaw, 0, 1e4);
  const gain_dB = clamp(gainRaw, 0.01, 60);
  const T = clamp(couplingRaw, 0.01, 99.99) / 100;
  const loss_dB = clamp(lossRaw, 0, 30);
  // Silica core index: V, the mode count and the LP01 field depend only on a, NA and λ in the weak-guidance limit.
  const fiber = { a: (clamp(coreRaw, 1, 1000) * 1e-6) / 2, n1: 1.45, NA: clamp(naRaw, 0.01, 1) };
  const V = vNumber(fiber, ll_nm * 1e-9);
  const modes = V <= MAX_EXACT_MODE_V ? guidedModeCount(V) : NaN;
  const mfd = 2 * petermannIIRadius(fiber, ll_nm * 1e-9);
  const cutoff = lp11CutoffWavelength(fiber);

  const calc = useMemo(() => {
    const out = pump > threshold ? slope * (pump - threshold) : 0;
    const g0L = gain_dB / DB_PER_NEPER;
    // Internal round-trip loss lumped into the rear mirror: R₁ = 10^(−loss/10).
    const R1 = 10 ** (-loss_dB / 10);
    const opt = optimumOutputCoupler(g0L, R1);
    const atT = rigrodOutput(g0L, R1, 1 - T);
    const Ts = Array.from({ length: 100 }, (_, i) => (i + 0.5) / 100);
    const rel = Ts.map((t) => (opt.output > 0 ? (100 * rigrodOutput(g0L, R1, 1 - t)) / opt.output : NaN));
    const pumps = Array.from({ length: 101 }, (_, i) => (i * Math.max(2 * pump, 2 * threshold, 1)) / 100);
    const pOut = pumps.map((p) => (p > threshold ? slope * (p - threshold) : 0));
    const ok = rel.map((y) => Number.isFinite(y));
    return {
      out,
      optical: pump > 0 ? out / pump : 0,
      stokes: stokesEfficiency(lp_nm, ll_nm),
      beyond: efficiencyBeyondStokes(slope, lp_nm, ll_nm),
      Topt: 1 - opt.R2,
      optOut: opt.output,
      atT,
      data: [
        { x: pumps, y: pOut, type: "scatter" as const, mode: "lines" as const, name: "Output (W)", line: { color: "#10b981" }, xaxis: "x", yaxis: "y" },
        { x: Ts.filter((_, i) => ok[i]).map((t) => 100 * t), y: rel.filter((_, i) => ok[i]), type: "scatter" as const, mode: "lines" as const, name: "Rigrod output (% of optimum)", line: { color: "#3b82f6" }, xaxis: "x2", yaxis: "y2" },
      ],
    };
  }, [pump, threshold, slope, gain_dB, loss_dB, T, lp_nm, ll_nm]);

  const belowThreshold = !(calc.optOut > 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pump Power (W)" value={pumpRaw} onChange={setPump} min={0} max={1e5} step="any" />
        <ValidatedNumberInput label="Pump Wavelength (nm)" value={lpRaw} onChange={setLp} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Laser Wavelength (nm)" value={llRaw} onChange={setLl} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Slope Efficiency (%)" value={slopeRaw} onChange={setSlope} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Threshold Pump Power (W)" value={thresholdRaw} onChange={setThreshold} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Small-Signal Single-Pass Gain (dB)" value={gainRaw} onChange={setGain} min={0.01} max={60} step="any" />
        <ValidatedNumberInput label="Output Coupler Transmission (%)" value={couplingRaw} onChange={setCoupling} min={0.01} max={99.99} step="any" />
        <ValidatedNumberInput label="Internal Round-Trip Loss (dB)" value={lossRaw} onChange={setLoss} min={0} max={30} step="any" />
        <ValidatedNumberInput label="Signal Core Diameter (µm)" value={coreRaw} onChange={setCore} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Core NA" value={naRaw} onChange={setNA} min={0.01} max={1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Output Power" value={`${calc.out.toPrecision(4)} W`} sub="η_s(P_pump − P_th)" tone="text-green-400" />
        <Card label="Optical-to-Optical Efficiency" value={`${(100 * calc.optical).toFixed(1)} %`} sub="P_out/P_pump" tone="text-green-400" />
        <Card label="Stokes Efficiency" value={`${(100 * calc.stokes).toFixed(2)} %`}
          sub={calc.stokes > 1 ? "above 100 %: the pump wavelength is longer than the laser wavelength" : "λ_p/λ_l, the quantum-defect limit"}
          tone={calc.stokes > 1 ? "text-red-400" : "text-blue-400"} />
        <Card label="Efficiency Beyond Stokes" value={`${(100 * calc.beyond).toFixed(2)} %`}
          sub={calc.beyond > 1 ? "above 100 %: the slope exceeds the quantum limit" : "η_s/(λ_p/λ_l): losses other than the quantum defect"}
          tone={calc.beyond > 1 ? "text-red-400" : "text-blue-400"} />
        <Card label="Optimum Output Coupling" value={belowThreshold ? "below threshold" : loss_dB === 0 ? "→ 0" : `${(100 * calc.Topt).toFixed(1)} %`}
          sub={loss_dB === 0 ? "lossless cavity: any small transmission extracts all the gain" : "Rigrod, at this gain and loss"} tone="text-yellow-400" />
        <Card label="Output at Your Coupler" value={belowThreshold ? "—" : `${((100 * calc.atT) / calc.optOut).toFixed(1)} % of optimum`}
          sub={belowThreshold ? undefined : `${calc.atT.toPrecision(4)} vs ${calc.optOut.toPrecision(4)} × P_sat`} tone="text-yellow-400" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="V Number at the Laser Wavelength" value={V.toFixed(3)} sub="2πa·NA/λ_l" tone={V < 2.405 ? "text-green-400" : "text-red-400"} />
        <Card label="Guided Modes" value={Number.isFinite(modes) ? (V < 2.405 ? "single mode" : `${modes} modes`) : `≈ ${Math.round((V * V) / 2)} modes`}
          sub={V < 2.405 ? "only LP01 (2 polarizations)" : "LP11 and higher are guided: the beam quality depends on bend and launch"} tone={V < 2.405 ? "text-green-400" : "text-red-400"} />
        <Card label="LP01 Mode-Field Diameter" value={Number.isFinite(mfd) ? `${(mfd * 1e6).toFixed(2)} µm` : "—"} sub="Petermann II, exact step-index LP01" tone="text-blue-400" />
        <Card label="Single-Mode Cutoff Wavelength" value={`${(cutoff * 1e9).toFixed(0)} nm`} sub="LP11 cutoff 2πa·NA/2.405" tone="text-blue-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>P_out = η_s·(P_pump − P_th) (your measured slope and threshold)</p>
          <p>Stokes efficiency λ_p/λ_l; efficiency beyond Stokes = η_s/(λ_p/λ_l) ≤ 1</p>
          <p>Rigrod: P/P_sat = (1 − R₂)√R₁ (g₀L + ln√(R₁R₂)) / ((√R₁ + √R₂)(1 − √(R₁R₂)))</p>
          <p>R₂ = 1 − T, R₁ = 10^(−loss/10) (internal round-trip loss folded into the rear mirror), g₀L = gain/4.343</p>
          <p>V = 2πa·NA/λ; single mode for V &lt; 2.405 (LP11 cutoff); LP01 Petermann II diameter from the exact step-index mode</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Rigrod (1965) treats a homogeneously broadened standing-wave laser with gain of any size, so it holds for
          high-gain fibre lasers where the low-gain rule T_opt = √(2g₀L·L_i) − L_i fails. The higher the gain, the less the
          output depends on the coupler: the 3.4 % Fresnel reflection of a cleaved end gives 55 % of the optimum output at
          13 dB single-pass gain but 88 % at 30 dB, which is why high-power fibre lasers often use it as the output mirror.
          Gain saturation is that of a four-level system with g₀ fixed; reabsorption in Yb is not modelled.
        </p>
      </div>

      <ChartPanel data={calc.data} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Pump Power (W)", gridcolor: "#374151", domain: [0, 0.45] },
        yaxis: { title: "Output Power (W)", gridcolor: "#374151" },
        xaxis2: { title: "Output Coupler Transmission (%)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
        yaxis2: { title: "Output (% of optimum)", gridcolor: "#374151", anchor: "x2", range: [0, 105] },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </>
  );
}
