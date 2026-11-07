import { DB_PER_E_FOLD, KOSCHMIEDER } from "../../physics/free-space-comms/atmospheric-attenuation";
import { MM_PER_HOUR, type SnowType, snowPowerLaw, snowSpecificAttenuation } from "../../physics/free-space-comms/precipitation";
import { defineSchema } from "../types";

const AWAN = "Awan M. S. (2010). Free space optical communication links under adverse weather conditions. PhD thesis, TU Graz, " +
  "eq. (3.29), after Sheikh Muhammad S., Köhldorfer P., Leitgeb E. (2005). ICTON, eqs. (6)–(8): γ = a S^b dB/km, S in mm/h, " +
  "dry snow a = 5.42·10⁻⁵ λ + 5.4958776, b = 1.38; wet snow a = 1.023·10⁻⁴ λ + 3.7855466, b = 0.72, λ in nm " +
  "(rounded in Kaushal H., Kaddoum G. (2015), arXiv:1506.04836, eqs. (4)–(5)).";

export default defineSchema({
  href: "/free-space-comms/snow-attenuation",
  choices: [
    {
      key: "type",
      label: "Snow type",
      options: [
        { value: "dry", label: "Dry snow" },
        { value: "wet", label: "Wet snow" },
      ],
      default: "dry",
    },
  ],
  inputs: [
    { key: "snowRate", label: "Snowfall rate (water equivalent)", unit: "mm/h", toSI: MM_PER_HOUR, siUnit: "m/s", default: 1, min: 0, max: 10 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "range", label: "Link length", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0, max: 20 },
  ],
  outputs: [
    { key: "specificAttenuation", label: "Specific attenuation γ", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "pathAttenuation", label: "Path attenuation", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmittance", label: "Transmittance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "visibility", label: "Koschmieder-equivalent visibility (3.912/V = this extinction)", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "exponentB", label: "Exponent b", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ type, snowRate, wavelength, range }) {
    const snowType: SnowType = type === "wet" ? "wet" : "dry";
    const specific = snowSpecificAttenuation(snowRate, wavelength, snowType); // dB/m
    const total = specific * range;
    const warnings: string[] = [];
    // Visibility whose Koschmieder extinction 3.912/V equals this (wavelength-flat) extinction, m.
    const visibility = specific > 0 ? KOSCHMIEDER / (specific / DB_PER_E_FOLD) : Infinity;
    if (!(specific > 0)) warnings.push("No snow, no attenuation: the equivalent visibility is infinite and goes out as null.");
    return {
      values: {
        specificAttenuation: specific,
        pathAttenuation: total,
        transmittance: 10 ** (-total / 10),
        visibility,
        exponentB: snowPowerLaw(wavelength, snowType).b,
      },
      warnings,
    };
  },
  checks: [
    {
      // Dry snow, S = 1 mm/h, 1550 nm, 1 km: a = 5.42e-5 · 1550 + 5.4958776 = 5.5798876, γ = a · 1^1.38 = 5.5798876 dB/km;
      // transmittance 10^(−0.55798876) = 27.67013 %; V = 3.912023/(5.5798876/4.342945) = 3.044810 km.
      source: AWAN,
      basis: "computed",
      inputs: { type: "dry", snowRate: 1, wavelength: 1550, range: 1 },
      expect: { specificAttenuation: 5.5798876, pathAttenuation: 5.5798876, transmittance: 27.670132577111143, visibility: 3.044810444454147, exponentB: 1.38 },
      tolerance: 1e-8,
    },
    {
      // Wet snow, S = 2 mm/h, 850 nm, 3 km: a = 1.023e-4 · 850 + 3.7855466 = 3.8725016, γ = 3.8725016 · 2^0.72 = 6.378715 dB/km,
      // 19.136145 dB over 3 km, 1.220072 %; V = 2.663499 km.
      source: AWAN,
      basis: "computed",
      inputs: { type: "wet", snowRate: 2, wavelength: 850, range: 3 },
      expect: { specificAttenuation: 6.378715064228609, pathAttenuation: 19.136145192685827, transmittance: 1.2200720570823835, visibility: 2.6634988194781175, exponentB: 0.72 },
      tolerance: 1e-8,
    },
  ],
});
