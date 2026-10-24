"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import {
  SI_FIT_MIN_LAMBDA, TPA_MEDIA, indirectBeta, linearEdge_eV, mediumBeta, mediumRegime, scaledBeta, scalingBeta, tpaRegime, tpaTransmission,
  type TpaMediumId,
} from "../../../physics/materials/two-photon";

const IDS = Object.keys(TPA_MEDIA) as TpaMediumId[];
type Choice = TpaMediumId | "custom";
const CHOICES: readonly Choice[] = [...IDS, "custom"];
const DEFAULT_ID: Choice = "gaas";
const WAVELENGTH_MIN_NM = 200;
const WAVELENGTH_MAX_NM = 20000;
const INTENSITY_MAX_GW_CM2 = 1e4;
const THICKNESS_MIN_MM = 1e-3;
const THICKNESS_MAX_MM = 1e3;
const REGIME_NOTE = {
  transparent: "2ħω < E_g: no degenerate two-photon absorption.",
  linear: "ħω ≥ E_g: one-photon (linear) absorption dominates; the 2PA model does not apply.",
  "outside-fit": "Below 850 nm, outside Bristow et al.'s measurements; 2PA across silicon's 3.4 eV direct gap adds below ≈ 730 nm.",
} as const;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");

/** β (cm/GW) across the 2PA window E_g/2 < ħω < edge: scaled from the measurement and the Eq. 1 prediction. */
function betaCurves(betaRef: number, lambdaRef: number, bandGap_eV: number, edge_eV: number, n: number | null, Ep_eV: number | null) {
  const lambdaLo = (hc_eV_nm / edge_eV) * 1.002;
  const lambdaHi = (2 * hc_eV_nm) / bandGap_eV;
  const x = Array.from({ length: 121 }, (_, i) => +(lambdaLo + (i / 120) * (lambdaHi - lambdaLo)).toFixed(3));
  const curves = [{
    x, y: x.map((l) => +(scaledBeta(betaRef, lambdaRef, l * 1e-9, bandGap_eV) / 1e-11).toFixed(6)),
    type: "scatter" as const, mode: "lines" as const, name: "Scaled from measured β", line: { color: "#a78bfa", width: 2 },
  }];
  if (n !== null && Ep_eV !== null) {
    curves.push({
      x, y: x.map((l) => +(scalingBeta(l * 1e-9, n, bandGap_eV, Ep_eV) / 1e-11).toFixed(6)),
      type: "scatter" as const, mode: "lines" as const, name: "Eq. 1 (K = 3100)", line: { color: "#9ca3af", width: 1 },
    });
  }
  return curves;
}

/** Silicon β (cm/GW) from Bristow's fit over 850 nm to E_gi/2, with their measured point at 1220 nm. */
function indirectCurves(bandGap_eV: number, betaRef: number, lambdaRef: number) {
  const lambdaEnd = (2 * hc_eV_nm) / bandGap_eV;
  const lambdaStart = SI_FIT_MIN_LAMBDA * 1e9;
  const x = Array.from({ length: 121 }, (_, i) => +(lambdaStart + (i / 120) * (lambdaEnd - lambdaStart)).toFixed(3));
  return [
    {
      x, y: x.map((l) => +(indirectBeta(l * 1e-9, bandGap_eV) / 1e-11).toFixed(6)),
      type: "scatter" as const, mode: "lines" as const, name: "Bristow fit (C = 43 cm/GW)", line: { color: "#a78bfa", width: 2 },
    },
    {
      x: [+(lambdaRef * 1e9).toFixed(3)], y: [+(betaRef / 1e-11).toFixed(6)], type: "scatter" as const, mode: "markers" as const,
      name: "Measured (1220 nm)", marker: { color: "#f59e0b", size: 8 }, line: { color: "#f59e0b", width: 0 },
    },
  ];
}

/** Transmission (%) against peak intensity, 0.01–1000 GW/cm², log-spaced. */
function transmissionCurve(beta: number, length: number) {
  const x = Array.from({ length: 101 }, (_, i) => +(10 ** (-2 + i * 0.05)).toPrecision(6));
  return { x, y: x.map((I) => +(tpaTransmission(beta, I * 1e13, length) * 100).toFixed(6)) };
}

export default function TwoPhotonAbsorptionPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [intensityRaw, setIntensity] = useURLState("intensity", 1); // GW/cm²
  const [thicknessRaw, setThickness] = useURLState("thickness", 1); // mm
  const [betaRefRaw, setBetaRef] = useURLState("beta", 23); // cm/GW, custom medium
  const [lambdaRefRaw, setLambdaRef] = useURLState("lambdaRef", 1064); // nm, custom medium
  const [gapRaw, setGap] = useURLState("bandGap", 1.42); // eV, custom medium
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const medium = choice === "custom" ? null : TPA_MEDIA[choice];
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1064);
  const intensity_GWcm2 = clamp(intensityRaw, 0, INTENSITY_MAX_GW_CM2, 1);
  const thickness_mm = clamp(thicknessRaw, THICKNESS_MIN_MM, THICKNESS_MAX_MM, 1);

  const betaRef = medium ? medium.beta : clamp(betaRefRaw, 0, 1e5, 23) * 1e-11;
  const lambdaRef = medium ? medium.lambda : clamp(lambdaRefRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1064) * 1e-9;
  const bandGap_eV = medium ? medium.bandGap_eV : clamp(gapRaw, 0.05, 15, 1.42);
  const lambda = wavelength_nm * 1e-9;
  const L = thickness_mm * 1e-3;
  const regime = medium ? mediumRegime(medium, lambda) : tpaRegime(lambda, bandGap_eV);
  const refRegime = medium ? mediumRegime(medium, lambdaRef) : tpaRegime(lambdaRef, bandGap_eV);
  const beta = medium ? mediumBeta(medium, lambda) : scaledBeta(betaRef, lambdaRef, lambda, bandGap_eV);
  const eq1 = medium && medium.n !== null && medium.Ep_eV !== null ? { n: medium.n, Ep_eV: medium.Ep_eV } : null;
  const betaEq1 = eq1 ? scalingBeta(lambda, eq1.n, bandGap_eV, eq1.Ep_eV) : NaN;
  const indirect = medium?.gap === "indirect";
  const edge_eV = medium ? linearEdge_eV(medium) : bandGap_eV;
  const T = tpaTransmission(beta, intensity_GWcm2 * 1e13, L);
  const curves = indirect
    ? indirectCurves(bandGap_eV, betaRef, lambdaRef)
    : refRegime === "two-photon" ? betaCurves(betaRef, lambdaRef, bandGap_eV, edge_eV, eq1?.n ?? null, eq1?.Ep_eV ?? null) : null;
  const tCurve = Number.isFinite(beta) ? transmissionCurve(beta, L) : null;
  const select = (id: Choice) => {
    setMaterial(id);
    if (id !== "custom") setWavelength(Math.round(TPA_MEDIA[id].lambda * 1e9));
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6" role="group" aria-label="Medium">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => select(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : TPA_MEDIA[id].name}
          </button>
        ))}
      </div>

      {!medium && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Measured β (cm/GW)" value={betaRefRaw} onChange={setBetaRef} min={0} max={1e5} step="any" />
          <ValidatedNumberInput label="at wavelength (nm)" value={lambdaRefRaw} onChange={setLambdaRef} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
          <ValidatedNumberInput label="Direct band gap E_g (eV)" value={gapRaw} onChange={setGap} min={0.05} max={15} step="0.01" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Peak intensity I₀ (GW/cm²)" value={intensityRaw} onChange={setIntensity} min={0} max={INTENSITY_MAX_GW_CM2} step="any" />
        <ValidatedNumberInput label="Thickness L (mm)" value={thicknessRaw} onChange={setThickness} min={THICKNESS_MIN_MM} max={THICKNESS_MAX_MM} step="any" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {medium
          ? `${medium.name}: β = ${sig(medium.beta / 1e-11, 3)} cm/GW measured at ${Math.round(medium.lambda * 1e9)} nm, ${indirect ? "indirect gap" : medium.gap === "effective" ? "E′_g" : "E_g"} = ${medium.bandGap_eV} eV${medium.n !== null ? `, n = ${medium.n}` : ""}${medium.Ep_eV !== null ? `, E_p = ${medium.Ep_eV} eV` : ""}; ${medium.source}.`
          : `Custom medium: β = ${sig(betaRef / 1e-11, 4)} cm/GW at ${sig(lambdaRef * 1e9, 5)} nm, E_g = ${sig(bandGap_eV, 4)} eV.`}{" "}
        2PA window {indirect ? sig(SI_FIT_MIN_LAMBDA * 1e9, 4) : sig(hc_eV_nm / edge_eV, 4)}–{sig((2 * hc_eV_nm) / bandGap_eV, 4)} nm.{" "}
        {indirect && regime === "two-photon" && lambda < hc_eV_nm * 1e-9 / bandGap_eV && (
          <span className="text-yellow-400">Above the 1.12 eV indirect gap, phonon-assisted linear absorption (5 × 10² cm⁻¹ at 850 nm) is not included in T. </span>
        )}
        {medium?.gap === "effective" && regime === "two-photon" && Math.abs(lambda - medium.lambda) > 0.01 * medium.lambda && (
          <span className="text-yellow-400">Away from the measured wavelength the two-band scaling of wide-gap solids is order-of-magnitude (DeSalvo et al.). </span>
        )}
        {refRegime !== "two-photon" && <span className="text-yellow-400">The measurement wavelength lies outside the 2PA window, so β cannot be scaled.</span>}
        {refRegime === "two-photon" && regime && regime !== "two-photon" && <span className="text-yellow-400">{REGIME_NOTE[regime]}</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="β at this wavelength" value={`${sig(beta / 1e-11, 4)} cm/GW`} tone="blue"
          subtext={eq1 ? `Eq. 1 predicts ${sig(betaEq1 / 1e-11, 3)} cm/GW` : indirect ? "Bristow et al. fit, C = 43 cm/GW" : medium ? "scaled by F₂(2ħω/E′_g)" : "scaled by F₂(2ħω/E_g)"} />
        <ResultCard label="Induced absorption α₂ = βI₀" value={`${sig((beta * intensity_GWcm2 * 1e13) / 100, 4)} cm⁻¹`} tone="orange" />
        <ResultCard label="Transmission T = 1/(1 + βI₀L)" value={`${sig(T * 100, 4)} %`} tone="green" subtext="plane wave, no linear loss" />
        <ResultCard label="2PA loss" value={`${sig(-10 * Math.log10(T), 4)} dB`} tone="red" />
      </div>

      {curves && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold mb-2">β across the 2PA window</h3>
          <ChartPanel data={curves} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "β (cm/GW)", gridcolor: "#374151" }, margin: { t: 20, b: 50, l: 60, r: 20 } }} />
        </div>
      )}

      {tCurve && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold mb-2">Transmission vs peak intensity ({sig(thickness_mm, 4)} mm)</h3>
          <ChartPanel
            data={[{ x: tCurve.x, y: tCurve.y, type: "scatter" as const, mode: "lines" as const, name: "T", line: { color: "#f59e0b", width: 2 } }]}
            layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "I₀ (GW/cm²)", gridcolor: "#374151", type: "log" }, yaxis: { title: "Transmission (%)", gridcolor: "#374151" }, margin: { t: 20, b: 50, l: 60, r: 20 } }}
          />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">dI/dz = −βI²,  T = 1/(1 + βI₀L),  β ∝ F₂(2ħω/E_g) = (x − 1)^(3/2)/x⁵</p>
          <p>
            Degenerate two-photon absorption between two parabolic bands, allowed for E_g/2 &lt; ħω &lt; E_g. A measured β moves
            to another wavelength by the ratio of F₂, which peaks at 2ħω = 1.43 E_g; Eq. 1 of Van Stryland et al. (1985) predicts
            β from n, E_g and E_p alone; it matches their measurements within the ±40 % error, except ZnTe, whose 1064 nm
            point sits at the edge of the window.
          </p>
          <p>
            T is for a plane wave of constant intensity. Gaussian beams and pulses transmit more at the same peak intensity,
            and free carriers made by 2PA add absorption for pulses longer than a few picoseconds.
          </p>
          <p>
            Wide-gap solids (DeSalvo et al. 1996) use the effective direct gap E′_g the authors fitted to their 2PA data; they
            found the two-band dispersion diverges near the 2PA edge (BBO: F₂ scaling from 0.9 cm/GW at 266 nm gives 0.076 at
            355 nm, measured 0.010). Indirect-gap silicon follows Bristow et al.&apos;s fit, β = Σₙ 2C F₂⁽ⁿ⁾(ħω/E_gi) over
            allowed and forbidden phonon-assisted transitions (n = 0, 1, 2), C = 43 cm/GW, E_gi = 1.12 eV, from 850 nm to
            2214 nm (2ħω = E_gi).
          </p>
        </div>
      </div>
    </>
  );
}
