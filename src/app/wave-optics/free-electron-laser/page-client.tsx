"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { q } from "../../../physics/constants";
import { felPower, freeElectronLaser, type FelInput } from "../../../physics/wave-optics/free-electron-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const MeV = 1e6 * q;

export default function FreeElectronLaserPage() {
  const [energyRaw, setEnergy] = useURLState("electronEnergy", 100); // MeV kinetic
  const [periodRaw, setPeriod] = useURLState("undulatorPeriod", 30); // mm
  const [KRaw, setK] = useURLState("undulatorK", 1.5);
  const [lengthRaw, setLength] = useURLState("undulatorLength", 15); // m
  const [currentRaw, setCurrent] = useURLState("beamCurrent", 100); // A
  const [emittanceRaw, setEmittance] = useURLState("beamEmittance", 5); // mm mrad, normalized
  const [betaRaw, setBeta] = useURLState("betaFunction", 1); // m
  const [spreadRaw, setSpread] = useURLState("energySpread", 0.001); // relative rms

  const input: FelInput = {
    kineticEnergy: clamp(energyRaw, 1, 1e5, 100) * MeV,
    lambdaU: clamp(periodRaw, 1, 1000, 30) * 1e-3,
    K: clamp(KRaw, 0.01, 100, 1.5),
    current: clamp(currentRaw, 0.01, 1e6, 100),
    normEmittance: clamp(emittanceRaw, 1e-3, 1000, 5) * 1e-6,
    beta: clamp(betaRaw, 0.01, 1000, 1),
    energySpread: clamp(spreadRaw, 0, 0.1, 0.001),
  };
  const Lu = clamp(lengthRaw, 0.01, 1000, 15);
  const r = freeElectronLaser(input);
  const pEnd = felPower(Lu, r);
  const saturated = Lu >= r.saturationLength;

  const zMax = Math.max(Lu, 1.2 * (Number.isFinite(r.saturationLength) ? r.saturationLength : 0));
  const powerSeries = [
    {
      name: "P(z), exponential gain to P_sat",
      color: "#fbbf24",
      points: Array.from({ length: 201 }, (_, i) => {
        const z = (zMax * i) / 200;
        return { x: round6(z), y: round6(felPower(z, r)) };
      }).filter((p) => Number.isFinite(p.y) && p.y > 0),
    },
    { name: "Undulator end", color: "#f87171", showPoints: true, points: Number.isFinite(pEnd) && pEnd > 0 ? [{ x: round6(Lu), y: round6(pEnd) }] : [] },
  ];

  const kLo = Math.min(0.3, input.K / 2);
  const kHi = Math.max(5, 2 * input.K);
  const Ks = Array.from({ length: 100 }, (_, i) => kLo + (i * (kHi - kLo)) / 99);
  const gainVsK = (key: "gainLength" | "gainLength1D") => Ks
    .map((K) => ({ x: round6(K), y: round6(freeElectronLaser({ ...input, K })[key]) }))
    .filter((p) => Number.isFinite(p.y));
  const kSeries = [
    { name: "L_G with emittance, diffraction, energy spread (Xie)", color: "#60a5fa", points: gainVsK("gainLength") },
    { name: "L_G0, 1D cold beam", color: "#a78bfa", dashed: true, points: gainVsK("gainLength1D") },
    { name: "Input K", color: "#f87171", showPoints: true, points: Number.isFinite(r.gainLength) ? [{ x: round6(input.K), y: round6(r.gainLength) }] : [] },
  ];

  const E0 = input.kineticEnergy / MeV;
  const energies = Array.from({ length: 121 }, (_, i) => E0 * 10 ** ((i - 60) / 60));
  const wlSeries = [{
    name: "λ₁",
    color: "#34d399",
    points: energies
      .map((E) => ({ x: round6(E), y: round6(freeElectronLaser({ ...input, kineticEnergy: E * MeV }).wavelength * 1e9) }))
      .filter((p) => Number.isFinite(p.y)),
  }];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Electron beam and planar undulator</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Electron kinetic energy (MeV)" value={energyRaw} onChange={setEnergy} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Peak current I (A)" value={currentRaw} onChange={setCurrent} min={0.01} max={1e6} step="any" />
        <ValidatedNumberInput label="Normalized emittance ε_n (mm mrad)" value={emittanceRaw} onChange={setEmittance} min={1e-3} max={1000} step="any" />
        <ValidatedNumberInput label="Relative energy spread σ_δ (rms)" value={spreadRaw} onChange={setSpread} min={0} max={0.1} step="any" />
        <ValidatedNumberInput label="Average β function (m)" value={betaRaw} onChange={setBeta} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Undulator period λ_u (mm)" value={periodRaw} onChange={setPeriod} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Undulator K (peak)" value={KRaw} onChange={setK} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Undulator length (m)" value={lengthRaw} onChange={setLength} min={0.01} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Resonance wavelength λ₁" value={`${fmt(r.wavelength * 1e9)} nm`} subtext={`γ = ${fmt(r.gamma)}; [JJ] = ${fmt(r.jj)}`} tone="green" />
        <ResultCard label="Pierce parameter ρ" value={fmt(r.rho)} subtext={`beam size σ_x = √(βε_n/γ) = ${fmt(r.sigmaX * 1e6)} µm`} tone="yellow" />
        <ResultCard label="Power gain length L_G" value={`${fmt(r.gainLength)} m`} subtext={`1D cold beam L_G0 = ${fmt(r.gainLength1D)} m`} tone="red" />
        <ResultCard label="Saturation length" value={Number.isFinite(r.saturationLength) ? `${fmt(r.saturationLength)} m` : "—"} subtext={Number.isFinite(r.saturationLength) ? `L_G ln(9P_sat/P_n), noise P_n = ${fmt(r.noisePower)} W` : "no exponential gain: 9 P_sat ≤ P_n"} tone="orange" />
      </div>
      {input.energySpread > r.rho && (
        <p className="mb-4 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          σ_δ = {fmt(input.energySpread)} exceeds ρ = {fmt(r.rho)}: the energy spread is wider than the FEL gain bandwidth, so the gain is
          strongly suppressed and Xie&apos;s fit is extrapolated.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Saturation power" value={`${fmt(r.saturationPower / 1e6)} MW`} subtext={`1.6ρ(L_G0/L_G)² of P_beam = ${fmt(r.beamPower / 1e9)} GW`} tone="purple" />
        <ResultCard label="Power at the undulator end" value={`${fmt(pEnd)} W`} subtext={saturated ? "saturated" : `${fmt(Lu / r.gainLength, 3)} gain lengths, not saturated`} tone={saturated ? "purple" : "gray"} />
        <ResultCard label="Xie parameters η_d, η_ε, η_γ" value={`${fmt(r.etaD, 2)}, ${fmt(r.etaE, 2)}, ${fmt(r.etaG, 2)}`} subtext="diffraction, emittance, energy spread; keep ≪ 1" tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>λ₁ = λ_u(1 + K²/2)/(2γ²); ρ = [(1/16)(I/I_A)K²[JJ]²/(γ³σ_x²k_u²)]^(1/3) with I_A = 4πε₀mc³/e = 17.045 kA and
          [JJ] = J₀(ξ) − J₁(ξ), ξ = K²/(4 + 2K²) (Huang–Kim). L_G0 = λ_u/(4π√3 ρ); L_G = L_G0(1 + Λ) from Ming Xie&apos;s fit in
          η_d = L_G0/(2k₁σ_x²), η_ε = (L_G0/β)(4πε/λ₁), η_γ = 4π(L_G0/λ_u)σ_δ, within about 10 % of numerical solutions.</p>
        <p>SASE from shot noise: P(z) = (P_n/9) exp(z/L_G) up to P_sat, with the 1D noise P_n = ρ²cγmc²/λ₁. The plot stops growth at
          P_sat; the real power overshoots and oscillates there.</p>
      </div>

      <div className="space-y-6">
        {powerSeries[0].points.length > 0 && <SimpleLineChart title="Power along the undulator" xLabel="z (m)" yLabel="Power (W)" yScale="log" series={powerSeries} />}
        {kSeries[0].points.length > 0 && <SimpleLineChart title="Gain length against undulator K" xLabel="K" yLabel="Gain length (m)" yScale="log" series={kSeries} />}
        {wlSeries[0].points.length > 0 && <SimpleLineChart title="Resonance wavelength against electron energy" xLabel="Kinetic energy (MeV)" yLabel="λ₁ (nm)" xScale="log" yScale="log" series={wlSeries} />}
      </div>
    </>
  );
}
