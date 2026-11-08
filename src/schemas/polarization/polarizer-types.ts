import {
  POLARIZER_IDS, POLARIZERS, coversWavelength, polarizerFigures, polarizerThroughput, type PolarizerId, type PolarizerInput,
} from "../../physics/polarization/polarizer-types";
import { defineSchema } from "../types";

const NM = 1e-9;
const MW = 1e-3;
const SHURCLIFF = "Shurcliff W. A. (1962). Polarized Light: Production and Use, Harvard University Press, ch. 3 (principal " +
  "transmittances k₁, k₂ of a polarizer; unpolarized transmittance (k₁ + k₂)/2); Goldstein D. H. (2011). Polarized Light, 3rd ed., " +
  "CRC Press, ch. Mueller Matrices for Polarizing Components, pp. 93–115. https://doi.org/10.1201/b10436";
/** An output keyed "<id>:<name>", keeping the literal key type so a typo in `checks` fails tsc. */
const out = <S extends string>(id: PolarizerId, name: S, what: string, unit: string, toSI: number, siUnit: string) => ({
  key: `${id}:${name}` as `${PolarizerId}:${S}`,
  label: `${POLARIZERS[id].name}: ${what}`,
  unit,
  toSI,
  siUnit,
});
const clampRange = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Out and leak are NaN for types whose vendor states no transmission; those outputs are left out.
const WITH_TRANSMISSION = POLARIZER_IDS.filter((id) => Number.isFinite(polarizerFigures(POLARIZERS[id]).k1));

export default defineSchema({
  href: "/polarization/polarizer-types",
  choices: [
    {
      key: "input",
      label: "Input polarization",
      options: [
        { value: "aligned", label: "Linear, along the pass axis" },
        { value: "unpolarized", label: "Unpolarized" },
      ],
      default: "aligned",
    },
  ],
  inputs: [
    { key: "inputPower", label: "Input power", unit: "mW", toSI: MW, siUnit: "W", default: 10, min: 0, max: 1e6 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 1064, min: 100, max: 50_000 },
  ],
  outputs: [
    ...POLARIZER_IDS.flatMap((id) => [
      out(id, "erDb", "catalogue-minimum extinction ratio", "dB", 1, "dB"),
      out(id, "dop", "degree of polarization, unpolarized input", "", 1, ""),
      out(id, "covers", "1 if the catalogue range holds the wavelength, else 0", "", 1, ""),
    ]),
    ...WITH_TRANSMISSION.flatMap((id) => [
      out(id, "out", "output power (lower bound)", "mW", MW, "W"),
      out(id, "leak", "leakage power (upper bound)", "mW", MW, "W"),
    ]),
  ],
  compute({ input, inputPower, wavelength }) {
    const mode: PolarizerInput = input === "unpolarized" ? "unpolarized" : "aligned";
    const power = clampRange(inputPower, 0, 1e6 * MW);
    const values: Record<string, number> = {};
    for (const id of POLARIZER_IDS) {
      const spec = POLARIZERS[id];
      const f = polarizerFigures(spec);
      values[`${id}:erDb`] = f.erDb;
      values[`${id}:dop`] = f.dop;
      values[`${id}:covers`] = coversWavelength(spec, wavelength) ? 1 : 0;
      if (WITH_TRANSMISSION.includes(id)) {
        const t = polarizerThroughput(spec, power, mode);
        values[`${id}:out`] = t.out;
        values[`${id}:leak`] = t.leak;
      }
    }
    return {
      values,
      warnings: [
        "Catalogue minima for one Thorlabs product family per type: the output is a lower bound, the leakage an upper bound. " +
          "Output and leakage are given only for types whose vendor states a transmission.",
      ],
    };
  },
  checks: [
    {
      // Plate polarizer (catalogue ER 10 000:1, Tp 0.95), 10 mW aligned: out = 10·0.95 = 9.5 mW, k₂ = 0.95/10 000 = 9.5e-5,
      // leak = 10·9.5e-5 = 9.5e-4 mW; ER = 10 log10(10 000) = 40 dB.
      source: SHURCLIFF,
      basis: "computed",
      inputs: {},
      expect: { "plate:out": 9.5, "plate:leak": 9.5e-4, "plate:erDb": 40 },
      tolerance: 1e-8,
    },
    {
      // Film polarizer (ER 1000:1, 38 % unpolarized), 10 mW unpolarized: k₁ = 2·0.38/(1 + 1/1000) = 0.76/1.001, so
      // (k₁ + k₂)/2 = 0.38 and out = 3.8 mW; leak = 10·k₂/2 = 5·0.76/1.001/1000 = 3.796203796e-3 mW; DOP = 999/1001.
      source: SHURCLIFF,
      basis: "computed",
      inputs: { input: "unpolarized" },
      expect: { "film:out": 3.8, "film:leak": 3.796203796e-3, "film:dop": 999 / 1001 },
      tolerance: 1e-8,
    },
  ],
});
