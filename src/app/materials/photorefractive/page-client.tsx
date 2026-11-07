"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  POCKELS, balancedGratingPeriod, crystalMedium, customMedium, photorefractiveGrating, twoBeamSignalGain,
  type PhotorefractiveMedium as Medium,
} from "../../../physics/materials/pockels";

type Choice = "linbo3" | "batio3" | "batio3-clamped" | "custom";
const CHOICES: readonly Choice[] = ["linbo3", "batio3", "batio3-clamped", "custom"];
const LABELS: Record<Choice, string> = {
  linbo3: "LiNbO₃ (K ∥ c)", batio3: "BaTiO₃ (unclamped)", "batio3-clamped": "BaTiO₃ (clamped)", custom: "Custom",
};
const DEFAULT_ID: Choice = "linbo3";
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

function lineChart(xs: number[], f: (x: number) => number, selected: number) {
  const pts = xs.map((x) => ({ x, y: f(x) })).filter((p) => Number.isFinite(p.y));
  if (pts.length === 0) return [];
  const g = f(selected);
  return [
    { x: pts.map((p) => round6(p.x)), y: pts.map((p) => round6(p.y)), type: "scatter", mode: "lines", name: "Γ", line: { color: "#60a5fa", width: 2 } },
    ...(Number.isFinite(g) ? [{ x: [round6(selected)], y: [round6(g)], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } }] : []),
  ];
}

const ANGLES = Array.from({ length: CHART_POINTS + 1 }, (_, k) => ANGLE_MIN_DEG * (ANGLE_MAX_DEG / ANGLE_MIN_DEG) ** (k / CHART_POINTS));
const BETAS = Array.from({ length: 91 }, (_, k) => k);

export default function PhotorefractivePage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 532); // nm
  const [angleRaw, setAngle] = useURLState("angle", 20); // full crossing angle outside, degrees
  const [betaRaw, setBeta] = useURLState("beta", 45); // angle between K and c, degrees (BaTiO₃)
  const [temperatureRaw, setTemperature] = useURLState("temperature", 295); // K
  const [trapsRaw, setTraps] = useURLState("traps", 1); // N_eff, 1e22 m⁻³
  const [lengthRaw, setLength] = useURLState("length", 5); // mm
  const [ratioRaw, setRatio] = useURLState("ratio", 1000); // pump/signal
  const [nRaw, setN] = useURLState("n", 2.2);
  const [rRaw, setR] = useURLState("r", 30.8); // pm/V
  const [epsRaw, setEps] = useURLState("epsilon", 28);
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const custom = choice === "custom";
  const batio3 = choice === "batio3" || choice === "batio3-clamped";
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 532);
  const angle_deg = clamp(angleRaw, ANGLE_MIN_DEG, ANGLE_MAX_DEG, 20);
  const beta_deg = clamp(betaRaw, 0, 90, 45);
  const T = clamp(temperatureRaw, 1, 1000, 295);
  const traps = clamp(trapsRaw, 0.001, 1e4, 1);
  const length_mm = clamp(lengthRaw, 0.01, 100, 5);
  const ratio = clamp(ratioRaw, 1e-3, 1e9, 1000);
  const lambda = wavelength_nm * 1e-9;
  const Neff = traps * 1e22;

  const mediumAt = (b_deg: number): Medium => (custom
    ? customMedium(clamp(nRaw, 1, 5, 2.2), clamp(epsRaw, 1, 1e5, 28), clamp(rRaw, 0.01, 5000, 30.8) * 1e-12)
    : crystalMedium(choice, lambda, batio3 ? b_deg * DEG : 0));
  const m = mediumAt(beta_deg);
  const g = photorefractiveGrating(lambda, angle_deg * DEG, m, T, Neff);
  const balanced = balancedGratingPeriod(Neff, m.epsilon, T);
  const dn = 0.5 * m.n ** 3 * g.rEff * g.Esc;
  const signalGain = twoBeamSignalGain(g.gamma * length_mm * 1e-3, ratio);
  const angleChart = lineChart(ANGLES, (a) => photorefractiveGrating(lambda, a * DEG, m, T, Neff).gamma / 100, angle_deg);
  const betaChart = batio3 ? lineChart(BETAS, (b) => photorefractiveGrating(lambda, angle_deg * DEG, mediumAt(b), T, Neff).gamma / 100, beta_deg) : [];
  const outOfRange = !custom && !Number.isFinite(m.n);
  const crystal = custom ? null : POCKELS[choice];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6" role="group" aria-label="Material">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {LABELS[id]}
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
        {batio3 && (
          <ValidatedNumberInput label="Angle β between K and c (°)" value={betaRaw} onChange={setBeta} min={0} max={90} step="1" />
        )}
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Effective trap density N_eff (10²² m⁻³)" value={trapsRaw} onChange={setTraps} min={0.001} max={10000} step="1" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0.01} max={100} step="0.5" />
        <ValidatedNumberInput label="Pump / signal ratio β_I" value={ratioRaw} onChange={setRatio} min={0.001} max={1e9} step="10" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {custom && "Custom crystal: r_eff and ε belong to the chosen polarization and grating direction; the gain uses full fringe contrast."}
        {choice === "linbo3" && `LiNbO₃ with e-polarized beams and the grating along c: r₃₃ = 30.8, r₁₃ = 8.6 pm/V, ε₃₃ = 28 (Weis & Gaylord 1985), n_o, n_e (Zelmon et al. 1997).`}
        {batio3 && crystal && `${crystal.name} with e-polarized beams, beams symmetric about the face normal and K at β from c (entrance face normal at 90° − β from c, c in the plane of incidence): r₁₃ ${sig(crystal.r.r13! * 1e12, 3)}, r₃₃ ${sig(crystal.r.r33! * 1e12, 3)}, r₄₂ ${sig(crystal.r.r42! * 1e12, 4)} pm/V, ε₁₁ ${crystal.epsilon11}, ε₃₃ ${crystal.epsilon} (Zgonik et al. 1994, 633 nm); n_o, n_e (Wemple et al. 1968, 400–700 nm).`}{" "}
        N_eff depends on doping and is an input, not a material constant.
      </p>

      {outOfRange && (
        <p className="text-sm mb-4 text-yellow-400">
          {crystal?.name}&apos;s index fit covers {Math.round(crystal!.range[0] * 1e9)}–{Math.round(crystal!.range[1] * 1e9)} nm.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Grating period Λ = λ/(2 sin θ)" value={`${sig(g.period * 1e6, 4)} µm`} tone="gray"
          subtext={`E_D = E_q at Λ = ${sig(balanced * 1e6, 3)} µm`} />
        <ResultCard label="Diffusion field E_D" value={`${sig(g.ED / 1e3, 4)} kV/m`} tone="cyan" subtext="k_B T K / q" />
        <ResultCard label="Trap-limited field E_q" value={Number.isFinite(g.Eq) ? `${sig(g.Eq / 1e3, 4)} kV/m` : "—"} tone="purple"
          subtext={`q N_eff / (ε₀ ε_K K), ε_K = ${sig(m.epsilon, 4)}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Effective coefficient r_eff" value={Number.isFinite(g.rEff) ? `${sig(g.rEff * 1e12, 4)} pm/V` : "—"} tone="gray"
          subtext={custom ? "as entered" : `n = ${sig(m.n, 5)}, θ_in = ${sig(g.thetaIn / DEG, 3)}°, fringe contrast cos 2θ_in included`} />
        <ResultCard label="Space-charge field E_sc (per unit m)" value={Number.isFinite(g.Esc) ? `${sig(g.Esc / 1e3, 4)} kV/m` : "—"} tone="orange"
          subtext="E_D / (1 + E_D/E_q), a quarter period from the fringes" />
        <ResultCard label="Index grating ½n³r_eff E_sc (per unit m)" value={Number.isFinite(dn) ? dn.toExponential(3) : "—"} tone="yellow"
          subtext={custom ? "multiply by the fringe modulation m" : "multiply by m = 2√(I₁I₂)/(I₁ + I₂); the polarization overlap is in r_eff"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Two-beam coupling gain Γ" value={Number.isFinite(g.gamma) ? `${sig(g.gamma / 100, 4)} cm⁻¹` : "—"} tone="blue"
          subtext="2π n³ r_eff E_sc / (λ cos θ_in); the c-axis sense sets which beam gains" />
        <ResultCard label="Signal gain after L" value={Number.isFinite(signalGain) ? `${sig(signalGain, 4)}×` : "—"} tone="green"
          subtext={`(1 + β_I)/(1 + β_I e^(−ΓL)), no absorption; e^(ΓL) = ${sig(Math.exp(g.gamma * length_mm * 1e-3), 4)}`} />
      </div>

      {angleChart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Gain against crossing angle</h3>
          <ChartPanel data={angleChart} layout={{ ...layout("Full crossing angle 2θ outside (°)", "Γ (cm⁻¹)"), xaxis: { title: "Full crossing angle 2θ outside (°)", gridcolor: "#374151", type: "log" } }} />
        </div>
      )}
      {betaChart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Gain against grating direction</h3>
          <ChartPanel data={betaChart} layout={layout("Angle β between K and c (°)", "Γ (cm⁻¹)")} />
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
            caps the field. Γ peaks near Λ = 2π√(ε₀ε_Kk_BT/(q²N_eff)).
          </p>
          <p className="font-mono">n⁴r_eff = cos 2θ · cos β · [n_o⁴r₁₃(sin²β − sin²θ) + 2n_o²n_e²r₄₂ sin²β + n_e⁴r₃₃(cos²β − sin²θ)]</p>
          <p>
            For e-polarized beams at ±θ inside, the grating couples them through ê₁·ε(R·K̂)ε·ê₂ times the fringe contrast
            ê₁·ê₂ = cos 2θ, and E_q uses the permittivity along K, ε_K = ε₁₁ sin²β + ε₃₃ cos²β (Feinberg et al. 1980). With K
            along c (β = 0, LiNbO₃) only r₃₃ and r₁₃ act. In BaTiO₃ a tilted grating brings in the large r₄₂, and r_eff peaks
            near β ≈ 53°, close to where r₄₂ sin²β cos β is largest. But ε₁₁ ≫ ε₃₃, so tilting K also lowers E_q: when the trap
            density limits the field (short periods, low N_eff), Γ peaks at a smaller β, down to β = 0. n is the e-index
            along the bisector; walk-off (≈ 1° in BaTiO₃) and anisotropic carrier mobility are neglected.
          </p>
          <p>
            A grating&apos;s strain is neither zero nor free: its effective r and ε add piezoelectric and elasto-optic terms that
            depend on K (Zgonik et al. 1994). The clamped and unclamped BaTiO₃ sets are the two limiting cases, not the
            grating&apos;s own values. The r are 633 nm values used at every wavelength.
          </p>
          <p>
            Fe:LiNbO₃ is dominated by its photovoltaic current, which this model leaves out: its diffusion gain is a lower
            bound. SBN and the sillenites (BSO, BGO) need the effective coefficient of their cut and polarization, so enter
            them as a custom crystal.
          </p>
        </div>
      </div>
    </>
  );
}
