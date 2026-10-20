"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { waterAbsorption } from "../../../physics/materials/water-absorption";
import {
  dpfFrontalHead, hbExtinction, localMaxima, mbllHaemoglobin, morseMaxLevel, morseTransition, morseWellDepth,
} from "../../../physics/spectroscopy/near-infrared";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtLen = (m: number) =>
  !Number.isFinite(m) ? "—" : m >= 1 ? `${fmt(m, 3)} m` : m >= 1e-3 ? `${fmt(m * 1e3, 3)} mm` : `${fmt(m * 1e6, 3)} µm`;
/** 1 µM = 1e-3 mol/m³. */
const toMicroMolar = (c: number) => c * 1e3;

const layout = (title: string, xTitle: string, yTitle: string, extra: object = {}) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  title: { text: title, font: { size: 13 } },
  xaxis: { title: xTitle, gridcolor: "#374151" },
  yaxis: { title: yTitle, gridcolor: "#374151" },
  margin: { t: 40, r: 70, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
  ...extra,
});

export default function NearInfraredPage() {
  // water absorption
  const [startRaw, setWavelengthStart] = useURLState("wavelengthStart", 780);
  const [endRaw, setWavelengthEnd] = useURLState("wavelengthEnd", 2500);
  const [pathRaw, setPathMm] = useURLState("pathMm", 1);
  const [waterRaw, setWaterContent] = useURLState("waterContent", 0.8);
  // Morse overtones
  const [weRaw, setOmegaE] = useURLState("omegaE", 2990.946);
  const [wexeRaw, setOmegaExe] = useURLState("omegaExe", 52.8186);
  // modified Beer–Lambert law
  const [l1Raw, setLambda1] = useURLState("lambda1", 760);
  const [l2Raw, setLambda2] = useURLState("lambda2", 830);
  const [od1Raw, setDOD1] = useURLState("dOD1", 0.0023);
  const [od2Raw, setDOD2] = useURLState("dOD2", 0.0131);
  const [distRaw, setDistance] = useURLState("distance", 3); // cm
  const [dpfModeRaw, setDpfMode] = useURLState("dpfMode", "age");
  const [ageRaw, setAge] = useURLState("age", 30);
  const [dpf1Raw, setDpf1] = useURLState("dpf1", 6);
  const [dpf2Raw, setDpf2] = useURLState("dpf2", 6);

  const start = clamp(startRaw, 780, 2490, 780);
  const end = clamp(endRaw, start + 10, 2500, 2500);
  const path = clamp(pathRaw, 0.001, 1000, 1) * 1e-3;
  const water = clamp(waterRaw, 0, 1, 0.8);

  const nms = Array.from({ length: Math.round(end - start) + 1 }, (_, i) => start + i);
  const mua = nms.map((nm) => water * waterAbsorption(nm * 1e-9)); // 1/m
  const peaks = localMaxima(mua).map((i) => ({ nm: nms[i], mua: mua[i] }));
  const spectrum = [
    { x: nms, y: mua.map((a) => r6(a / 100)), type: "scatter", mode: "lines", name: "μ_a (cm⁻¹)", line: { color: "#60a5fa", width: 2 } },
    { x: nms, y: mua.map((a) => r6(100 * Math.exp(-a * path))), type: "scatter", mode: "lines", name: "Transmittance (%)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
  ];

  const we = clamp(weRaw, 10, 5000, 2990.946);
  const wexe = clamp(wexeRaw, 0.01, we / 4, 52.8186);
  const vMax = morseMaxLevel(we, wexe);
  const bands = [1, 2, 3, 4, 5].filter((v) => v <= vMax).map((v) => ({ v, nu: morseTransition(we, wexe, v) }));

  const l1 = clamp(l1Raw, 650, 1000, 760);
  const l2 = clamp(l2Raw, 650, 1000, 830);
  const dOD1 = clamp(od1Raw, -10, 10, 0.0023);
  const dOD2 = clamp(od2Raw, -10, 10, 0.0131);
  const dCm = clamp(distRaw, 0.1, 20, 3);
  const dpfMode = dpfModeRaw === "manual" ? "manual" : "age";
  const age = clamp(ageRaw, 0, 70, 30);
  const dpf1 = dpfMode === "age" ? dpfFrontalHead(age, l1 * 1e-9) : clamp(dpf1Raw, 1, 50, 6);
  const dpf2 = dpfMode === "age" ? dpfFrontalHead(age, l2 * 1e-9) : clamp(dpf2Raw, 1, 50, 6);
  const dc = mbllHaemoglobin(l1 * 1e-9, l2 * 1e-9, dOD1, dOD2, dCm / 100, dpf1, dpf2);
  const outOfDpfRange = dpfMode === "age" && !(Number.isFinite(dpf1) && Number.isFinite(dpf2));

  const hbNm = Array.from({ length: 176 }, (_, i) => 650 + 2 * i);
  const hbSpectra = [
    { x: hbNm, y: hbNm.map((nm) => r6(hbExtinction(nm * 1e-9).hbo2 * 10)), type: "scatter", mode: "lines", name: "HbO₂", line: { color: "#f87171", width: 2 } },
    { x: hbNm, y: hbNm.map((nm) => r6(hbExtinction(nm * 1e-9).hbr * 10)), type: "scatter", mode: "lines", name: "HbR", line: { color: "#818cf8", width: 2 } },
    { x: [l1, l1], y: [0, 4000], type: "scatter", mode: "lines", name: `λ₁ = ${l1} nm`, line: { color: "#fbbf24", width: 1, dash: "dash" } },
    { x: [l2, l2], y: [0, 4000], type: "scatter", mode: "lines", name: `λ₂ = ${l2} nm`, line: { color: "#34d399", width: 1, dash: "dash" } },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Water absorption, 780–2500 nm</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Wavelength Start (nm)" value={startRaw} onChange={setWavelengthStart} min={780} max={2490} step="10" />
        <ValidatedNumberInput label="Wavelength End (nm)" value={endRaw} onChange={setWavelengthEnd} min={790} max={2500} step="10" />
        <ValidatedNumberInput label="Path Length (mm)" value={pathRaw} onChange={setPathMm} min={0.001} max={1000} />
        <ValidatedNumberInput label="Water Volume Fraction" value={waterRaw} onChange={setWaterContent} min={0} max={1} step="0.05" />
      </div>
      <ChartPanel data={spectrum} layout={layout("Absorption and Transmittance (no scattering)", "Wavelength (nm)", "μ_a (cm⁻¹)", {
        yaxis: { title: "μ_a (cm⁻¹)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "Transmittance (%)", overlaying: "y", side: "right", range: [0, 100] },
      })} />
      <div className="mt-4 mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        {peaks.map((p) => (
          <div key={p.nm} className="rounded bg-gray-900 border border-gray-800 p-2">
            <span className="text-blue-400">{p.nm} nm</span>: μ_a {fmt(p.mua / 100, 3)} cm⁻¹, depth 1/μ_a {fmtLen(1 / p.mua)}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mb-10">
        Pure water (Segelstein 1981 compilation) scaled by the volume fraction, T = exp(−μ_a L). The peaks are the O–H
        combination and overtone bands of liquid water: about 970 nm (2ν₁ + ν₃), 1200 nm (ν₁ + ν₂ + ν₃), 1450 nm
        (ν₁ + ν₃) and 1940 nm (ν₂ + ν₃), found here as maxima of the data. Scattering is not included: in tissue it
        lengthens the path, which the modified Beer–Lambert law below accounts for.
      </p>

      <h2 className="text-lg font-semibold mb-3">Overtone positions, Morse oscillator</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Harmonic Wavenumber ω_e (cm⁻¹)" value={weRaw} onChange={setOmegaE} min={10} max={5000} />
        <ValidatedNumberInput label="Anharmonicity ω_e x_e (cm⁻¹)" value={wexeRaw} onChange={setOmegaExe} min={0.01} max={we / 4} />
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 text-left"><th className="p-2">Band</th><th className="p-2">ν̃ (cm⁻¹)</th><th className="p-2">λ (nm)</th><th className="p-2">ν̃ / ν̃(0→1)</th></tr></thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.v} className="border-t border-gray-800">
                <td className="p-2">0 → {b.v}{b.v === 1 ? " (fundamental)" : ` (${b.v - 1}${b.v === 2 ? "st" : b.v === 3 ? "nd" : b.v === 4 ? "rd" : "th"} overtone)`}</td>
                <td className="p-2">{fmt(b.nu, 6)}</td>
                <td className="p-2">{fmt(1e7 / b.nu, 5)}</td>
                <td className="p-2">{fmt(b.nu / bands[0].nu, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-400 mb-10">
        ν̃(0→v) = v ω_e − ω_e x_e v(v + 1). Highest bound level v_max = {fmt(vMax, 3)}, Morse well depth
        D_e = ω_e²/(4ω_e x_e) = {fmt(morseWellDepth(we, wexe), 5)} cm⁻¹. Defaults: H³⁵Cl (ω_e 2990.946, ω_e x_e
        52.8186 cm⁻¹); observed bands 2886, 5668, 8347, 10 923 cm⁻¹. Overtones fall short of v times the fundamental,
        which is why the C–H, O–H and N–H overtones land in the NIR. Overtone intensities need the dipole function and
        are not computed.
      </p>

      <h2 className="text-lg font-semibold mb-3">Haemoglobin changes, modified Beer–Lambert law</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="λ₁ (nm, 650–1000)" value={l1Raw} onChange={setLambda1} min={650} max={1000} step="2" />
        <ValidatedNumberInput label="λ₂ (nm, 650–1000)" value={l2Raw} onChange={setLambda2} min={650} max={1000} step="2" />
        <ValidatedNumberInput label="ΔOD at λ₁" value={od1Raw} onChange={setDOD1} min={-10} max={10} step="0.0001" />
        <ValidatedNumberInput label="ΔOD at λ₂" value={od2Raw} onChange={setDOD2} min={-10} max={10} step="0.0001" />
        <ValidatedNumberInput label="Source–Detector Distance (cm)" value={distRaw} onChange={setDistance} min={0.1} max={20} step="0.1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">DPF</span>
          <select value={dpfMode} onChange={(e) => setDpfMode(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="age">Adult head from age (Scholkmann–Wolf)</option>
            <option value="manual">Enter DPF values</option>
          </select>
        </label>
        {dpfMode === "age"
          ? <ValidatedNumberInput label="Age (years, 0–70)" value={ageRaw} onChange={setAge} min={0} max={70} />
          : <>
            <ValidatedNumberInput label="DPF at λ₁" value={dpf1Raw} onChange={setDpf1} min={1} max={50} step="0.1" />
            <ValidatedNumberInput label="DPF at λ₂" value={dpf2Raw} onChange={setDpf2} min={1} max={50} step="0.1" />
          </>}
      </div>
      {outOfDpfRange && <p className="mb-4 text-sm text-yellow-400">The Scholkmann–Wolf equation is fitted for 690–832 nm: pick wavelengths in that range or enter DPF values.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Δ[HbO₂]" value={`${fmt(toMicroMolar(dc.hbo2))} µM`} tone="red" subtext="oxyhaemoglobin" />
        <ResultCard label="Δ[HbR]" value={`${fmt(toMicroMolar(dc.hbr))} µM`} tone="blue" subtext="deoxyhaemoglobin" />
        <ResultCard label="Δ[HbT]" value={`${fmt(toMicroMolar(dc.hbo2 + dc.hbr))} µM`} tone="purple" subtext="total, Δ[HbO₂] + Δ[HbR]" />
        <ResultCard label="DPF λ₁ / λ₂" value={`${fmt(dpf1, 3)} / ${fmt(dpf2, 3)}`} tone="yellow" subtext={`mean path d·DPF = ${fmt(dCm * dpf1, 3)} / ${fmt(dCm * dpf2, 3)} cm`} />
      </div>
      <p className="text-sm text-gray-400 mb-6">
        ΔOD(λ) = [ε_HbO₂(λ) Δ[HbO₂] + ε_HbR(λ) Δ[HbR]] · d · DPF(λ), solved at the two wavelengths. ε are decadic
        molar extinction coefficients (Prahl&apos;s compilation); DPF(λ, A) = 223.3 + 0.05624 A^0.8493 − 5.723·10⁻⁷ λ³
        + 0.001245 λ² − 0.9025 λ. The result averages over the sampled tissue and assumes the change is homogeneous;
        wavelengths on either side of the 800 nm isosbestic point give the best-conditioned system.
      </p>
      <ChartPanel data={hbSpectra} layout={layout("Haemoglobin Molar Extinction", "Wavelength (nm)", "ε (cm⁻¹/M)")} />
    </>
  );
}
