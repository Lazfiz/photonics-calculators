"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { lockingRange } from "../../../physics/wave-optics/injection-locking";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function InjectionLockingPage() {
  const [masterPowerRaw, setMasterPower] = useURLState("masterPower", 0.1); // mW injected
  const [slavePowerRaw, setSlavePower] = useURLState("slavePower", 10); // mW
  const [couplingRaw, setCoupling] = useURLState("couplingRate", 10); // GHz, k_c/2π
  const [alphaRaw, setAlpha] = useURLState("alpha", 3);
  const [detuningRaw, setDetuning] = useURLState("detuning", -1); // GHz

  const Pinj = clamp(masterPowerRaw, 0, 1e9, 0.1);
  const Pslave = clamp(slavePowerRaw, 1e-9, 1e9, 10);
  const kc = clamp(couplingRaw, 0, 1e4, 10); // GHz (k_c/2π)
  const alpha = clamp(alphaRaw, -20, 20, 3);
  const detuning = clamp(detuningRaw, -1e5, 1e5, -1); // GHz

  const rho = Pinj / Pslave;
  const { lower, upper } = lockingRange(kc, rho, alpha);
  const adler = lockingRange(kc, rho, 0);
  const locked = detuning >= lower && detuning <= upper;
  const rhoDb = 10 * Math.log10(rho);

  const ratiosDb = Array.from({ length: 201 }, (_, i) => -60 + (i * 60) / 200);
  const edge = (pick: "lower" | "upper", a: number) =>
    ratiosDb.map((r) => ({ x: r, y: round6(lockingRange(kc, 10 ** (r / 10), a)[pick]) }));
  const series = [
    { name: "Upper edge k_c√ρ", color: "#60a5fa", points: edge("upper", alpha) },
    { name: "Lower edge −k_c√ρ√(1+α²)", color: "#f472b6", points: edge("lower", alpha) },
    ...(alpha !== 0 ? [{ name: "Adler lower edge (α = 0)", color: "#9ca3af", dashed: true, points: edge("lower", 0) }] : []),
    ...(Number.isFinite(rhoDb) && rhoDb >= -60 && rhoDb <= 0
      ? [{ name: "This detuning", color: locked ? "#34d399" : "#f87171", showPoints: true, points: [{ x: round6(rhoDb), y: round6(detuning) }] }]
      : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Injected master power P_inj (mW)" value={masterPowerRaw} onChange={setMasterPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Slave output power P (mW)" value={slavePowerRaw} onChange={setSlavePower} min={1e-9} max={1e9} step="any" />
        <ValidatedNumberInput label="Coupling rate k_c/2π (GHz)" value={couplingRaw} onChange={setCoupling} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Linewidth enhancement factor α" value={alphaRaw} onChange={setAlpha} min={-20} max={20} step="any" />
        <ValidatedNumberInput label="Detuning f_master − f_slave (GHz)" value={detuningRaw} onChange={setDetuning} min={-1e5} max={1e5} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Locking range" value={`${fmt(lower)} to +${fmt(upper)} GHz`} subtext={`width ${fmt(upper - lower)} GHz`} tone="blue" />
        <ResultCard label="Injection ratio ρ" value={`${fmt(rhoDb, 4)} dB`} subtext={`P_inj/P = ${fmt(rho)}; √ρ = ${fmt(Math.sqrt(rho))}`} tone="purple" />
        <ResultCard label="Adler range (α = 0)" value={`±${fmt(adler.upper)} GHz`} subtext={`α widens the red side by √(1+α²) = ${fmt(Math.hypot(1, alpha))}`} tone="orange" />
        <ResultCard label="At this detuning" value={locked ? "Locked" : "Unlocked"}
          subtext={locked ? "inside the static locking range" : "the slave beats with the master (four-wave mixing, pulsations)"} tone={locked ? "green" : "red"} />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>A weak master field injected into a free-running slave laser pulls its frequency onto the master&apos;s when the
          detuning Δf = f_master − f_slave lies inside −(k_c/2π)√ρ√(1 + α²) ≤ Δf ≤ (k_c/2π)√ρ, with ρ = P_inj/P. For α = 0
          (gas and solid-state lasers) this is Adler&apos;s symmetric range. In a semiconductor laser the gain and the
          refractive index change together (α ≈ 3–6), which stretches the range towards negative detuning. The coupling
          rate k_c is an input: it is set by the transmission of the facet the light enters through and the cavity round-trip
          time, tens of GHz for an edge-emitting diode, and authors define it with different factors of order unity. The
          static range is necessary, not sufficient: near its positive edge, relaxation-oscillation
          dynamics can make the locked state unstable.</p>
      </div>

      <SimpleLineChart title="Locking map" xLabel="Injection ratio ρ (dB)" yLabel="Detuning (GHz)" series={series} />
    </>
  );
}
