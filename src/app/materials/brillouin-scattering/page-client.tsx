"use client";

import Link from "next/link";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { brillouinShift, stokesWavelength } from "../../../physics/fiber-optics/fiber-nonlinear";
import {
  BRILLOUIN_MEDIA, FUSED_SILICA_BRILLOUIN, acousticWavelength, brillouinGain, phononLifetime, type BrillouinMediumId,
} from "../../../physics/materials/brillouin";

const CHOICES = [...(Object.keys(BRILLOUIN_MEDIA) as BrillouinMediumId[]), "custom"] as const;
type Choice = BrillouinMediumId | "custom";
const DEFAULT_ID: Choice = "fused-silica";
const WAVELENGTH_MIN_NM = 200;
const WAVELENGTH_MAX_NM = 5000;
const LINEWIDTH_MIN_MHZ = 0.1;
const LINEWIDTH_MAX_MHZ = 1000;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const exp = (x: number, digits: number) => (Number.isFinite(x) ? x.toExponential(digits) : "—");

/** ν_B over 400–2000 nm for the chosen medium, GHz (rounded for the chart axis). */
function shiftCurve(n: number, vA: number) {
  const x = Array.from({ length: 161 }, (_, i) => 400 + i * 10);
  return { x, y: x.map((l) => +(brillouinShift(l * 1e-9, vA, n) / 1e9).toFixed(6)) };
}

export default function BrillouinScatteringPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [linewidthRaw, setLinewidth] = useURLState("linewidth", 20); // MHz, Δν_B at the pump wavelength
  const [nRaw, setN] = useURLState("n", FUSED_SILICA_BRILLOUIN.n);
  const [vARaw, setVA] = useURLState("vA", FUSED_SILICA_BRILLOUIN.vA); // m/s
  const [rhoRaw, setRho] = useURLState("rho", FUSED_SILICA_BRILLOUIN.rho); // kg/m³
  const [p12Raw, setP12] = useURLState("p12", FUSED_SILICA_BRILLOUIN.p12);
  const choice: Choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1550);
  const linewidth_MHz = clamp(linewidthRaw, LINEWIDTH_MIN_MHZ, LINEWIDTH_MAX_MHZ, 20);
  const medium = choice === "custom"
    ? {
      n: clamp(nRaw, 1, 5, FUSED_SILICA_BRILLOUIN.n),
      vA: clamp(vARaw, 100, 20000, FUSED_SILICA_BRILLOUIN.vA),
      rho: clamp(rhoRaw, 100, 20000, FUSED_SILICA_BRILLOUIN.rho),
      p12: clamp(p12Raw, 0.001, 1, FUSED_SILICA_BRILLOUIN.p12),
    }
    : BRILLOUIN_MEDIA[choice];
  const measured = choice === "custom" ? undefined : BRILLOUIN_MEDIA[choice].measured;

  /** Choosing a medium sets its measurement's pump wavelength and linewidth, or the silica defaults (1550 nm, 20 MHz). */
  const choose = (id: Choice) => {
    setMaterial(id);
    const m = id === "custom" ? undefined : BRILLOUIN_MEDIA[id].measured;
    setWavelength(m ? +(m.lambda * 1e9).toFixed(3) : 1550);
    setLinewidth(m ? +(m.fwhm / 1e6).toFixed(3) : 20);
  };

  const lambda = wavelength_nm * 1e-9;
  const linewidth = linewidth_MHz * 1e6;
  const nuB = brillouinShift(lambda, medium.vA, medium.n);
  const Lambda = acousticWavelength(lambda, medium.n);
  const gB = brillouinGain(lambda, medium, linewidth);
  const TB = phononLifetime(linewidth);
  const lambdaS = stokesWavelength(lambda, nuB);
  const curve = shiftCurve(medium.n, medium.vA);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 max-w-xl" role="group" aria-label="Medium">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => choose(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : BRILLOUIN_MEDIA[id].name}
          </button>
        ))}
      </div>

      {choice === "custom" && (
        <div className="grid gap-4 sm:grid-cols-4 mb-4">
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Acoustic velocity v_A (m/s)" value={vARaw} onChange={setVA} min={100} max={20000} step="10" />
          <ValidatedNumberInput label="Density ρ (kg/m³)" value={rhoRaw} onChange={setRho} min={100} max={20000} step="10" />
          <ValidatedNumberInput label="Elasto-optic coefficient p₁₂" value={p12Raw} onChange={setP12} min={0.001} max={1} step="0.001" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Pump wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Brillouin linewidth Δν_B, FWHM (MHz)" value={linewidthRaw} onChange={setLinewidth} min={LINEWIDTH_MIN_MHZ} max={LINEWIDTH_MAX_MHZ} step="any" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        n = {sig(medium.n, 4)}, v_A = {sig(medium.vA, 4)} m/s, ρ = {sig(medium.rho, 4)} kg/m³, {choice === "diamond" ? "effective p" : "p₁₂"} = {sig(medium.p12, 3)}
        {choice !== "custom" && `; ${BRILLOUIN_MEDIA[choice].source}`}. Δν_B is the gain bandwidth at the pump wavelength: it scales as
        λ_p⁻², so measure or scale it when you change λ.
        {measured && ` Measured at ${sig(measured.lambda * 1e9, 6)} nm: ν_B ${sig(measured.nuB / 1e9, 4)} GHz, Δν_B ${sig(measured.fwhm / 1e6, 3)} MHz, g_B ${exp(measured.gB, 2)} m/W.`}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Brillouin shift ν_B = 2nv_A/λ" value={`${sig(nuB / 1e9, 4)} GHz`} tone="blue" subtext={`Stokes wavelength ${sig(lambdaS * 1e9, 7)} nm`} />
        <ResultCard label="Peak gain g_B" value={`${exp(gB, 3)} m/W`} tone="green" subtext={`= ${sig(gB * 1e11, 4)} cm/GW, Lorentzian of FWHM ${sig(linewidth_MHz, 4)} MHz`} />
        <ResultCard label="Acoustic wavelength Λ = λ/(2n)" value={`${sig(Lambda * 1e6, 4)} µm`} tone="orange" subtext={`phonon lifetime T_B = 1/(πΔν_B) = ${sig(TB * 1e9, 4)} ns`} />
      </div>
      <p className="text-sm text-gray-400 mb-8">
        The SBS threshold of a fibre (effective area, length, loss, polarization and source linewidth) is on the{" "}
        <Link href="/fiber-optics/sbs-threshold" className="text-blue-400 hover:underline">SBS threshold calculator</Link>.
      </p>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">Brillouin shift vs pump wavelength</h3>
        <ChartPanel
          data={[{ x: curve.x, y: curve.y, type: "scatter" as const, mode: "lines" as const, name: "ν_B", line: { color: "#60a5fa", width: 2 } }]}
          layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Pump wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "ν_B (GHz)", gridcolor: "#374151" }, margin: { t: 20, b: 50, l: 60, r: 20 } }}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">ν_B = 2nv_A/λ_p,  g_B = 2πn⁷p₁₂² / (cλ_p²ρv_AΔν_B)</p>
          <p>
            Backward Brillouin scattering from one longitudinal acoustic wave of wavelength Λ = λ_p/(2n). The gain line is
            Lorentzian with the phonon damping as its width; g_B is its peak for a pump much narrower than Δν_B. In a fibre the
            mode index replaces n and acoustic guiding lowers the overlap, so measured fibre gains are below the bulk value.
          </p>
          <p>
            Δν_B grows as λ_p⁻², which cancels the λ_p⁻² in g_B: the peak gain of silica stays near 3–5e-11 m/W at all pump
            wavelengths, while a fixed Δν_B would make it look strongly wavelength dependent.
          </p>
          <p>
            Each medium other than silica comes with a measurement. As₂Se₃ fibre (Abedin 2005, 1.56 µm): 6.0e-9 m/W measured,
            6.09e-9 from the formula; its ρ, v_A and p₁₂ are the paper&apos;s Table 1, after Uchida &amp; Niizeki 1973. As₂S₃
            waveguide (Pant et al. 2011): 0.715e-9 m/W measured, 0.78e-9 from the formula (0.74e-9 with their mode overlap 0.95).
            Diamond (Bai et al. 2020, 532 nm; longitudinal phonons along [110], pump polarized along ⟨111⟩): 60 ± 9 cm/GW
            measured from the laser threshold, 74 cm/GW from the formula at the measured Δν_B of 11.9 ± 4.3 MHz and 60 cm/GW at
            14.7 MHz. Its p is the effective value √0.0153 the paper takes from Grimsditch &amp; Ramdas without stating the
            convention, so treat the diamond gain as ±40 %. For As₂S₃ and diamond, v_A follows from the measured shift,
            v_A = ν_Bλ/(2n).
          </p>
        </div>
      </div>
    </>
  );
}
