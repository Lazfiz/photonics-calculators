"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DOPANT_PRESETS, absorptionDbPerM, amplifier, coreOverlap, fullInversionGainDb, intrinsicSaturationPower,
  ionDensityFromWtPpm, twoLevelAt, type Beam, type DopedFiber,
} from "../../../physics/fiber-optics/doped-fiber-gain";
import { lp11CutoffWavelength, vNumber, type StepIndexFiber } from "../../../physics/fiber-optics/macro-bending-loss";
import { numericalAperture } from "../../../physics/fiber-optics/step-index-modes";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const SIGMA_UNIT = 1e-25; // m², the unit of the cross-section inputs
const dB = (x: number) => 10 * Math.log10(x);
// Text for a result, or a dash when the model has no finite value.
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");

const PRESETS = [
  { id: "er980", label: "Erbium, 980 nm pump", ion: 0, pump: 0 },
  { id: "er1480", label: "Erbium, 1480 nm pump", ion: 0, pump: 1 },
  { id: "yb976", label: "Ytterbium, 976 nm pump", ion: 1, pump: 0 },
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

export default function RareEarthDopedCalculator() {
  const [dopantRaw, setDopant] = useURLState("dopant", "Er");
  const [ppmRaw, setPpm] = useURLState("dopantConcentration", 1000); // wt-ppm of the ion
  const [lengthRaw, setLength] = useURLState("fiberLength", 3); // m
  const [radiusRaw, setRadius] = useURLState("coreRadius", 1.6); // µm, doped to the core edge
  const [n1Raw, setN1] = useURLState("coreIndex", 1.474);
  const [n2Raw, setN2] = useURLState("claddingIndex", 1.457);
  const [pumpRaw, setPump] = useURLState("pumpPower", 200); // mW
  const [signalRaw, setSignal] = useURLState("signalPower", -30); // dBm
  const [lpRaw, setLp] = useURLState("pumpWavelength", 980); // nm
  const [lsRaw, setLs] = useURLState("signalWavelength", 1550); // nm
  const [sapRaw, setSap] = useURLState("sigmaAPump", 1.7); // 1e-25 m²
  const [sepRaw, setSep] = useURLState("sigmaEPump", 0);
  const [sasRaw, setSas] = useURLState("sigmaASignal", 2.2);
  const [sesRaw, setSes] = useURLState("sigmaESignal", 3.0);
  const [tauRaw, setTau] = useURLState("tau", 10.2); // ms

  const ion = DOPANT_PRESETS.find((d) => d.id === dopantRaw) ?? DOPANT_PRESETS[0];
  const ppm = clamp(ppmRaw, 1, 50000);
  const L = clamp(lengthRaw, 0.01, 200);
  const r_um = clamp(radiusRaw, 0.5, 20);
  const n1 = clamp(n1Raw, 1.3, 2);
  const n2 = clamp(n2Raw, 1.3, n1);
  const pump_mW = clamp(pumpRaw, 0, 5000);
  const signal_dBm = clamp(signalRaw, -60, 20);
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
    const d = DOPANT_PRESETS[p.ion];
    const pumpLine = d.pumps[p.pump];
    const sig = d.signals[0];
    setDopant(d.id);
    setLp(Math.round(pumpLine.lambda * 1e9));
    setSap(pumpLine.sigmaA / SIGMA_UNIT);
    setSep(pumpLine.sigmaE / SIGMA_UNIT);
    setLs(Math.round(sig.lambda * 1e9));
    setSas(sig.sigmaA / SIGMA_UNIT);
    setSes(sig.sigmaE / SIGMA_UNIT);
    setTau(d.tau * 1e3);
  };

  const calc = useMemo(() => {
    const N = ionDensityFromWtPpm(ppm, ion.molarMass);
    const NA = numericalAperture(n1, n2);
    const guide: StepIndexFiber = { a: r_um * 1e-6, n1, NA };
    const lp = lp_nm * 1e-9;
    const ls = ls_nm * 1e-9;
    const gp = coreOverlap(guide, lp);
    const gs = coreOverlap(guide, ls);
    const fiber: DopedFiber = { N, area: Math.PI * guide.a ** 2, tau: tau_ms * 1e-3 };
    const beams = (pumpW: number): Beam[] => [
      { lambda: lp, sigmaA: sap, sigmaE: sep, overlap: gp, power: pumpW },
      { lambda: ls, sigmaA: sas, sigmaE: ses, overlap: gs, power: 1e-3 * 10 ** (signal_dBm / 10) },
    ];
    const amp = amplifier(fiber, beams(pump_mW * 1e-3), L, 1);
    const alphaP = absorptionDbPerM(gp, sap, N);

    const lengths = Array.from({ length: 61 }, (_, i) => (i * 3 * L) / 60);
    const sol = lengths.map((z) => twoLevelAt(fiber, beams(pump_mW * 1e-3), z).powers);
    const gain = sol.map((p) => dB(p[1] / beams(0)[1].power));
    const pumpLeft = sol.map((p) => (pump_mW > 0 ? (100 * p[0]) / (pump_mW * 1e-3) : NaN));
    const keep = (ys: number[]) => {
      const ok = ys.map((y) => Number.isFinite(y));
      return { x: lengths.filter((_, i) => ok[i]), y: ys.filter((_, i) => ok[i]) };
    };
    return {
      N, NA, gp, gs, alphaP,
      V: vNumber(guide, ls),
      cutoff: lp11CutoffWavelength(guide) * 1e9,
      alphaS: absorptionDbPerM(gs, sas, N),
      L90: 10 / alphaP,
      pSatS: intrinsicSaturationPower(ls, fiber.area, gs, sas, ses, fiber.tau) * 1e3,
      pSatP: intrinsicSaturationPower(lp, fiber.area, gp, sap, sep, fiber.tau) * 1e3,
      fullInv: fullInversionGainDb(gs, ses, N, L),
      gain: dB(amp.gain),
      nf: dB(amp.noiseFigure),
      data: [
        { ...keep(gain), type: "scatter" as const, mode: "lines" as const, name: "Signal gain (dB)", line: { color: "#10b981" }, yaxis: "y" },
        { ...keep(pumpLeft), type: "scatter" as const, mode: "lines" as const, name: "Pump remaining (%)", line: { color: "#f59e0b" }, yaxis: "y2" },
      ],
    };
  }, [ppm, ion.molarMass, n1, n2, r_um, lp_nm, ls_nm, tau_ms, sap, sep, sas, ses, signal_dBm, pump_mW, L]);

  const guided = Number.isFinite(calc.gp) && Number.isFinite(calc.gs);

  return (
    <>
      <div className="mb-6">
        <label htmlFor="preset" className="block text-sm font-medium mb-2">Load measured values</label>
        <select id="preset" value="" onChange={(e) => loadPreset(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option value="" disabled>Choose a preset…</option>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Dopant: {ion.name}, M = {(ion.molarMass * 1e3).toFixed(2)} g/mol, in silica (ρ = 2201 kg/m³). Presets fill
          cross-sections measured in {ion.host} ({ion.source}); they vary with the glass by tens of percent, so enter your
          fibre&apos;s own data where you have it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label={`${ion.id} Concentration (wt-ppm)`} value={ppmRaw} onChange={setPpm} min={1} max={50000} step="any" />
        <ValidatedNumberInput label="Fiber Length (m)" value={lengthRaw} onChange={setLength} min={0.01} max={200} step="any" />
        <ValidatedNumberInput label="Core Radius (µm, doped to the edge)" value={radiusRaw} onChange={setRadius} min={0.5} max={20} step="any" />
        <ValidatedNumberInput label="Core Index n₁" value={n1Raw} onChange={setN1} min={1.3} max={2} step="any" />
        <ValidatedNumberInput label="Cladding Index n₂" value={n2Raw} onChange={setN2} min={1.3} max={2} step="any" />
        <ValidatedNumberInput label="Upper-State Lifetime τ (ms)" value={tauRaw} onChange={setTau} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpRaw} onChange={setPump} min={0} max={5000} step="any" />
        <ValidatedNumberInput label="Pump Wavelength (nm)" value={lpRaw} onChange={setLp} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Signal Wavelength (nm)" value={lsRaw} onChange={setLs} min={400} max={2200} step="any" />
        <ValidatedNumberInput label="Pump σ_a (10⁻²⁵ m²)" value={sapRaw} onChange={setSap} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Pump σ_e (10⁻²⁵ m²)" value={sepRaw} onChange={setSep} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Input Signal Power (dBm)" value={signalRaw} onChange={setSignal} min={-60} max={20} step="any" />
        <ValidatedNumberInput label="Signal σ_a (10⁻²⁵ m²)" value={sasRaw} onChange={setSas} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Signal σ_e (10⁻²⁵ m²)" value={sesRaw} onChange={setSes} min={0} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Ion Density N" value={`${calc.N.toExponential(3)} m⁻³`} sub={`${ppm} wt-ppm`} tone="text-gray-200" />
        <Card label="NA and V" value={show(calc.V, () => `${calc.NA.toFixed(4)}, V = ${calc.V.toFixed(3)}`)} sub={show(calc.cutoff, () => `at the signal; LP11 cutoff ${calc.cutoff.toFixed(0)} nm`)} tone="text-gray-200" />
        <Card label="Overlap Γ" value={guided ? `${calc.gp.toFixed(3)} / ${calc.gs.toFixed(3)}` : "—"}
          sub={lp_nm < calc.cutoff ? "pump / signal; the pump is below the LP11 cutoff, Γ_p is for LP01 only" : "pump / signal, LP01 power in the core"} tone="text-gray-200" />
        <Card label="Pump Absorption" value={show(calc.alphaP, () => `${calc.alphaP.toPrecision(4)} dB/m`)} sub={show(calc.alphaS, () => `signal ${calc.alphaS.toPrecision(4)} dB/m (unpumped)`)} tone="text-red-400" />
        <Card label="90 % Pump Absorbed" value={show(calc.L90, () => `${calc.L90.toPrecision(4)} m`)} sub="10 dB / α_p, small-signal (bleaching lengthens it)" tone="text-red-400" />
        <Card label="Saturation Power" value={show(calc.pSatS, () => `${calc.pSatS.toPrecision(4)} mW`)} sub={show(calc.pSatP, () => `signal; pump ${calc.pSatP.toPrecision(4)} mW`)} tone="text-yellow-400" />
        <Card label="Signal Gain" value={show(calc.gain, () => `${calc.gain.toFixed(2)} dB`)}
          sub={show(calc.nf, () => `NF ${calc.nf.toFixed(2)} dB; full-inversion bound ${calc.fullInv.toFixed(1)} dB`)} tone="text-green-400" />
      </div>

      {!guided && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          V is below 0.5 at the pump or signal (or n₁ ≤ n₂): the mode is barely guided and the LP01 overlap is not
          defined here. Raise the index step or the core radius.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>N = ppm·10⁻⁶·ρ·N_A/M</p>
          <p>Γ = 1 − (U²/V²)(1 − K₀²(W)/K₁²(W)) (LP01, Gloge 1971)</p>
          <p>α = 4.343·Γσ_a N dB/m; 90 % absorbed after 10 dB: L₉₀ = 10/α</p>
          <p>P_sat = hνA/(Γ(σ_a + σ_e)τ)</p>
          <p>Gain and NF: two-level rate equations, solved exactly (Saleh et al. 1990)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Γ assumes doping out to the core edge. Many fibres dope only the centre of the core, which lowers Γ, so
          here it is an upper bound.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          The two-level model covers Er (pumped at 980 or 1480 nm) and Yb. Tm, Ho, Nd and Er/Yb co-doping need
          three- or four-level models with energy transfer, so they are not offered. No ASE self-saturation, ion
          clustering or excited-state absorption; co-propagating pump.
        </p>
      </div>

      <ChartPanel data={calc.data} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
        yaxis: { title: "Signal Gain (dB)", gridcolor: "#374151" },
        yaxis2: { title: "Pump Remaining (%)", overlaying: "y", side: "right", range: [0, 105] },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </>
  );
}
