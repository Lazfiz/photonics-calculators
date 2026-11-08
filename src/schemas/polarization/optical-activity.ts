import {
  MOLAR_ROTATION_CONV_PER_SI, SPECIFIC_ROTATION_SI_PER_CONV, SUCROSE_DISPERSION_RANGE, SUCROSE_TEMPERATURE_COEFFICIENT, T_REF,
  molarRotation, observedRotation, outputAzimuth, specificRotationFromObserved, substanceSpecificRotation, temperatureCorrected,
} from "../../physics/polarization/optical-activity";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const SPECIFIC = "rad·m²/kg"; // [α]: 1 deg·mL·g⁻¹·dm⁻¹ = (π/180)·10⁻² rad·m²/kg
const BIOT = "Biot's law α = [α] c l and the one-term Drude rotatory dispersion [α] ∝ 1/(λ² − λ₀²), as in Lowry T. M. (1935). " +
  "Optical Rotatory Power, Longmans, Green; sucrose: NIST SRM 17e Certificate of Analysis (2003), [α] = 66.524 " +
  "deg·mL·g⁻¹·dm⁻¹ at 20 °C and 589.44 nm (vacuum), ICUMSA rotatory dispersion equation.";
const wrap = (a: number) => a - Math.PI * Math.round(a / Math.PI);

export default defineSchema({
  href: "/polarization/optical-activity",
  choices: [
    { key: "substance", label: "Substance", options: [{ value: "sucrose", label: "Sucrose (NIST)" }, { value: "custom", label: "Custom substance (one-term Drude)" }], default: "sucrose" },
    { key: "mode", label: "Mode", options: [{ value: "predict", label: "Predict the rotation" }, { value: "measured", label: "From a measured rotation" }], default: "predict" },
  ],
  inputs: [
    { key: "wavelength", label: "Vacuum wavelength λ (sucrose: 546.2–882.6 nm, the NIST range)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589.44, min: 300, max: 1100 },
    { key: "alphaRef", label: "[α] at the reference wavelength (custom substance)", unit: "deg·mL·g⁻¹·dm⁻¹", toSI: SPECIFIC_ROTATION_SI_PER_CONV, siUnit: SPECIFIC, default: 66.524, min: -10000, max: 10000 },
    { key: "lambdaRef", label: "Reference wavelength λ_ref (custom substance)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589.44, min: 200, max: 2000 },
    { key: "lambda0", label: "Drude λ₀ (custom substance)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0, min: 0, max: 1000 },
    { key: "concentration", label: "Concentration c", unit: "g/100 mL", toSI: 10, siUnit: "kg/m³", default: 26.016, min: 0, max: 100 },
    { key: "pathLength", label: "Path length l", unit: "dm", toSI: 0.1, siUnit: "m", default: 2, min: 0, max: 50 },
    { key: "temperature", label: "Temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 20, min: 0, max: 100 },
    { key: "tempCoeff", label: "Temperature coefficient k (sucrose)", unit: "1/°C", toSI: 1, siUnit: "1/°C", default: SUCROSE_TEMPERATURE_COEFFICIENT, min: -0.01, max: 0.01 },
    { key: "tempCoeffCustom", label: "Temperature coefficient k (custom substance)", unit: "1/°C", toSI: 1, siUnit: "1/°C", default: 0, min: -0.01, max: 0.01 },
    { key: "molarMass", label: "Molar mass M", unit: "g/mol", toSI: 1e-3, siUnit: "kg/mol", default: 342.297, min: 1, max: 10000 },
    { key: "inputAzimuth", label: "Input azimuth θ_in (predict mode)", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "measuredRotation", label: "Measured rotation α (measured mode; + clockwise seen toward the source)", unit: "°", toSI: DEG, siUnit: "rad", default: 34.6, min: -36000, max: 36000 },
  ],
  outputs: [
    { key: "specific20", label: "[α] at λ and 20 °C", unit: "deg·mL·g⁻¹·dm⁻¹", toSI: SPECIFIC_ROTATION_SI_PER_CONV, siUnit: SPECIFIC },
    { key: "specificT", label: "[α] at the solution temperature", unit: "deg·mL·g⁻¹·dm⁻¹", toSI: SPECIFIC_ROTATION_SI_PER_CONV, siUnit: SPECIFIC },
    { key: "observedRotation", label: "Observed rotation α (predict mode)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "outputAzimuth", label: "Output azimuth θ_in − α, reduced to ±90° (predict mode)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "specificFromMeasured", label: "[α] from the measured rotation (measured mode)", unit: "deg·mL·g⁻¹·dm⁻¹", toSI: SPECIFIC_ROTATION_SI_PER_CONV, siUnit: SPECIFIC },
    { key: "molarRotation", label: "Molar rotation [M]", unit: "deg·cm²·dmol⁻¹", toSI: 1 / MOLAR_ROTATION_CONV_PER_SI, siUnit: "rad·m²/mol" },
  ],
  validate({ substance, wavelength }) {
    if (substance !== "sucrose") return undefined;
    const [lo, hi] = SUCROSE_DISPERSION_RANGE;
    return wavelength >= lo * (1 - 1e-12) && wavelength <= hi * (1 + 1e-12)
      ? undefined
      : "For sucrose the wavelength must lie in the NIST dispersion range, 546.2 to 882.6 nm.";
  },
  compute({ substance, mode, wavelength, alphaRef, lambdaRef, lambda0, concentration, pathLength, temperature, tempCoeff, tempCoeffCustom, molarMass, inputAzimuth, measuredRotation }) {
    const sucrose = substance === "sucrose";
    const alpha20 = substanceSpecificRotation(sucrose, alphaRef, lambdaRef, lambda0, wavelength);
    const alphaT = temperatureCorrected(alpha20, sucrose ? tempCoeff : tempCoeffCustom, T_REF + (temperature - 20));
    const alpha = observedRotation(alphaT, concentration, pathLength);
    const specMeasured = specificRotationFromObserved(measuredRotation, concentration, pathLength);
    const measured = mode === "measured";
    const molar = molarRotation(measured ? specMeasured : alphaT, molarMass);
    const warnings: string[] = [];
    if (!sucrose && !Number.isFinite(alpha20)) warnings.push("The Drude form needs λ and λ_ref above λ₀: no rotation can be computed.");
    if (sucrose && Math.abs(temperature - 20) > 5) warnings.push("The default linear temperature term is fitted within a few degrees of 20 °C; here the corrected [α] is an extrapolation.");
    if (measured && !Number.isFinite(specMeasured)) warnings.push("The measured-rotation mode needs c > 0 and l > 0.");
    warnings.push(measured ? "Measured mode: the observed rotation and output azimuth do not apply." : "Predict mode: [α] from the measured rotation does not apply.");
    return {
      values: {
        specific20: alpha20,
        specificT: alphaT,
        observedRotation: measured ? NaN : alpha,
        outputAzimuth: measured ? NaN : wrap(outputAzimuth(inputAzimuth, alpha)),
        specificFromMeasured: measured ? specMeasured : NaN,
        molarRotation: molar,
      },
      warnings,
    };
  },
  checks: [
    {
      // Sucrose at the NIST reference point: [α] = 66.524 deg·mL·g⁻¹·dm⁻¹ at 20 °C and 589.44 nm. c = 26.016 g/100 mL,
      // l = 2 dm: α = 66.524 × 0.26016 g/mL × 2 dm = 34.61376768°. [M] = [α]·M/100 = 66.524 × 342.297 / 100 = 227.70965628°·cm²/dmol.
      source: BIOT,
      basis: "computed",
      inputs: { substance: "sucrose", mode: "predict", wavelength: 589.44, concentration: 26.016, pathLength: 2, temperature: 20 },
      expect: { specific20: 66.524, observedRotation: 34.61376768, molarRotation: 227.70965628 },
      tolerance: 1e-8,
    },
    {
      // Custom Drude, λ₀ = 0 (Biot's 1/λ² law): [α](300 nm) = 50 × (600/300)² = 200 deg·mL·g⁻¹·dm⁻¹; c = 10 g/100 mL = 0.1 g/mL,
      // l = 1 dm: α = 200 × 0.1 × 1 = 20°.
      source: BIOT,
      basis: "computed",
      inputs: { substance: "custom", mode: "predict", wavelength: 300, alphaRef: 50, lambdaRef: 600, lambda0: 0, concentration: 10, pathLength: 1, temperature: 20 },
      expect: { specific20: 200, observedRotation: 20 },
      tolerance: 1e-8,
    },
  ],
});
