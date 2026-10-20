"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  dimer, dimerPeaks, homogeneousFwhm, linearAbsorption, spectrum2D, transferMatrix,
} from "../../../physics/spectroscopy/two-dimensional";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const DEG = Math.PI / 180;
const N = 121;

export default function TwoDimensionalSpectroscopyPage() {
  const [nu0Raw, setNu0] = useURLState("excitationCenter", 12500);
  const [deltaRaw, setDelta] = useURLState("siteDifference", 200);
  const [jRaw, setJ] = useURLState("coupling", 100);
  const [phiRaw, setPhi] = useURLState("dipoleAngle", 60);
  const [inhRaw, setInh] = useURLState("linewidth", 100);
  const [t2Raw, setT2] = useURLState("t2", 200);
  const [twRaw, setTw] = useURLState("waitingTime", 0);
  const [relaxRaw, setRelax] = useURLState("relaxation", 300);
  const [tempRaw, setTemp] = useURLState("temperature", 300);

  // cm⁻¹ in the UI, m⁻¹ in the physics
  const nu0 = clamp(nu0Raw, 500, 50000, 12500) * 100;
  const delta = clamp(deltaRaw, 0, 5000, 200) * 100;
  const J = clamp(jRaw, -2000, 2000, 100) * 100;
  const phi = clamp(phiRaw, 0, 180, 60) * DEG;
  const inh = clamp(inhRaw, 0, 2000, 100) * 100;
  const t2 = clamp(t2Raw, 1, 1e5, 200) * 1e-15;
  const tw = clamp(twRaw, 0, 1e6, 0) * 1e-15;
  const relax = clamp(relaxRaw, 1, 1e7, 300) * 1e-15;
  const temperature = clamp(tempRaw, 0, 2000, 300);

  const d = dimer(nu0, delta, J, phi);
  const hom = homogeneousFwhm(t2);
  const peaks = dimerPeaks(d, tw, relax, temperature);
  const P = transferMatrix(d, tw, relax, temperature);
  const [Em, Ep] = d.energies;
  const strength = d.mu0.map((m) => m[0] ** 2 + m[1] ** 2);
  const pad = 3 * Math.max(inh, hom, 20e2);
  const start = Math.max(Em - pad, 1e2);
  const axis = Array.from({ length: N }, (_, i) => start + (i / (N - 1)) * (Ep + pad - start));
  const z = spectrum2D(axis, axis, peaks, inh, hom);
  const zMax = Math.max(...z.flat().map(Math.abs));
  const zNorm = z.map((row) => row.map((v) => Number((v / zMax).toFixed(4))));
  const cm = axis.map((w) => Number((w / 100).toFixed(2)));

  const map = [
    {
      x: cm, y: cm, z: zNorm, type: "heatmap", zmin: -1, zmax: 1, name: "2D spectrum",
      colorscale: [[0, "#1d4ed8"], [0.35, "#60a5fa"], [0.5, "#f9fafb"], [0.65, "#fca5a5"], [1, "#b91c1c"]],
      colorbar: { title: { text: "S / |S|max" } },
    },
    { x: [cm[0], cm[N - 1]], y: [cm[0], cm[N - 1]], type: "scatter", mode: "lines", name: "diagonal ω₁ = ω₃", line: { color: "#111827", dash: "dash", width: 1 } },
  ];
  const linear = (() => {
    const ys = axis.map((w) => linearAbsorption(w, d, inh, hom));
    const m = Math.max(...ys);
    return [{ x: cm, y: ys.map((v) => Number((v / m).toFixed(5))), type: "scatter", mode: "lines", name: "Linear absorption", line: { color: "#34d399", width: 2 } }];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Mean Site Energy ν₀ (cm⁻¹)" value={nu0Raw} onChange={setNu0} min={500} max={50000} step="100" />
        <ValidatedNumberInput label="Site Energy Difference Δ (cm⁻¹)" value={deltaRaw} onChange={setDelta} min={0} max={5000} step="10" />
        <ValidatedNumberInput label="Coupling J (cm⁻¹)" value={jRaw} onChange={setJ} min={-2000} max={2000} step="10" />
        <ValidatedNumberInput label="Angle Between Dipoles φ (°)" value={phiRaw} onChange={setPhi} min={0} max={180} step="5" />
        <ValidatedNumberInput label="Inhomogeneous FWHM (cm⁻¹)" value={inhRaw} onChange={setInh} min={0} max={2000} step="10" />
        <ValidatedNumberInput label="Dephasing Time T₂ (fs)" value={t2Raw} onChange={setT2} min={1} max={100000} step="10" />
        <ValidatedNumberInput label="Waiting Time T_w (fs)" value={twRaw} onChange={setTw} min={0} max={1e6} step="50" />
        <ValidatedNumberInput label="Downhill Relaxation Time E₊ → E₋ (fs)" value={relaxRaw} onChange={setRelax} min={1} max={1e7} step="50" />
        <ValidatedNumberInput label="Temperature (K)" value={tempRaw} onChange={setTemp} min={0} max={2000} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Exciton Energies E₋ / E₊" value={`${fmt(Em / 100, 6)} / ${fmt(Ep / 100, 6)} cm⁻¹`} tone="blue"
          subtext={Em > 0 ? `${fmt(1e9 / Em, 5)} / ${fmt(1e9 / Ep, 5)} nm` : "E₋ ≤ 0: reduce Δ or J"} />
        <ResultCard label="Splitting √(Δ² + 4J²)" value={`${fmt(d.splitting / 100, 4)} cm⁻¹`} tone="purple"
          subtext={`mixing angle θ = ${fmt(d.theta / DEG, 3)}°`} />
        <ResultCard label="Dipole Strengths |μ₀₋|² / |μ₀₊|²" value={`${fmt(strength[0], 3)} / ${fmt(strength[1], 3)}`} tone="green"
          subtext="in monomer units; sum = 2" />
        <ResultCard label="Homogeneous FWHM 1/(πcT₂)" value={`${fmt(hom / 100, 4)} cm⁻¹`} tone="yellow"
          subtext={`after T_w: P(E₋ | excited E₊) = ${fmt(P[1][0], 3)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Dimer: sites ν₀ ∓ Δ/2 coupled by J form excitons E∓ = ν₀ ∓ ½√(Δ² + 4J²) with tan 2θ = 2J/Δ; the doubly excited state lies at 2ν₀ = E₋ + E₊.</p>
        <p>Absorptive spectrum S(ω₁, T_w, ω₃), the sum of rephasing and non-rephasing signals: ground-state bleach and stimulated emission (positive, red) at (Eₐ, E_b), excited-state absorption (negative, blue) at (Eₐ, 2ν₀ − E_b), weighted by the isotropic ⟨μμμμ⟩ for parallel pulse polarisations and by the population transfer P(b|a) during T_w.</p>
        <p>Lineshape: Lorentzian with FWHM 1/(πcT₂) across the diagonal, stretched along it by static inhomogeneous broadening. With J = 0 the cross peaks vanish: bleach and excited-state absorption cancel.</p>
        <p className="text-gray-400">Not included: inter-exciton coherences (quantum beats) during T_w, spectral diffusion, ground-state recovery, biexciton binding and vibronic structure. Uphill transfer follows detailed balance at the given temperature.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={map} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Absorptive 2D Electronic Spectrum", font: { color: "white" } },
          xaxis: { title: { text: "Excitation ω₁ (cm⁻¹)" }, gridcolor: "#374151" },
          yaxis: { title: { text: "Detection ω₃ (cm⁻¹)" }, gridcolor: "#374151", scaleanchor: "x" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, showlegend: false,
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={linear} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Linear Absorption Spectrum", font: { color: "white" } },
          xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Absorbance (norm.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </>
  );
}
