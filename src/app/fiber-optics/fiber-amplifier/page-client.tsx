"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DOPANT_PRESETS, absorptionDbPerM, amplifier, fullInversionGainDb, intrinsicSaturationPower, twoLevelAt,
  type Beam, type DopedFiber,
} from "../../../physics/fiber-optics/doped-fiber-gain";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const SIGMA_UNIT = 1e-25; // m², the unit of the cross-section inputs
const dB = (x: number) => 10 * Math.log10(x);
// Text for a result, or a dash when the model has no finite value.
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");

// Preset = ion, pump line and the old page's fibre (N, core radius).
const PRESETS = [
  { id: "er980", label: "EDFA, 980 nm pump", ion: 0, pump: 0, N: 1e24, r: 2.2 },
  { id: "er1480", label: "EDFA, 1480 nm pump", ion: 0, pump: 1, N: 1e24, r: 2.2 },
  { id: "yb976", label: "YDFA, 976 nm pump", ion: 1, pump: 0, N: 3e25, r: 3.5 },
] as const;

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function FiberAmplifierCalculator() {
  const [lengthRaw, setLength] = useURLState("fiberLength", 10); // m
  const [pumpRaw, setPump] = useURLState("pumpPower", 200); // mW
  const [signalRaw, setSignal] = useURLState("inputPower", -10); // dBm
  const [nRaw, setN] = useURLState("dopantConc", 1e24); // ions/m³
  const [radiusRaw, setRadius] = useURLState("coreRadius", 2.2); // µm, doped radius
  const [gpRaw, setGp] = useURLState("overlapPump", 0.8);
  const [gsRaw, setGs] = useURLState("overlapSignal", 0.8);
  const [lpRaw, setLp] = useURLState("pumpWavelength", 980); // nm
  const [lsRaw, setLs] = useURLState("signalWavelength", 1550); // nm
  const [sapRaw, setSap] = useURLState("sigmaAPump", 2.5); // 1e-25 m²
  const [sepRaw, setSep] = useURLState("sigmaEPump", 0);
  const [sasRaw, setSas] = useURLState("sigmaASignal", 2.5);
  const [sesRaw, setSes] = useURLState("sigmaESignal", 3.5);
  const [tauRaw, setTau] = useURLState("tau", 10); // ms

  const L = clamp(lengthRaw, 0.01, 200);
  const pump_mW = clamp(pumpRaw, 0, 5000);
  const signal_dBm = clamp(signalRaw, -60, 20);
  const N = clamp(nRaw, 1e22, 1e27);
  const r_um = clamp(radiusRaw, 0.5, 20);
  const gp = clamp(gpRaw, 0.01, 1);
  const gs = clamp(gsRaw, 0.01, 1);
  const lp_nm = clamp(lpRaw, 400, 2200);
  const ls_nm = clamp(lsRaw, 400, 2200);
  const sap = clamp(sapRaw, 0, 1000) * SIGMA_UNIT;
  const sep = clamp(sepRaw, 0, 1000) * SIGMA_UNIT;
  const sas = clamp(sasRaw, 0, 1000) * SIGMA_UNIT;
  const ses = clamp(sesRaw, 0, 1000) * SIGMA_UNIT;
  const tau_ms = clamp(tauRaw, 0.01, 100);

  const loadPreset = (id: string) => {
    const p = PRESETS.find((q) => q.id === id);
    if (!p) return;
    const ion = DOPANT_PRESETS[p.ion];
    const pumpLine = ion.pumps[p.pump];
    const sig = ion.signals[0];
    setLp(Math.round(pumpLine.lambda * 1e9));
    setSap(pumpLine.sigmaA / SIGMA_UNIT);
    setSep(pumpLine.sigmaE / SIGMA_UNIT);
    setLs(Math.round(sig.lambda * 1e9));
    setSas(sig.sigmaA / SIGMA_UNIT);
    setSes(sig.sigmaE / SIGMA_UNIT);
    setTau(ion.tau * 1e3);
    setN(p.N);
    setRadius(p.r);
  };

  const fiber: DopedFiber = useMemo(() => ({ N, area: Math.PI * (r_um * 1e-6) ** 2, tau: tau_ms * 1e-3 }), [N, r_um, tau_ms]);
  const beamsAt = useMemo(() => (pumpW: number): Beam[] => [
    { lambda: lp_nm * 1e-9, sigmaA: sap, sigmaE: sep, overlap: gp, power: pumpW },
    { lambda: ls_nm * 1e-9, sigmaA: sas, sigmaE: ses, overlap: gs, power: 1e-3 * 10 ** (signal_dBm / 10) },
  ], [lp_nm, ls_nm, sap, sep, sas, ses, gp, gs, signal_dBm]);

  const calc = useMemo(() => {
    const beams = beamsAt(pump_mW * 1e-3);
    const amp = amplifier(fiber, beams, L, 1);
    return {
      gain: dB(amp.gain),
      outDbm: dB(amp.powers[1] * 1e3),
      pumpOut: amp.powers[0] * 1e3,
      nf: dB(amp.noiseFigure),
      fullInv: fullInversionGainDb(gs, ses, N, L),
      alphaP: absorptionDbPerM(gp, sap, N),
      alphaS: absorptionDbPerM(gs, sas, N),
      pSat: intrinsicSaturationPower(ls_nm * 1e-9, fiber.area, gs, sas, ses, fiber.tau) * 1e3,
      n2In: twoLevelAt(fiber, beams, 0).inversion,
      n2Out: twoLevelAt(fiber, beams, L).inversion,
    };
  }, [beamsAt, fiber, pump_mW, L, gs, ses, N, gp, sap, sas, ls_nm]);

  const charts = useMemo(() => {
    const gainOf = (pumpW: number, z: number) => {
      const beams = beamsAt(pumpW);
      return dB(twoLevelAt(fiber, beams, z).powers[1] / beams[1].power);
    };
    const pMax = Math.max(2 * pump_mW, 50);
    const pumps = Array.from({ length: 61 }, (_, i) => (i * pMax) / 60);
    const lengths = Array.from({ length: 61 }, (_, i) => (i * 3 * L) / 60);
    const gP = pumps.map((p) => gainOf(p * 1e-3, L));
    const gL = lengths.map((z) => gainOf(pump_mW * 1e-3, z));
    let best = 0;
    gL.forEach((g, i) => { if (g > gL[best]) best = i; });
    const keep = (xs: number[], ys: number[]) => {
      const ok = ys.map((y) => Number.isFinite(y));
      return { x: xs.filter((_, i) => ok[i]), y: ys.filter((_, i) => ok[i]) };
    };
    return {
      bestLength: lengths[best], bestGain: gL[best], atEdge: best === lengths.length - 1,
      data: [
        { ...keep(pumps, gP), type: "scatter" as const, mode: "lines" as const, name: `Gain at L = ${L} m`, line: { color: "#3b82f6" }, xaxis: "x", yaxis: "y" },
        { ...keep(lengths, gL), type: "scatter" as const, mode: "lines" as const, name: `Gain at ${pump_mW} mW`, line: { color: "#10b981" }, xaxis: "x2", yaxis: "y2" },
      ],
    };
  }, [beamsAt, fiber, pump_mW, L]);

  return (
    <>
      <div className="mb-6">
        <label htmlFor="preset" className="block text-sm font-medium mb-2">Load typical values</label>
        <select id="preset" value="" onChange={(e) => loadPreset(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option value="" disabled>Choose a preset…</option>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Presets fill typical cross-sections (Er in alumino-germanosilicate, Yb in germanosilicate). They vary with the
          host glass by tens of percent: enter your fibre&apos;s own data where you have it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Fiber Length (m)" value={lengthRaw} onChange={setLength} min={0.01} max={200} step="any" />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpRaw} onChange={setPump} min={0} max={5000} step="any" />
        <ValidatedNumberInput label="Input Signal Power (dBm)" value={signalRaw} onChange={setSignal} min={-60} max={20} step="any" />
        <ValidatedNumberInput label="Dopant Density N (ions/m³)" value={nRaw} onChange={setN} min={1e22} max={1e27} step="any" />
        <ValidatedNumberInput label="Doped Core Radius (µm)" value={radiusRaw} onChange={setRadius} min={0.5} max={20} step="any" />
        <ValidatedNumberInput label="Upper-State Lifetime τ (ms)" value={tauRaw} onChange={setTau} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Pump Wavelength (nm)" value={lpRaw} onChange={setLp} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Pump σ_a (10⁻²⁵ m²)" value={sapRaw} onChange={setSap} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Pump σ_e (10⁻²⁵ m²)" value={sepRaw} onChange={setSep} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Signal Wavelength (nm)" value={lsRaw} onChange={setLs} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Signal σ_a (10⁻²⁵ m²)" value={sasRaw} onChange={setSas} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Signal σ_e (10⁻²⁵ m²)" value={sesRaw} onChange={setSes} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Pump Overlap Γ_p" value={gpRaw} onChange={setGp} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Signal Overlap Γ_s" value={gsRaw} onChange={setGs} min={0.01} max={1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Signal Gain" value={show(calc.gain, () => `${calc.gain.toFixed(2)} dB`)} sub={Number.isFinite(calc.gain) ? `full-inversion bound ${calc.fullInv.toFixed(1)} dB` : "signal fully absorbed"} tone="text-green-400" />
        <Card label="Output Signal" value={show(calc.outDbm, () => `${calc.outDbm.toFixed(2)} dBm`)} sub={show(calc.outDbm, () => `${(10 ** (calc.outDbm / 10)).toPrecision(4)} mW`)} tone="text-blue-400" />
        <Card label="Noise Figure" value={show(calc.nf, () => `${calc.nf.toFixed(2)} dB`)} sub="signal–spontaneous limit, ≥ 3 dB at high gain" tone="text-yellow-400" />
        <Card label="Residual Pump" value={`${calc.pumpOut.toPrecision(4)} mW`} sub={`${((100 * calc.pumpOut) / Math.max(pump_mW, 1e-30)).toFixed(1)} % of launched`} tone="text-purple-400" />
        <Card label="Small-Signal Absorption" value={`${calc.alphaP.toPrecision(4)} dB/m`} sub={`at the pump; ${calc.alphaS.toPrecision(4)} dB/m at the signal`} tone="text-gray-200" />
        <Card label="Signal Saturation Power" value={show(calc.pSat, () => `${calc.pSat.toPrecision(4)} mW`)} sub="hνA/(Γ(σ_a + σ_e)τ)" tone="text-gray-200" />
        <Card label="Upper-State Fraction n₂" value={`${calc.n2In.toFixed(3)} → ${calc.n2Out.toFixed(3)}`} sub="input → output end" tone="text-gray-200" />
        <Card label="Best Length (0–3L)" value={charts.atEdge ? `≥ ${charts.bestLength.toPrecision(3)} m` : show(charts.bestGain, () => `${charts.bestLength.toPrecision(3)} m`)}
          sub={charts.atEdge ? "gain still rising at 3L: the pump is not used up" : show(charts.bestGain, () => `${charts.bestGain.toFixed(2)} dB at this pump`)} tone="text-gray-200" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>n₂/N = Σ Γ_kσ_akφ_k / (1/τ + Σ Γ_k(σ_ak + σ_ek)φ_k), φ_k = P_k/(hν_kA)</p>
          <p>dP_k/dz = Γ_k N (σ_ek n₂ − σ_ak n₁) P_k (n₁ = 1 − n₂), solved exactly (Saleh et al. 1990)</p>
          <p>NF = (1 + 2n_ASE)/G, n_ASE = G ∫ Γσ_e N n₂(z)/G(z) dz</p>
          <p>Full-inversion bound: G = 4.343·Γσ_e N L dB</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Two-level, co-propagating pump and signal at one wavelength each, uniform intensity over the doped area. ASE is
          not fed back into the inversion, so above about 20–25 dB of gain the model overestimates it, as it does with
          ion clustering, excited-state absorption or a backward pump. Er pumped at 980 nm is a two-level system here
          because the pump level empties in microseconds.
        </p>
      </div>

      <ChartPanel data={charts.data} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Pump Power (mW)", gridcolor: "#374151", domain: [0, 0.45] },
        yaxis: { title: "Signal Gain (dB)", gridcolor: "#374151" },
        xaxis2: { title: "Fiber Length (m)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
        yaxis2: { title: "Signal Gain (dB)", gridcolor: "#374151", anchor: "x2" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </>
  );
}
