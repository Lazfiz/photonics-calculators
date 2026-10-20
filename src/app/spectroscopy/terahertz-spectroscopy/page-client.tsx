"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, k_B, q } from "../../../physics/constants";
import {
  absorptionCoefficient, complexIndex, constantPermittivity, extractIndex, lorentzPermittivity, maxAbsorption,
  slabTransmissionPolar, waterPermittivity,
} from "../../../physics/spectroscopy/terahertz";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const THz = 1e12;

export default function TerahertzSpectroscopyPage() {
  const [model, setModel] = useURLState("model", "water");
  const [fStartRaw, setFStart] = useURLState("freqStart", 0.1);
  const [fEndRaw, setFEnd] = useURLState("freqEnd", 2);
  const [fProbeRaw, setFProbe] = useURLState("freq", 1);
  const [dRaw, setD] = useURLState("thicknessMm", 0.1);
  const [tRaw, setT] = useURLState("temperature", 293.15);
  const [drRaw, setDR] = useURLState("dynamicRangeDb", 60);
  const [nRaw, setN] = useURLState("refractiveIndex", 1.5);
  const [aRaw, setA] = useURLState("absorptionCoeff", 5);
  const [eiRaw, setEi] = useURLState("epsInf", 3);
  const [deRaw, setDe] = useURLState("deltaEps", 0.1);
  const [f0Raw, setF0] = useURLState("f0", 1.2);
  const [gRaw, setG] = useURLState("gamma", 0.05);

  const m = model === "lorentz" || model === "constant" ? model : "water";
  const fStart = clamp(fStartRaw, 0.01, 20, 0.1);
  const fEnd = Math.max(clamp(fEndRaw, 0.02, 20, 2), fStart + 0.01);
  const fProbe = clamp(fProbeRaw, fStart, fEnd, (fStart + fEnd) / 2);
  const d = clamp(dRaw, 0.001, 50, 0.1) * 1e-3;
  const T = clamp(tRaw, m === "water" ? 268.15 : 1, m === "water" ? 313.15 : 3000, 293.15);
  const drDb = clamp(drRaw, 0, 200, 60);
  const DR = 10 ** (drDb / 20); // field amplitude ratio
  const n0 = clamp(nRaw, 1, 10, 1.5), a0 = clamp(aRaw, 0, 1e5, 5) * 100;
  const ei = clamp(eiRaw, 1, 100, 3), de = clamp(deRaw, 0, 100, 0.1), f0 = clamp(f0Raw, 0.01, 20, 1.2) * THz, g = clamp(gRaw, 0.001, 10, 0.05) * THz;

  const eps = (f: number) => (m === "water" ? waterPermittivity(f, T) : m === "lorentz" ? lorentzPermittivity(f, ei, de, f0, g) : constantPermittivity(f, n0, a0));
  const point = (f: number) => {
    const nk = complexIndex(eps(f));
    const alpha = absorptionCoefficient(nk, f);
    const t = slabTransmissionPolar(nk, f, d);
    return { nk, alpha, t, aMax: maxAbsorption(DR, nk.re, d) };
  };

  const N = 400;
  const fs = Array.from({ length: N }, (_, i) => (fStart + ((fEnd - fStart) * i) / (N - 1)) * THz);
  const pts = fs.map(point);
  const fx = fs.map((f) => r6(f / THz));
  const optical = [
    { x: fx, y: pts.map((p) => r6(p.nk.re)), type: "scatter", mode: "lines", name: "n", line: { color: "#60a5fa", width: 2 } },
    { x: fx, y: pts.map((p) => r6(p.alpha / 100)), type: "scatter", mode: "lines", name: "α (cm⁻¹)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    { x: fx, y: pts.map((p) => r6(p.aMax / 100)), type: "scatter", mode: "lines", name: "α_max (dynamic range)", line: { color: "#fbbf24", width: 1.5, dash: "dash" }, yaxis: "y2" },
  ];
  const transmission = [
    { x: fx, y: pts.map((p) => r6(100 * p.t.magnitude ** 2)), type: "scatter", mode: "lines", name: "|T|² (%)", line: { color: "#34d399", width: 2 } },
  ];

  const p = point(fProbe * THz);
  const fit = extractIndex(p.t.magnitude, p.t.phase, fProbe * THz, d);
  const beyond = p.alpha > p.aMax;
  const unmeasurable = pts.filter((x) => x.alpha > x.aMax).length;
  const delay = ((p.nk.re - 1) * d) / c;
  const kT_THz = (k_B * T) / h / THz;
  const photon_meV = ((h * fProbe * THz) / q) * 1e3;
  const extrapolated = m === "water" && fEnd > 1;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sample</span>
          <select value={m} onChange={(e) => setModel(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="water">Liquid water (double Debye)</option>
            <option value="lorentz">Solid with one phonon mode (Lorentz)</option>
            <option value="constant">Constant n and α</option>
          </select>
        </label>
        <ValidatedNumberInput label="Thickness d (mm)" value={dRaw} onChange={setD} min={0.001} max={50} step="0.01" />
        <ValidatedNumberInput label="Field Dynamic Range (dB)" value={drRaw} onChange={setDR} min={0} max={200} />
        {m === "water"
          ? <ValidatedNumberInput label="Temperature (K, 268–313)" value={tRaw} onChange={setT} min={268.15} max={313.15} step="1" />
          : <ValidatedNumberInput label="Temperature (K), for kT" value={tRaw} onChange={setT} min={1} max={3000} step="1" />}
        <ValidatedNumberInput label="Frequency Start (THz)" value={fStartRaw} onChange={setFStart} min={0.01} max={20} step="0.1" />
        <ValidatedNumberInput label="Frequency End (THz)" value={fEndRaw} onChange={setFEnd} min={0.02} max={20} step="0.1" />
        <ValidatedNumberInput label="Read-out Frequency (THz)" value={fProbeRaw} onChange={setFProbe} min={0.01} max={20} step="0.05" />
        {m === "lorentz" && <>
          <ValidatedNumberInput label="ε∞ (background)" value={eiRaw} onChange={setEi} min={1} max={100} step="0.1" />
          <ValidatedNumberInput label="Oscillator Strength Δε" value={deRaw} onChange={setDe} min={0} max={100} step="0.01" />
          <ValidatedNumberInput label="Mode Frequency f₀ (THz)" value={f0Raw} onChange={setF0} min={0.01} max={20} step="0.01" />
          <ValidatedNumberInput label="Damping γ (THz, FWHM of ε″)" value={gRaw} onChange={setG} min={0.001} max={10} step="0.01" />
        </>}
        {m === "constant" && <>
          <ValidatedNumberInput label="Refractive Index n" value={nRaw} onChange={setN} min={1} max={10} step="0.01" />
          <ValidatedNumberInput label="Absorption Coefficient α (cm⁻¹)" value={aRaw} onChange={setA} min={0} max={1e5} step="1" />
        </>}
      </div>
      {extrapolated && <p className="mb-4 text-sm text-yellow-400">The water model is fitted below 1 THz; above about 2 THz the intermolecular modes (5.3 THz) take over, so values there are extrapolated.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label={`n + iκ at ${fmt(fProbe, 3)} THz`} value={`${fmt(p.nk.re, 4)} + ${fmt(p.nk.im, 3)}i`} tone="blue" subtext={`ε = ñ²; time delay (n − 1)d/c = ${fmt(delay * 1e12, 4)} ps`} />
        <ResultCard label="Absorption Coefficient α" value={`${fmt(p.alpha / 100, 4)} cm⁻¹`} tone={beyond ? "red" : "orange"}
          subtext={beyond ? `above α_max = ${fmt(p.aMax / 100, 4)} cm⁻¹: lost in the noise, use a thinner sample` : `α_max = ${fmt(p.aMax / 100, 4)} cm⁻¹ at ${drDb} dB`} />
        <ResultCard label="Power Transmission |T|²" value={`${fmt(100 * p.t.magnitude ** 2, 4)} %`} tone="green"
          subtext={`Fresnel loss ${fmt(100 * (1 - (16 * (p.nk.re ** 2 + p.nk.im ** 2)) / ((p.nk.re + 1) ** 2 + p.nk.im ** 2) ** 2), 3)} % at two faces, e^(−αd) = ${fmt(Math.exp(-p.alpha * d), 4)}`} />
        <ResultCard label="Extracted from T (real Fresnel)" value={`n ${fmt(fit.n, 5)}, α ${fmt(fit.alpha / 100, 4)} cm⁻¹`} tone="purple"
          subtext={`error ${fmt(fit.n - p.nk.re, 2)} in n, ${fmt((100 * (fit.alpha - p.alpha)) / p.alpha, 2)} % in α`} />
        <ResultCard label="Photon at Read-out" value={`${fmt((fProbe * THz) / c / 100, 4)} cm⁻¹`} tone="cyan"
          subtext={`${fmt(photon_meV, 4)} meV, λ = ${fmt((c / (fProbe * THz)) * 1e6, 4)} µm`} />
        <ResultCard label="Thermal Energy kT" value={`${fmt(kT_THz, 4)} THz`} tone="gray" subtext={`${fmt((k_B * T) / (h * c) / 100, 4)} cm⁻¹ at ${fmt(T, 5)} K`} />
        <ResultCard label="Unmeasurable Points" value={`${unmeasurable} of ${N}`} tone={unmeasurable ? "red" : "gray"} subtext="where α exceeds the dynamic-range limit" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">T(ω) = [4ñ/(ñ+1)²] e^(i(ñ−1)ωd/c),  n = 1 + cφ/(ωd),  α = −(2/d) ln[|T|(n+1)²/(4n)],  α_max = (2/d) ln[DR·4n/(n+1)²]</p>
        <p>The sample is a free-standing slab at normal incidence, measured against the empty path with the Fabry–Pérot echoes cut out of the time
          window. The extraction treats the Fresnel factor as real, which is accurate when κ ≪ n; for strong absorbers such as water its error is
          shown above. α_max is the Jepsen–Fischer limit for a field dynamic range DR (taken flat here; a real spectrometer&apos;s falls with frequency).</p>
        <p className="text-gray-400">Water: Liebe, Hufford &amp; Manabe (1991) double Debye model, τ₁ = 1/(2πγ₁) ≈ 8.2 ps at 25 °C. A liquid sits in a cell,
          whose windows add their own reflections. Lorentz: ε = ε∞ + Δε f₀²/(f₀² − f² − iγf), a user-defined mode.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={optical} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: "Refractive Index and Absorption", font: { color: "white" } },
            xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
            yaxis: { title: "n", gridcolor: "#374151" },
            yaxis2: { title: "α (cm⁻¹)", overlaying: "y", side: "right" },
            margin: { t: 40, r: 70, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={transmission} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: `Power Transmission, d = ${fmt(d * 1e3, 3)} mm`, font: { color: "white" } },
            xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
            yaxis: { title: "|T|² (%)", gridcolor: "#374151" },
            margin: { t: 40, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>
    </>
  );
}
