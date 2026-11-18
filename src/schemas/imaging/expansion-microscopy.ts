import { expansionSummary } from "../../physics/imaging/expansion-microscopy";
import { defineSchema } from "../types";

const WASSIE = "Wassie A. T., Zhao Y., Boyden E. S. (2019). Expansion microscopy: principles and uses in biological research. " +
  "Nat. Methods 16, 33–41. https://doi.org/10.1038/s41592-018-0219-4";
const CHEN = "Chen F., Tillberg P. W., Boyden E. S. (2015). Expansion microscopy. Science 347, 543–548. " +
  "https://doi.org/10.1126/science.1260088";
const NM = 1e-9;
const UM = 1e-6;

export default defineSchema({
  href: "/imaging/expansion-microscopy",
  inputs: [
    { key: "magnification", label: "Expansion factor E", unit: "×", toSI: 1, siUnit: "", default: 4, min: 1, max: 20 },
    { key: "originalRes", label: "Microscope resolution d", unit: "nm", toSI: NM, siUnit: "m", default: 250, min: 10, max: 2000 },
    { key: "probeSize", label: "Probe size", unit: "nm", toSI: NM, siUnit: "m", default: 10, min: 0, max: 100 },
    { key: "labelLinkerLen", label: "Label-linker length", unit: "nm", toSI: NM, siUnit: "m", default: 15, min: 0, max: 100 },
    { key: "gelThickness", label: "Gel thickness before expansion", unit: "µm", toSI: UM, siUnit: "m", default: 50, min: 1, max: 2000 },
  ],
  choices: [
    {
      key: "labelling",
      label: "Labelling",
      options: [
        { value: "pre", label: "Before expansion (label expands with the sample)" },
        { value: "post", label: "After expansion (label binds the expanded sample)" },
      ],
      default: "pre",
    },
  ],
  outputs: [
    { key: "opticalTerm", label: "Optical term d/E", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "labelDisplacement", label: "Label displacement √(probe² + linker²)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "labelTerm", label: "Label term (L, or L/E after expansion)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "effective", label: "Effective resolution", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "effectiveOther", label: "Effective resolution with the other labelling", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "fovLinear", label: "Field of view (linear)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fovArea", label: "Field of view (area)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "expandedGel", label: "Expanded gel thickness", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "volumeFactor", label: "Volume to image (× unexpanded)", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ magnification, originalRes, probeSize, labelLinkerLen, gelThickness, labelling }) {
    const mode = labelling === "post" ? "post" : "pre";
    return { values: { ...expansionSummary(originalRes, magnification, probeSize, labelLinkerLen, mode, gelThickness) } };
  },
  checks: [
    {
      // E = 4, d = 250 nm, probe 10, linker 15, pre: L = √(100 + 225) = 18.02776 nm; d/E = 62.5 nm;
      // pre √(62.5² + 18.02776²) = 65.04806 nm; post √(62.5² + (18.02776/4)²) = √(3906.25 + 20.3125) = 62.66229 nm.
      source: WASSIE,
      basis: "computed",
      inputs: { magnification: 4, originalRes: 250, probeSize: 10, labelLinkerLen: 15, labelling: "pre" },
      expect: { opticalTerm: 62.5, labelDisplacement: 18.027756377319946, effective: 65.04805915628843, effectiveOther: 62.66228929747142 },
      tolerance: 1e-8,
    },
    {
      // E = 10, d = 300, probe 5, linker 8, post: L = √89 = 9.433981 nm, L/E = 0.9433981 nm;
      // post √(30² + 0.9433981²) = 30.01483 nm; pre √(30² + 9.433981²) = 31.44837 nm.
      source: WASSIE,
      basis: "computed",
      inputs: { magnification: 10, originalRes: 300, probeSize: 5, labelLinkerLen: 8, labelling: "post" },
      expect: { labelTerm: 0.9433981132056604, effective: 30.014829668015775, effectiveOther: 31.44837038703277 },
      tolerance: 1e-8,
    },
    {
      // Isotropic expansion by E = 4 of a 50 µm gel: field 1/4 = 25 %, area 1/16 = 6.25 %, gel 200 µm, volume 4³ = 64.
      source: CHEN,
      basis: "computed",
      inputs: { magnification: 4, gelThickness: 50 },
      expect: { fovLinear: 25, fovArea: 6.25, expandedGel: 200, volumeFactor: 64 },
      tolerance: 1e-8,
    },
  ],
});
