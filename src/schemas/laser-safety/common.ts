// Inputs and citations shared by the laser-safety schemas.
import { T_MAX, T_MIN } from "../../physics/laser-safety/eye-exposure-limits";
import type { ChoiceSpec } from "../types";

export const ICNIRP_2013 = "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between " +
  "180 nm and 1,000 µm. Health Phys. 105(3), 271–295";

/** As the pages' beam-definition select (`components/laser-safety-beam-definition.tsx`). */
export const BEAM_DEFINITION = {
  key: "beamDefinition",
  label: "Beam diameter definition",
  options: [
    { value: "1/e2", label: "1/e² of peak (data sheets)" },
    { value: "1/e", label: "1/e of peak (ANSI Z136.1, IEC 60825-1)" },
  ],
  default: "1/e2",
} as const satisfies ChoiceSpec<"beamDefinition">;

/** 1/e diameters and divergences are 1/√2 of the 1/e² ones the physics takes. */
export const toOneOverESquared = (beamDefinition: string) => (beamDefinition === "1/e" ? Math.SQRT2 : 1);

export const WAVELENGTH = {
  key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 180, max: 1e6,
} as const;

export const EXPOSURE = {
  key: "exposure", label: "Exposure time t", unit: "s", toSI: 1, siUnit: "s", default: 0.25, min: T_MIN, max: T_MAX,
} as const;

export const SAFETY_FACTOR = {
  key: "safetyFactor", label: "Safety factor (divides every limit)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1e6,
} as const;
