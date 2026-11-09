import { TORR } from "../../physics/constants";
import { EVAPORANTS, thermalEvaporation, type EvaporantId } from "../../physics/thin-film/thermal-evaporation";
import { defineSchema } from "../types";

const IDS = Object.keys(EVAPORANTS) as EvaporantId[];

const ALCOCK = "Alcock C. B., Itkin V. P., Horrigan M. K. (1984). Vapour Pressure Equations for the Metallic Elements: 298–2500 K. " +
  "Canadian Metallurgical Quarterly 23, 309–313, doi:10.1179/cmq.1984.23.3.309: log₁₀(p/atm) = A + B/T + C log₁₀ T (Al liquid: A = 5.911, B = −16211, C = 0).";
const OHRING = "Ohring M. (2002). Materials Science of Thin Films, 2nd ed., Academic Press, ch. 3: Hertz–Knudsen flux Γ = α p √(M/2πRT), " +
  "surface-source thickness rate Γ A_e/(π ρ h²) and d/d₀ = 1/(1 + (l/h)²)², ch. 2: λ = 5×10⁻³ cm·Torr/P for air.";

export default defineSchema({
  href: "/thin-film/thermal-evaporation",
  choices: [
    {
      key: "material",
      label: "Evaporant",
      options: IDS.map((k) => ({ value: k, label: `${EVAPORANTS[k].name} (${k})` })),
      default: "Al",
    },
  ],
  inputs: [
    { key: "sourceTemp", label: "Source temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 1200, min: -200, max: 2226 },
    { key: "sourceSubstrateDist", label: "Source–substrate distance h", unit: "cm", toSI: 1e-2, siUnit: "m", default: 30, min: 0.1, max: 1000 },
    { key: "sourceDiameter", label: "Source (melt surface) diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 2, min: 0.01, max: 100 },
    { key: "substrateRadius", label: "Substrate radius", unit: "cm", toSI: 1e-2, siUnit: "m", default: 5, min: 0, max: 500 },
    { key: "alpha", label: "Evaporation coefficient α", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.001, max: 1 },
    { key: "chamberPressure", label: "Chamber pressure", unit: "Torr", toSI: TORR, siUnit: "Pa", default: 1e-6, min: 1e-12, max: 1000 },
    { key: "substrateTemp", label: "Substrate temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 100, min: -273.15, max: 3000 },
  ],
  outputs: [
    { key: "vapourPressure", label: "Vapour pressure", unit: "Pa", toSI: 1, siUnit: "Pa" },
    { key: "rate", label: "Growth rate at the centre", unit: "nm/s", toSI: 1e-9, siUnit: "m/s" },
    { key: "edgeThickness", label: "Thickness at the substrate edge, relative to the centre", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "flux", label: "Evaporation mass flux", unit: "kg m⁻² s⁻¹", toSI: 1, siUnit: "kg m⁻² s⁻¹" },
    { key: "meanFreePath", label: "Mean free path (residual air)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "knudsen", label: "Knudsen number λ/h", unit: "", toSI: 1, siUnit: "" },
    { key: "meanSpeed", label: "Mean speed of the vapour", unit: "m/s", toSI: 1, siUnit: "m/s" },
    { key: "homologous", label: "Homologous temperature T_s/T_m", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(i) {
    const ev = EVAPORANTS[i.material as EvaporantId];
    const T = i.sourceTemp + 273.15;
    const r = thermalEvaporation(ev, {
      T,
      h: i.sourceSubstrateDist,
      sourceRadius: i.sourceDiameter / 2,
      substrateRadius: i.substrateRadius,
      alpha: i.alpha,
      chamberPressure: i.chamberPressure,
      substrateTemp: i.substrateTemp + 273.15,
    });
    const warnings: string[] = [];
    if (!(T > 0 && T <= 2500)) warnings.push("The source temperature must lie between 0 K and 2500 K (the range of the vapour-pressure fits).");
    else if (!r.fitOk) warnings.push("Outside the fit range of the vapour pressure (10⁻¹⁵–10⁻³ atm).");
    if (r.bigSource) warnings.push("The source is not small next to h (r_s/h > 0.1): the point-like cosine formula loses accuracy.");
    if (r.p > 1) warnings.push("Above about 1 Pa a vapour cloud forms over the melt: the free-evaporation rate is an upper bound.");
    if (r.homologous >= 1) warnings.push("The substrate is at or above the melting point: no solid film.");
    return {
      values: {
        vapourPressure: r.p, rate: r.rate, edgeThickness: r.edge, flux: r.flux, meanFreePath: r.mfp, knudsen: r.Kn,
        meanSpeed: r.speed, homologous: r.homologous,
      },
      warnings,
    };
  },
  checks: [
    {
      // Al liquid at T = 1473.15 K: log₁₀(p/atm) = 5.911 − 16211/1473.15 = −5.0936...; p = 101325 · 10^that = 0.817346 Pa.
      // Γ = p √(M/(2π R T)) = 0.817346 · √(0.026982/(2π · 8.314462618 · 1473.15)) = 4.83964e-4 kg m⁻² s⁻¹.
      // rate = Γ π r_s²/(π ρ h²) = 4.83964e-4 · (0.01)²/(2700 · 0.3²) = 1.99162e-10 m/s = 0.199162 nm/s.
      source: ALCOCK + " " + OHRING,
      basis: "computed",
      inputs: {},
      expect: { vapourPressure: 0.8173463382214057, flux: 0.0004839635776117278, rate: 0.19916196609536124 },
      tolerance: 1e-8,
    },
    {
      // Edge thickness 1/(1 + (0.05/0.3)²)² = 0.946676; mean speed √(8RT/πM) = √(8 · 8.314462618 · 1473.15/(π · 0.026982)) = 1075.16 m/s;
      // λ = 5e-5 m·Torr/(1e-6 Torr) = 50 m (5e-3 cm·Torr/P), Kn = 50/0.3 = 166.67; T_s/T_m = 373.15/933.47 = 0.399745.
      source: OHRING,
      basis: "computed",
      inputs: {},
      expect: { edgeThickness: 94.66764061358658, meanSpeed: 1075.161156448518, knudsen: 50 / 0.3, homologous: 0.39974503733381894 },
      tolerance: 1e-8,
    },
  ],
});
