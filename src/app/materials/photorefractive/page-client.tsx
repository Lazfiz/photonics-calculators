"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  POCKELS, balancedGratingPeriod, diffusionField, gratingPeriod, spaceChargeField, trapLimitedField, twoBeamCouplingGain,
  twoBeamSignalGain,
} from "../../../physics/materials/pockels";
import { refractionAngle } from "../../../physics/polarization/fresnel";

type Choice = "linbo3" | "custom";
const CHOICES: readonly Choice[] = ["linbo3", "custom"];
const DEFAULT_ID: Choice = "linbo3";
const LN = POCKELS.linbo3;
const WAVELENGTH_MIN_NM = 400;
const WAVELENGTH_MAX_NM = 2000;
const ANGLE_MIN_DEG = 0.1;
const ANGLE_MAX_DEG = 170;
const CHART_POINTS = 120;
const DEG = Math.PI / 180;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});

interface Grating { period: number; ED: number; Eq: number; Esc: number; gamma: number }

/** Steady-state diffusion grating and gain for two beams crossing at the full outside angle 2θ. */
function grating(lambda: number, fullAngle: number, n: number, r: number, epsilon: number, T: number, Neff: number): Grating {
  const period = gratingPeriod(lambda, fullAngle / 2);
  const thetaIn = refractionAngle(1, n, fullAngle / 2);
  const ED = diffusionField(period, T);
  const Eq = trapLimitedField(period, Neff, epsilon);
  const Esc = spaceChargeField(ED, Eq);
  return { period, ED, Eq, Esc, gamma: twoBeamCouplingGain(lambda, n, r, Esc, thetaIn) };
}

function gainChart(lambda: number, angle_deg: number, n: number, r: number, epsilon: number, T: number, Neff: number) {
  const xs = Array.from({ length: CHART_POINTS + 1 }, (_, k) => ANGLE_MIN_DEG * (ANGLE_MAX_DEG / ANGLE_MIN_DEG) ** (k / CHART_POINTS));
  const pts = xs.map((a) => ({ x: a, y: grating(lambda, a * DEG, n, r, epsilon, T, Neff).gamma / 100 })).filter((p) => Number.isFinite(p.y));
  if (pts.length === 0) return [];
  const g = grating(lambda, angle_deg * DEG, n, r, epsilon, T, Neff).gamma / 100;
  return [
    { x: pts.map((p) => round6(p.x)), y: pts.map((p) => round6(p.y)), type: "scatter", mode: "lines", name: "Γ", line: { color: "#60a5fa", width: 2 } },
    ...(Number.isFinite(g) ? [{ x: [round6(angle_deg)], y: [round6(g)], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } }] : []),
  ];
}

export default function PhotorefractivePage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 532); // nm
  const [angleRaw, setAngle] = useURLState("angle", 20); // full crossing angle outside, degrees
  const [temperatureRaw, setTemperature] = useURLState("temperature", 295); // K
  const [trapsRaw, setTraps] = useURLState("traps", 10); // N_eff, 1e22 m⁻³
  const [lengthRaw, setLength] = useURLState("length", 5); // mm
  const [ratioRaw, setRatio] = useURLState("ratio", 1000); // pump/signal
  const [nRaw, setN] = useURLState("n", 2.2);
  const [rRaw, setR] = useURLState("r", 30.8); // pm/V
  const [epsRaw, setEps] = useURLState("epsilon", 28);
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const custom = choice === "custom";
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 532);
  const angle_deg = clamp(angleRaw, ANGLE_MIN_DEG, ANGLE_MAX_DEG, 20);
  const T = clamp(temperatureRaw, 1, 1000, 295);
  const traps = clamp(trapsRaw, 0.001, 1e4, 10);
  const length_mm = clamp(lengthRaw, 0.01, 100, 5);
  const ratio = clamp(ratioRaw, 1e-3, 1e9, 1000);
  const lambda = wavelength_nm * 1e-9;
  const Neff = traps * 1e22;

  const ne = LN.indices(lambda).ne;
  const n = custom ? clamp(nRaw, 1, 5, 2.2) : ne;
  const r = custom ? clamp(rRaw, 0.01, 5000, 30.8) * 1e-12 : LN.r.r33!;
  const epsilon = custom ? clamp(epsRaw, 1, 1e5, 28) : LN.epsilon;
  const g = grating(lambda, angle_deg * DEG, n, r, epsilon, T, Neff);
  const balanced = balancedGratingPeriod(Neff, epsilon, T);
  const dn = 0.5 * n ** 3 * r * g.Esc;
  const signalGain = twoBeamSignalGain(g.gamma * length_mm * 1e-3, ratio);
  const chart = gainChart(lambda, angle_deg, n, r, epsilon, T, Neff);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-6 sm:w-1/2" role="group" aria-label="Material">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : "LiNbO₃ (e-polarized, r₃₃)"}
          </button>
        ))}
      </div>

      {custom && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Effective coefficient r_eff (pm/V)" value={rRaw} onChange={setR} min={0.01} max={5000} step="0.1" />
          <ValidatedNumberInput label="Static permittivity ε (along K)" value={epsRaw} onChange={setEps} min={1} max={100000} step="1" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Full crossing angle 2θ outside (°)" value={angleRaw} onChange={setAngle} min={ANGLE_MIN_DEG} max={ANGLE_MAX_DEG} step="1" />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Effective trap density N_eff (10²² m⁻³)" value={trapsRaw} onChange={setTraps} min={0.001} max={10000} step="1" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0.01} max={100} step="0.5" />
        <ValidatedNumberInput label="Pump / signal ratio β" value={ratioRaw} onChange={setRatio} min={0.001} max={1e9} step="10" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {custom
          ? "Custom crystal: r_eff and ε belong to the chosen polarization and grating direction."
          : `LiNbO₃ with e-polarized beams and the grating along c: r₃₃ = 30.8 pm/V, ε₃₃ = 28 (Weis & Gaylord 1985), n_e = ${sig(ne, 5)} (Zelmon et al. 1997).`}{" "}
        N_eff depends on doping and is an input, not a material constant.{" "}
        {!Number.isFinite(n) && <span className="text-yellow-400">The wavelength is outside the index fit (400–5000 nm).</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Grating period Λ = λ/(2 sin θ)" value={`${sig(g.period * 1e6, 4)} µm`} tone="gray"
          subtext={`E_D = E_q at Λ = ${sig(balanced * 1e6, 3)} µm`} />
        <ResultCard label="Diffusion field E_D" value={`${sig(g.ED / 1e3, 4)} kV/m`} tone="cyan" subtext="k_B T K / q" />
        <ResultCard label="Trap-limited field E_q" value={Number.isFinite(g.Eq) ? `${sig(g.Eq / 1e3, 4)} kV/m` : "—"} tone="purple" subtext="q N_eff / (ε₀ ε K)" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ResultCard label="Space-charge field E_sc (per unit m)" value={Number.isFinite(g.Esc) ? `${sig(g.Esc / 1e3, 4)} kV/m` : "—"} tone="orange"
          subtext="E_D / (1 + E_D/E_q), a quarter period from the fringes" />
        <ResultCard label="Index grating ½n³r_eff E_sc (per unit m)" value={Number.isFinite(dn) ? dn.toExponential(3) : "—"} tone="yellow"
          subtext="multiply by the fringe modulation m" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Two-beam coupling gain Γ" value={Number.isFinite(g.gamma) ? `${sig(g.gamma / 100, 4)} cm⁻¹` : "—"} tone="blue"
          subtext="2π n³ r_eff E_sc / (λ cos θ_in); the c-axis sense sets which beam gains" />
        <ResultCard label="Signal gain after L" value={Number.isFinite(signalGain) ? `${sig(signalGain, 4)}×` : "—"} tone="green"
          subtext={`(1 + β)/(1 + β e^(−ΓL)), no absorption; e^(ΓL) = ${sig(Math.exp(g.gamma * length_mm * 1e-3), 4)}`} />
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Gain against crossing angle</h3>
          <ChartPanel data={chart} layout={{ ...layout("Full crossing angle 2θ outside (°)", "Γ (cm⁻¹)"), xaxis: { title: "Full crossing angle 2θ outside (°)", gridcolor: "#374151", type: "log" } }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">E_sc = E_D / (1 + E_D/E_q),  Γ = 2π n³ r_eff E_sc / (λ cos θ)</p>
          <p>
            Kukhtarev&apos;s band-transport model in steady state, with one carrier type, diffusion only (no applied field), small
            fringe modulation and no photovoltaic current. The grating is shifted a quarter period from the fringes, so the
            beams exchange energy: dI₁/dz = Γ I₁I₂/(I₁ + I₂).
          </p>
          <p>
            Small angles give long periods and a weak diffusion field; large angles give short periods, where the trap density
            caps the field. Γ peaks near Λ = 2π√(ε₀εk_BT/(q²N_eff)).
          </p>
          <p>
            Fe:LiNbO₃ is dominated by its photovoltaic current, which this model leaves out: its diffusion gain is a lower
            bound. BaTiO₃, SBN and the sillenites (BSO, BGO) need the effective coefficient of their cut and polarization,
            so enter them as a custom crystal.
          </p>
        </div>
      </div>
    </>
  );
}
