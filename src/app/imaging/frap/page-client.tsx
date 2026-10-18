"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  axelrodPostBleach, axelrodRecovery, frapDiffusionCoefficient, frapHalfTimeRatio, soumpasisRecovery,
} from "../../../physics/imaging/fluorescence-dynamics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function FRAPPage() {
  const [modelRaw, setModel] = useURLState("model", "disk");
  const [wRaw, setW] = useURLState("w0", 1.0); // µm, disk radius or 1/e² beam radius
  const [tHalfRaw, setTHalf] = useURLState("tauHalf", 2.0); // s
  const [mobileRaw, setMobile] = useURLState("mobileFrac", 0.7);
  const [f0Raw, setF0] = useURLState("postBleach", 0.3); // disk: F(0)/F_i
  const [kRaw, setK] = useURLState("bleachK", 1); // Gaussian: bleach depth K
  const model = modelRaw === "gaussian" ? "gaussian" : "disk";
  const w = clamp(wRaw, 0.1, 50, 1);
  const tHalf = clamp(tHalfRaw, 0.001, 10000, 2);
  const mobile = clamp(mobileRaw, 0, 1, 0.7);
  const K = clamp(kRaw, 0.01, 20, 1);
  const F0 = model === "gaussian" ? axelrodPostBleach(K) : clamp(f0Raw, 0, 0.99, 0.3);

  const gamma = frapHalfTimeRatio(model, K);
  const tauD = tHalf / gamma;
  const D = frapDiffusionCoefficient(w * 1e-6, tHalf, gamma);
  const Finf = F0 + mobile * (1 - F0);
  const recovery = (t: number) => (model === "gaussian" ? axelrodRecovery(t / tauD, K) : soumpasisRecovery(t / tauD));

  const tMax = 10 * tHalf;
  const ts = Array.from({ length: 201 }, (_, i) => (i * tMax) / 200);
  const flat = (y: number) => ts.map(() => y);
  const chart = [
    { x: ts, y: ts.map((t) => F0 + mobile * (1 - F0) * recovery(t)), type: "scatter" as const, mode: "lines" as const, name: "F(t)/F_i", line: { color: "#60a5fa" } },
    { x: ts, y: flat(Finf), type: "scatter" as const, mode: "lines" as const, name: "Plateau F(∞)", line: { color: "#4ade80", dash: "dash" } },
    { x: ts, y: flat(1), type: "scatter" as const, mode: "lines" as const, name: "Pre-bleach F_i", line: { color: "#f87171", dash: "dot" } },
    { x: [tHalf, tHalf], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "τ½", line: { color: "#facc15", dash: "dash" } },
  ];

  const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bleach profile</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="disk">Uniform disk (Soumpasis 1983)</option>
              <option value="gaussian">Gaussian beam (Axelrod 1976)</option>
            </select>
          </div>
          <ValidatedNumberInput label={model === "disk" ? "Bleach disk radius w (µm)" : "Beam 1/e² radius w (µm)"} value={wRaw} onChange={setW} min={0.1} max={50} step="0.1" />
          <ValidatedNumberInput label="Half-recovery time τ½ (s)" value={tHalfRaw} onChange={setTHalf} min={0.001} max={10000} step="0.1" />
          <ValidatedNumberInput label="Mobile fraction" value={mobileRaw} onChange={setMobile} min={0} max={1} step="0.05" />
          {model === "disk" ? (
            <ValidatedNumberInput label="Post-bleach intensity F(0)/F_i" value={f0Raw} onChange={setF0} min={0} max={0.99} step="0.05" />
          ) : (
            <ValidatedNumberInput label="Bleach depth K" value={kRaw} onChange={setK} min={0.01} max={20} step="0.1" />
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Diffusion coefficient D", Number.isFinite(D) ? `${(D * 1e12).toPrecision(4)} µm²/s` : "—", "text-green-400")}
          {row("γ = τ½/τ_D", fmt(gamma, 4), "text-yellow-400")}
          {row("Diffusion time τ_D = w²/(4D)", fmt(tauD, 3, " s"))}
          {row("Post-bleach F(0)/F_i", fmt(F0, 3), "text-blue-400")}
          {row("Plateau F(∞)/F_i", fmt(Finf, 3), "text-blue-400")}
          {row("Immobile fraction", fmt((1 - mobile) * 100, 1, " %"), "text-red-400")}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Recovery curve</h2>
        <ChartPanel
          data={chart}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
            xaxis: { title: "Time after the bleach (s)", gridcolor: "#333" }, yaxis: { title: "F(t)/F_i", gridcolor: "#333", range: [0, 1.05] }, showlegend: true,
          }}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>F(t) = F(0) + M (F_i − F(0)) f(t), τ_D = w²/(4D), D = γ w²/(4τ½)</p>
          <p>Disk: f(t) = e^(−2τ_D/t) [I₀(2τ_D/t) + I₁(2τ_D/t)], γ = 0.8946</p>
          <p>Gaussian: F(t)/F_i = Σ (−K)ⁿ/n! / (1 + n(1 + 2t/τ_D)), F(0)/F_i = (1 − e^(−K))/K</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Free 2D diffusion after an instantaneous bleach, with an immobile fraction 1 − M that stays bleached. The
          fluorescence is collected over the bleached disk (Soumpasis) or through the same Gaussian beam (Axelrod). Soumpasis
          (1983) solved the uniformly bleached disk exactly (his D = 0.224 w²/τ½); Axelrod et al. (1976) the Gaussian beam,
          where γ grows with the bleach depth K. Bleaching during the bleach pulse, flow, binding reactions and loss of
          fluorescence during the recovery imaging are not included; the bleached area must be small next to the cell.
        </p>
      </div>
    </>
  );
}
