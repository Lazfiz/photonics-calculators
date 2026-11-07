"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  POCKELS, crossedPolarizerTransmission, cubicCoefficients, cubicHalfWaveVoltage, gyrotropicTransmission, longitudinalHalfWaveVoltage,
  phaseHalfWaveVoltage, pockelsIndexChange, transverseCoefficients, transverseHalfWaveVoltage, type PockelsGeometry, type PockelsId,
} from "../../../physics/materials/pockels";

const IDS = ["kdp", "kdp-d", "adp", "linbo3", "litao3", "ktp", "batio3", "batio3-clamped", "bso"] as const satisfies readonly PockelsId[];
type Choice = PockelsId | "custom";
const CHOICES: readonly Choice[] = [...IDS, "custom"];
const DEFAULT_ID: Choice = "kdp";
const WAVELENGTH_MIN_NM = 250;
const WAVELENGTH_MAX_NM = 5000;
const VOLTAGE_MAX_V = 50000;
const LENGTH_MIN_MM = 0.1;
const LENGTH_MAX_MM = 100;
const GAP_MIN_UM = 1;
const GAP_MAX_UM = 20000;
const CHART_POINTS = 120;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});
const kV = (V: number) => (Number.isFinite(V) ? (Math.abs(V) >= 1000 ? `${sig(V / 1000, 4)} kV` : `${sig(V, 4)} V`) : "—");
const ORDINARY = { n: "n_o", nz: "n_e", r: "r₁₃" };
const rangeNm = (id: PockelsId) => POCKELS[id].range.map((x) => +(x * 1e9).toFixed(1)).join("–");
const GEOMETRY_LABEL: Record<PockelsGeometry, string> = { longitudinal: "longitudinal", transverse: "transverse", cubic: "transverse [110]" };

interface Modulator {
  geometry: PockelsGeometry;
  /** Index (n_o for longitudinal, n_e for transverse, n for cubic) and coefficient the single-polarization phase uses. */
  n: number;
  r: number;
  /** Retardation half-wave voltage, or NaN when it needs a second coefficient. */
  VpiRet: number;
  VpiPhase: number;
  /** Rotatory power, rad/m (0 for the crystals without optical activity here). */
  rotation: number;
}

function modulator(choice: Choice, lambda: number, d: number, L: number, custom: { n: number; r: number; geometry: PockelsGeometry }): Modulator {
  if (choice === "custom") {
    const { n, r, geometry } = custom;
    const dd = geometry === "longitudinal" ? L : d;
    const VpiRet = geometry === "longitudinal" ? longitudinalHalfWaveVoltage(lambda, n, r) : NaN;
    return { geometry, n, r, VpiRet, VpiPhase: phaseHalfWaveVoltage(lambda, n, r, dd, L), rotation: 0 };
  }
  const c = POCKELS[choice];
  const [lo, hi] = c.range;
  const inRange = lambda >= lo * (1 - 1e-9) && lambda <= hi * (1 + 1e-9);
  const { no, ne } = c.indices(lambda);
  if (c.geometry === "longitudinal") {
    const n = inRange ? no : NaN;
    return { geometry: "longitudinal", n, r: c.r.r63!, VpiRet: longitudinalHalfWaveVoltage(lambda, n, c.r.r63!), VpiPhase: phaseHalfWaveVoltage(lambda, n, c.r.r63!, L, L), rotation: 0 };
  }
  if (c.geometry === "cubic") {
    const n = inRange ? no : NaN;
    const { r41, rotation } = cubicCoefficients(c, lambda);
    return { geometry: "cubic", n, r: r41, VpiRet: cubicHalfWaveVoltage(lambda, n, r41, d, L), VpiPhase: phaseHalfWaveVoltage(lambda, n, r41, d, L), rotation };
  }
  const n = inRange ? ne : NaN;
  const { r33, r13 } = transverseCoefficients(c, lambda);
  return {
    geometry: "transverse", n, r: r33,
    VpiRet: transverseHalfWaveVoltage(lambda, inRange ? no : NaN, n, r33, r13, d, L),
    VpiPhase: phaseHalfWaveVoltage(lambda, n, r33, d, L), rotation: 0,
  };
}

/** T(V) between crossed polarizers; with a rotation ρL ≠ 0 (rad) a second curve has the analyzer crossed to the zero-field output. */
function transmissionChart(Vpi: number, V: number, rotationL: number) {
  if (!Number.isFinite(Vpi)) return [];
  const active = Number.isFinite(rotationL) && rotationL !== 0;
  // With optical activity the first transmission peak moves past V_π: plot further.
  const Vmax = Math.max((active ? 4 : 2) * Vpi, 1.1 * Math.abs(V));
  const xs = Array.from({ length: CHART_POINTS + 1 }, (_, k) => (Vmax * k) / CHART_POINTS);
  const scale = Vpi >= 1000 ? 1000 : 1;
  const T = (x: number) => (active ? gyrotropicTransmission((Math.PI * x) / Vpi, rotationL) : crossedPolarizerTransmission((Math.PI * x) / Vpi));
  const traces: Record<string, unknown>[] = [{
    x: xs.map((x) => round6(x / scale)), y: xs.map((x) => round6(crossedPolarizerTransmission((Math.PI * x) / Vpi))),
    type: "scatter", mode: "lines", name: active ? "without optical activity" : "T = sin²(πV/2V_π)", line: { color: "#60a5fa", width: 2, dash: active ? "dot" : "solid" },
  }];
  if (active) {
    traces.push({
      x: xs.map((x) => round6(x / scale)), y: xs.map((x) => round6(T(x))),
      type: "scatter", mode: "lines", name: `with ρL = ${sig((rotationL * 180) / Math.PI, 4)}°`, line: { color: "#34d399", width: 2 },
    });
  }
  traces.push({ x: [round6(V / scale)], y: [round6(T(V))], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } });
  return traces;
}

export default function ElectroOpticPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm
  const [voltageRaw, setVoltage] = useURLState("voltage", 1000); // V
  const [lengthRaw, setLength] = useURLState("length", 20); // mm
  const [gapRaw, setGap] = useURLState("gap", 1000); // µm, transverse electrode gap
  const [nRaw, setN] = useURLState("n", 2.2);
  const [rRaw, setR] = useURLState("r", 30.8); // pm/V
  const [geometryParam, setGeometry] = useURLState("geometry", "transverse");
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 633);
  const voltage = clamp(voltageRaw, 0, VOLTAGE_MAX_V, 1000);
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 20);
  const gap_um = clamp(gapRaw, GAP_MIN_UM, GAP_MAX_UM, 1000);
  const nCustom = clamp(nRaw, 1, 5, 2.2);
  const rCustom_pmV = clamp(rRaw, 0.01, 5000, 30.8);
  const customGeometry: PockelsGeometry = geometryParam === "longitudinal" ? "longitudinal" : "transverse";
  const lambda = wavelength_nm * 1e-9;
  const L = length_mm * 1e-3;
  const d = gap_um * 1e-6;
  const custom = choice === "custom";
  const crystal = custom ? null : POCKELS[choice];

  const m = modulator(choice, lambda, d, L, { n: nCustom, r: rCustom_pmV * 1e-12, geometry: customGeometry });
  const longitudinal = m.geometry === "longitudinal";
  const cubic = m.geometry === "cubic";
  const E = voltage / (longitudinal ? L : d);
  const dn = pockelsIndexChange(m.n, m.r, E);
  const phase = (Math.PI * voltage) / m.VpiPhase;
  const retardation = (Math.PI * voltage) / m.VpiRet;
  const VpiL_Vcm = m.VpiPhase * L * 100;
  const outside = "outside the index model's range";
  const rotationL = m.rotation * L; // rad
  const chart = transmissionChart(m.VpiRet, voltage, rotationL);
  const perp = crystal?.perp ?? ORDINARY;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6" role="group" aria-label="Material">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : POCKELS[id].name}
          </button>
        ))}
      </div>

      {custom && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Coefficient r (pm/V)" value={rRaw} onChange={setR} min={0.01} max={5000} step="0.1" />
          <div>
            <span className="block text-sm text-gray-400 mb-1">Geometry</span>
            <div role="group" aria-label="Geometry" className="flex gap-2">
              {(["longitudinal", "transverse"] as const).map((g) => (
                <button key={g} onClick={() => setGeometry(g)} aria-pressed={customGeometry === g}
                  className={`px-3 py-2 rounded text-sm ${customGeometry === g ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Voltage V (V)" value={voltageRaw} onChange={setVoltage} min={0} max={VOLTAGE_MAX_V} step="10" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="0.5" />
        {!longitudinal && (
          <ValidatedNumberInput label="Electrode gap d (µm)" value={gapRaw} onChange={setGap} min={GAP_MIN_UM} max={GAP_MAX_UM} step="1" />
        )}
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {crystal ? `${crystal.pointGroup}, ${GEOMETRY_LABEL[crystal.geometry]}; ${crystal.source}; index model ${rangeNm(choice as PockelsId)} nm.` : `Custom ${customGeometry} modulator.`}{" "}
        {longitudinal ? "Field and light along z: E = V/L, and V_π does not depend on the crystal size."
          : cubic ? "Field along [110] across the gap d, light along [1̄10]: E = V/d, induced axes at ±45° between [110] and [001]."
          : "Field along z across the gap d, light across it: E = V/d."}{" "}
        {!Number.isFinite(m.n) && <span className="text-yellow-400">The wavelength is {outside}.</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ResultCard label={longitudinal || cubic ? "Half-wave voltage V_π (retardation)" : `Half-wave voltage V_π (z–${perp.n.slice(2)} retardation)`} value={kV(m.VpiRet)} tone="blue"
          subtext={Number.isFinite(m.VpiRet)
            ? (longitudinal ? "λ/(2n_o³r₆₃): amplitude modulator between crossed polarizers"
              : cubic ? "λd/(2n³r₄₁L), without the optical activity"
              : `λd/((${perp.nz}³r₃₃ − ${perp.n}³${perp.r})L), on top of the natural birefringence`)
            : (custom ? "needs r₃₃ and r₁₃: use a table crystal" : outside)} />
        <ResultCard label="Phase half-wave voltage (one polarization)" value={kV(m.VpiPhase)} tone="green"
          subtext={Number.isFinite(m.VpiPhase)
            ? (longitudinal ? "λ/(n_o³r₆₃): twice the retardation value"
              : cubic ? `λd/(n³r₄₁L) along an induced axis, without the optical activity; V_π·L = ${sig(VpiL_Vcm, 4)} V·cm`
              : `λd/(${perp.nz}³r₃₃L); V_π·L = ${sig(VpiL_Vcm, 4)} V·cm`)
            : outside} />
      </div>
      <div className={`grid gap-4 mb-8 ${cubic ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        <ResultCard label="Field E" value={`${sig(E / 1e6, 4)} MV/m`} tone="gray" subtext={longitudinal ? "V/L" : "V/d"} />
        <ResultCard label="Index change Δn = −½n³rE" value={Number.isFinite(dn) ? dn.toExponential(3) : "—"} tone="orange"
          subtext={Number.isFinite(dn)
            ? (longitudinal ? "x′ axis; y′ changes by +½n_o³r₆₃E" : cubic ? "one induced axis; the other changes by +½n³r₄₁E" : "z polarization")
            : outside} />
        <ResultCard label={Number.isFinite(retardation) ? "Retardation Γ / phase φ" : "Phase shift φ"}
          value={Number.isFinite(retardation) ? `${sig(retardation / Math.PI, 4)}π / ${sig(phase / Math.PI, 4)}π` : (Number.isFinite(phase) ? `${sig(phase / Math.PI, 4)}π` : "—")}
          tone="purple" subtext={Number.isFinite(retardation)
            ? (cubic
              ? `crossed polarizers pass ${sig(100 * crossedPolarizerTransmission(retardation), 4)} % without the rotation, ${sig(100 * gyrotropicTransmission(retardation, rotationL), 4)} % with it`
              : `crossed polarizers pass ${sig(100 * crossedPolarizerTransmission(retardation), 4)} %`)
            : undefined} />
        {cubic && (
          <ResultCard label="Optical rotation ρL" value={Number.isFinite(rotationL) ? `${sig((rotationL * 180) / Math.PI, 4)}°` : "—"} tone="cyan"
            subtext={Number.isFinite(rotationL) ? `ρ = ${sig((m.rotation * 1e-3 * 180) / Math.PI, 4)} °/mm; the analyzer is set crossed to the zero-field output` : outside} />
        )}
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Amplitude modulator between crossed polarizers</h3>
          <ChartPanel data={chart} layout={layout(m.VpiRet >= 1000 ? "Voltage (kV)" : "Voltage (V)", "Transmission")} />
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Crystals at {wavelength_nm} nm</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Crystal</th><th className="pr-4 py-1">Geometry</th><th className="pr-4 py-1">r (pm/V)</th>
              <th className="pr-4 py-1">n</th><th className="pr-4 py-1">V_π retardation</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((id) => {
              const row = modulator(id, lambda, d, L, { n: nCustom, r: rCustom_pmV * 1e-12, geometry: customGeometry });
              const c = POCKELS[id];
              const rt = transverseCoefficients(c, lambda);
              const rText = c.geometry === "longitudinal" ? `r₆₃ ${sig(c.r.r63! * 1e12, 3)}`
                : c.geometry === "cubic" ? `r₄₁ ${sig(cubicCoefficients(c, lambda).r41 * 1e12, 3)}`
                : `r₃₃ ${sig(rt.r33 * 1e12, 3)}, ${(c.perp ?? ORDINARY).r} ${sig(rt.r13 * 1e12, 3)}`;
              return (
                <tr key={id} onClick={() => setMaterial(id)} className={`cursor-pointer hover:bg-gray-800 ${id === choice ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1">{c.name}</td>
                  <td className="pr-4 py-1 text-gray-300">{GEOMETRY_LABEL[c.geometry]}</td>
                  <td className="pr-4 py-1">{rText}</td>
                  <td className="pr-4 py-1">{sig(row.n, 5)}</td>
                  <td className="pr-4 py-1">{kV(row.VpiRet)}</td>
                  <td className="py-1 text-gray-400">{c.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the crystal. Transverse rows use the gap and length above.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Δn = −½ n³ r E</p>
          <p>
            Longitudinal KDP-type cell: the field along the optic axis makes the x′ and y′ axes (at 45° to x, y) differ by
            n_o³r₆₃E, so the retardation is Γ = 2πn_o³r₆₃V/λ and V_π = λ/(2n_o³r₆₃). A beam polarized along x′ alone sees
            half that change, so a phase modulator needs twice the voltage.
          </p>
          <p>
            Transverse LiNbO₃ modulator: the field along z across a gap d acts over the length L, so V_π scales as d/L. The
            z-polarized beam uses r₃₃; the z–o retardation uses n_e³r₃₃ − n_o³r₁₃ and adds to the crystal&apos;s natural
            birefringence, which a real modulator compensates.
          </p>
          <p>
            KTP (biaxial, mm2) in the same geometry with light along x: the z polarization uses n_z³r₃₃ and the y
            polarization n_y³r₂₃, so the retardation uses n_z³r₃₃ − n_y³r₂₃. Its r₃₃ and r₂₃ are 633 nm values.
          </p>
          <p>
            r is taken at its reference wavelength (633 nm for LiNbO₃ and KTP) and only n follows the Sellmeier fit, so V_π far from
            it is approximate. LiTaO₃ is the exception: its unclamped r₃₃ and r₁₃ were measured at 632.8, 980, 1330 and 1558 nm and
            are interpolated between them (r₃₃ falls from 30.5 to 27.4 pm/V), so its V_π holds over that range only. LiNbO₃&apos;s r₃₃ and r₁₃ are the clamped (high-frequency) values; below the acoustic resonances
            the unclamped ones are a few per cent larger. KTP&apos;s r₃₃ and r₂₃ are the unclamped (low-frequency) values; vendor
            tables give 35.0 and 13.8 pm/V clamped.
          </p>
          <p>
            LiTaO₃ (3m) works like LiNbO₃ but its birefringence is small and of the other sign (n_e − n_o ≈ +0.004), so the
            natural retardation of a transverse modulator is about 20× smaller. Its coefficients are the unclamped (low-frequency)
            values of Casson et al., scaled to the literature r₃₃ = 30.5 pm/V at 632.8 nm; their r₁₃ there is 7.62 pm/V against
            8.4 in the older interferometric value. Its permittivity is not tabulated here.
          </p>
          <p>
            BaTiO₃ (4mm) uses the same z-field geometry with n_e³r₃₃ − n_o³r₁₃, for a poled single-domain crystal at 633 nm and
            23 °C. Its piezoelectric part is large: clamped r₃₃ is 40.6 against 105 pm/V unclamped, so V_π rises about 3× above the
            first acoustic resonance (≈ 0.1 MHz for a 2 cm crystal). Its largest coefficient, r₄₂ = 1300 pm/V (clamped 730), needs a
            field across the c-axis and is not modelled; n_e and r also change strongly with temperature.
          </p>
          <p>
            BSO (Bi₁₂SiO₂₀, cubic 23) is isotropic until a field is applied. With the field along [110] and the light along [1̄10],
            the induced axes lie at ±45° between [110] and [001] and differ by n³r₄₁E, so V_π = λd/(2n³r₄₁L). The crystal is also
            optically active: it rotates the polarization by ρL (21 °/mm at 633 nm), and the rotation adds in quadrature to the
            induced birefringence (Efremidis et al. 2009, eqs. 8–10). With the analyzer crossed to the zero-field output, the
            transmission becomes (cos ρL·ρL·S − sin ρL·cos Δ)² + cos²ρL·(Γ/2)²S², Δ = √((Γ/2)² + (ρL)²), S = sin Δ/Δ, which falls
            short of 1 at V_π once ρL is large: keep ρL small or compensate it. r₄₁, n and ρ are Efremidis et al.&apos;s, measured with a dc
            field (unclamped) from 500 to 800 nm: r₄₁ falls from 4.1 to 2.0 pm/V, below the older single-wavelength values in the red
            (3.8–5.0 pm/V at 633–850 nm).
          </p>
        </div>
      </div>
    </>
  );
}
