"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  bendBirefringence, loopDiameterFor, loopRetardance, paddleStates,
} from "../../../physics/fiber-optics/fiber-birefringence";
import { ellipseAngles, handedness, stokesFromEllipse } from "../../../physics/polarization/stokes";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
// Text for a result, or a dash when the model has no finite value.
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const DEG = Math.PI / 180;

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function PolarizationControllerCalculator() {
  const [lambdaRaw, setLambda] = useURLState("wavelength", 1550); // nm
  const [dRaw, setD] = useURLState("claddingDiameter", 125); // µm
  const [DRaw, setDLoop] = useURLState("loopDiameter", 30); // mm
  const [n1Raw, setN1] = useURLState("loops1", 2, { min: 0, max: 20 });
  const [n2Raw, setN2] = useURLState("loops2", 4, { min: 0, max: 20 });
  const [n3Raw, setN3] = useURLState("loops3", 2, { min: 0, max: 20 });
  const [a1Raw, setA1] = useURLState("angle1", 0, { min: -180, max: 180 }); // °
  const [a2Raw, setA2] = useURLState("angle2", 45, { min: -180, max: 180 });
  const [a3Raw, setA3] = useURLState("angle3", 0, { min: -180, max: 180 });
  const [psiRaw, setPsi] = useURLState("inputAzimuth", 45); // °
  const [chiRaw, setChi] = useURLState("inputEllipticity", 0); // °

  const lambda = clamp(lambdaRaw, 400, 2000) * 1e-9;
  const d = clamp(dRaw, 50, 400) * 1e-6;
  const D = clamp(DRaw, 5, 300) * 1e-3;
  const loops = [n1Raw, n2Raw, n3Raw].map((n) => Math.round(clamp(n, 0, 20)));
  const angles = [a1Raw, a2Raw, a3Raw].map((a) => clamp(a, -180, 180));
  const psi = clamp(psiRaw, -90, 90);
  const chi = clamp(chiRaw, -45, 45);
  const [L1, L2, L3] = loops;
  const [A1, A2, A3] = angles;

  const calc = useMemo(() => {
    const perLoop = loopRetardance(d, D, lambda);
    const paddles = [L1, L2, L3].map((N, i) => ({ retardance: N * perLoop, fastAxis: [A1, A2, A3][i] * DEG }));
    const states = paddleStates(stokesFromEllipse(1, psi * DEG, chi * DEG), paddles);
    const out = states[3];
    return {
      perLoop,
      Bbend: bendBirefringence(d, D / 2),
      paddles,
      states,
      out,
      ell: ellipseAngles(out),
      hand: handedness(out),
      dQuarter: loopDiameterFor(Math.PI / 2, d, lambda, Math.max(L1, 1)),
      dHalf: loopDiameterFor(Math.PI, d, lambda, Math.max(L2, 1)),
    };
  }, [d, D, lambda, L1, L2, L3, A1, A2, A3, psi, chi]);

  const ellipse = useMemo(() => {
    const { psi: az, chi: el } = calc.ell;
    const a = Math.cos(el), b = Math.sin(el), ca = Math.cos(Number.isFinite(az) ? az : 0), sa = Math.sin(Number.isFinite(az) ? az : 0);
    const ex: number[] = [], ey: number[] = [];
    if (Number.isFinite(el)) {
      for (let i = 0; i <= 120; i++) {
        const t = (2 * Math.PI * i) / 120;
        ex.push(a * Math.cos(t) * ca - b * Math.sin(t) * sa);
        ey.push(a * Math.cos(t) * sa + b * Math.sin(t) * ca);
      }
    }
    return { ex, ey };
  }, [calc.ell]);

  const waves = (g: number) => g / (2 * Math.PI);
  const steps = [0, 1, 2, 3];
  const component = (k: 1 | 2 | 3) => calc.states.map((S) => (Number.isFinite(S[k]) ? S[k] : null));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={400} max={2000} step="any" />
        <ValidatedNumberInput label="Cladding Diameter (µm)" value={dRaw} onChange={setD} min={50} max={400} step="any" />
        <ValidatedNumberInput label="Loop Diameter D (mm)" value={DRaw} onChange={setDLoop} min={5} max={300} step="any" />
        <ValidatedNumberInput label="Paddle 1 Loops" value={n1Raw} onChange={setN1} min={0} max={20} step="1" />
        <ValidatedNumberInput label="Paddle 2 Loops" value={n2Raw} onChange={setN2} min={0} max={20} step="1" />
        <ValidatedNumberInput label="Paddle 3 Loops" value={n3Raw} onChange={setN3} min={0} max={20} step="1" />
        <ValidatedNumberInput label="Paddle 1 Angle (°)" value={a1Raw} onChange={setA1} min={-180} max={180} step="any" />
        <ValidatedNumberInput label="Paddle 2 Angle (°)" value={a2Raw} onChange={setA2} min={-180} max={180} step="any" />
        <ValidatedNumberInput label="Paddle 3 Angle (°)" value={a3Raw} onChange={setA3} min={-180} max={180} step="any" />
        <ValidatedNumberInput label="Input Azimuth ψ (°)" value={psiRaw} onChange={setPsi} min={-90} max={90} step="any" />
        <ValidatedNumberInput label="Input Ellipticity χ (°)" value={chiRaw} onChange={setChi} min={-45} max={45} step="any" />
      </div>
      <p className="text-xs text-gray-400 mb-8">
        Paddle angle: the tilt of the loop plane from the x axis. The bend&apos;s fast axis lies in the loop plane.
        χ &gt; 0 is right-handed (S₃ &gt; 0), as on the site&apos;s Stokes and Mueller calculators.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card label="Retardance per Loop" value={show(calc.perLoop, () => `${calc.perLoop.toFixed(4)} rad`)}
          sub={show(calc.Bbend, () => `${waves(calc.perLoop).toFixed(4)} waves; bend B = ${calc.Bbend.toExponential(3)}`)} tone="text-blue-400" />
        <Card label="Paddle Retardances" value={calc.paddles.map((p) => show(p.retardance, () => waves(p.retardance).toFixed(3))).join(" / ")}
          sub={`waves for ${L1} / ${L2} / ${L3} loops (λ/4 = 0.25, λ/2 = 0.5)`} tone="text-gray-200" />
        <Card label="Loop Diameter for λ/4 and λ/2" value={show(calc.dQuarter, () => `${(calc.dQuarter * 1e3).toFixed(1)} / ${(calc.dHalf * 1e3).toFixed(1)} mm`)}
          sub={`λ/4 with ${Math.max(L1, 1)} loops, λ/2 with ${Math.max(L2, 1)} loops`} tone="text-yellow-400" />
        <Card label="Output Azimuth ψ" value={show(calc.ell.psi, () => `${(calc.ell.psi / DEG).toFixed(2)}°`)}
          sub={Number.isFinite(calc.ell.psi) ? "major axis from x" : "circular: no major axis"} tone="text-green-400" />
        <Card label="Output Ellipticity χ" value={show(calc.ell.chi, () => `${(calc.ell.chi / DEG).toFixed(2)}°`)}
          sub={`${calc.hand}; axis ratio ${show(calc.ell.chi, () => Math.abs(Math.tan(calc.ell.chi)).toFixed(3))}`} tone="text-green-400" />
        <Card label="Output Stokes (S₁, S₂, S₃)" value={calc.out.slice(1).map((v) => show(v, () => v.toFixed(3))).join(", ")}
          sub="normalized, S₀ = 1" tone="text-gray-200" />
      </div>

      {d / D > 0.01 && (
        <p role="alert" className="mb-8 rounded-lg border border-red-700 bg-red-950 p-3 text-sm text-red-200">
          Bend strain d/D = {((d / D) * 100).toFixed(1)} % exceeds the ≈ 1 % proof-test strain of standard fibre: the
          fibre may break. Use loops of at least {(d * 100 * 1e3).toFixed(1)} mm.
        </p>
      )}
      {D < 0.03 && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          Below ≈ 30 mm loop diameter the bend loss of standard single-mode fibre at 1550 nm rises steeply and depends
          strongly on its NA (from ≈ 0.01 to ≈ 0.5 dB per turn at 20 mm). Check it with the macro-bending loss calculator
          or the datasheet.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>B_bend = 0.133 (d/D)² (Ulrich et al. 1980)</p>
          <p>Γ = 2π² · 0.133 · N d²/(λD) per paddle (Lefèvre 1980)</p>
          <p>S_out = M(Γ₃, θ₃) M(Γ₂, θ₂) M(Γ₁, θ₁) S_in (linear retarders)</p>
          <p>D(λ/4) = 4π · 0.133 · N d²/λ, D(λ/2) = 2π · 0.133 · N d²/λ</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Each paddle is a linear retarder whose fast axis turns with the paddle. The coefficient 0.133 is for silica
          (photoelastic constants, Poisson ratio) and depends little on wavelength. Ignored: the twist of the fibre
          between paddles (a small circular retardance), fibre tension, the fibre&apos;s own birefringence, and
          bend loss.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ChartPanel data={[
            { x: steps, y: component(1), type: "scatter", mode: "lines+markers", name: "S₁", line: { color: "#ef4444", width: 2 } },
            { x: steps, y: component(2), type: "scatter", mode: "lines+markers", name: "S₂", line: { color: "#10b981", width: 2 } },
            { x: steps, y: component(3), type: "scatter", mode: "lines+markers", name: "S₃", line: { color: "#3b82f6", width: 2 } },
          ]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "After Paddle (0 = input)", gridcolor: "#374151", dtick: 1 },
            yaxis: { title: "Normalized Stokes", gridcolor: "#374151", range: [-1.1, 1.1] },
            legend: { x: 0.01, y: 0.99 },
            margin: { t: 30 },
          }} />
          <p className="text-xs text-gray-400 mt-2">Chart: S₁, S₂ and S₃ after each paddle.</p>
        </div>
        <div>
          <ChartPanel data={[
            { x: ellipse.ex, y: ellipse.ey, type: "scatter", mode: "lines", name: "Output", line: { color: "#f59e0b", width: 2.5 } },
          ]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Ex", gridcolor: "#374151", range: [-1.2, 1.2], scaleanchor: "y" },
            yaxis: { title: "Ey", gridcolor: "#374151", range: [-1.2, 1.2] },
            showlegend: false,
            margin: { t: 30 },
          }} />
          <p className="text-xs text-gray-400 mt-2">Chart: output polarization ellipse (field, normalized).</p>
        </div>
      </div>
    </>
  );
}
