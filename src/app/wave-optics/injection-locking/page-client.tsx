"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { facetCouplingRate, lockingRange } from "../../../physics/wave-optics/injection-locking";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function InjectionLockingPage() {
  const [masterPowerRaw, setMasterPower] = useURLState("masterPower", 0.1); // mW injected
  const [slavePowerRaw, setSlavePower] = useURLState("slavePower", 10); // mW
  const [couplingRaw, setCoupling] = useURLState("couplingRate", 24.51); // GHz, k_c/2π: the facet estimate for the cavity defaults
  const [alphaRaw, setAlpha] = useURLState("alpha", 1); // 0.98 µm InGaAs/GaAs QW (Berger et al. 1991)
  const [detuningRaw, setDetuning] = useURLState("detuning", -1); // GHz
  const [lengthRaw, setLength] = useURLState("cavityLength", 300); // µm
  const [facetRRaw, setFacetR] = useURLState("facetR", 0.32);
  const [ngRaw, setNg] = useURLState("ng", 3.9);

  const Pinj = clamp(masterPowerRaw, 0, 1e9, 0.1);
  const Pslave = clamp(slavePowerRaw, 1e-9, 1e9, 10);
  const kc = clamp(couplingRaw, 0, 1e4, 24.51); // GHz (k_c/2π)
  const alpha = clamp(alphaRaw, -20, 20, 1);
  const detuning = clamp(detuningRaw, -1e5, 1e5, -1); // GHz
  const cavityL = clamp(lengthRaw, 1, 1e6, 300) * 1e-6;
  const facetR = clamp(facetRRaw, 1e-4, 0.9999, 0.32);
  const ng = clamp(ngRaw, 1, 6, 3.9);
  const kcFacet = facetCouplingRate(facetR, cavityL, ng) / (2 * Math.PI) / 1e9; // GHz
  const roundTrip = (2 * ng * cavityL) / c; // s

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
        <ValidatedNumberInput label="Injected master power P_inj (mW, mode-matched)" value={masterPowerRaw} onChange={setMasterPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Slave output P from the injection facet (mW)" value={slavePowerRaw} onChange={setSlavePower} min={1e-9} max={1e9} step="any" />
        <ValidatedNumberInput label="Coupling rate k_c/2π (GHz)" value={couplingRaw} onChange={setCoupling} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Linewidth enhancement factor α" value={alphaRaw} onChange={setAlpha} min={-20} max={20} step="any" />
        <ValidatedNumberInput label="Detuning f_master − f_slave (GHz)" value={detuningRaw} onChange={setDetuning} min={-1e5} max={1e5} step="any" />
      </div>

      <h2 className="text-lg font-semibold mb-3">Coupling rate from the slave cavity</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Cavity length L (µm)" value={lengthRaw} onChange={setLength} min={1} max={1e6} step="any" />
        <ValidatedNumberInput label="Injection facet reflectance R" value={facetRRaw} onChange={setFacetR} min={1e-4} max={0.9999} step="any" />
        <ValidatedNumberInput label="Group index n_g" value={ngRaw} onChange={setNg} min={1} max={6} step="any" />
      </div>
      <p className="mb-8 text-sm text-gray-300">
        k_c = (1 − R)/(τ_rt√R) = 2π × {fmt(kcFacet)} GHz, τ_rt = 2n_gL/c = {fmt(roundTrip * 1e12)} ps.{" "}
        <button type="button" disabled={!Number.isFinite(kcFacet)} onClick={() => setCoupling(Number(kcFacet.toPrecision(4)))}
          className="text-blue-400 hover:text-blue-300 disabled:text-gray-500">Use this k_c</button>
      </p>

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
          refractive index change together, which stretches the range towards negative detuning: Berger et al. (1991) measured
          α ≈ 1 in 0.98 µm InGaAs/GaAs quantum-well lasers (the default), against ≈ 3.5 for InGaAsP/InP quantum wells and ≈ 5.7
          for InGaAsP/InP double heterostructures. The coupling rate k_c is an input. The estimate above,
          k_c = (1 − R)/(τ_rt√R) (Kondratiev et al. 2023, Eq. 4), sets the default for a 300 µm cleaved GaAs-based diode
          (R 0.32, n_g 3.9 from Wenzel et al. 2021); other authors define it with different factors of order unity. It pairs with ρ = P_inj/P when both powers
          are taken outside the injection facet; entering the total output of a symmetric slave halves ρ. The
          static range is necessary, not sufficient: near its positive edge, relaxation-oscillation
          dynamics can make the locked state unstable.</p>
      </div>

      <SimpleLineChart title="Locking map" xLabel="Injection ratio ρ (dB)" yLabel="Detuning (GHz)" series={series} />
    </>
  );
}
