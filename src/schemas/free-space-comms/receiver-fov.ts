import {
  BACKGROUND_SCENES, backgroundPower, equalNoiseHalfAngle, parseScene, receiverNoise, responsivity, sceneRadiance, sceneSolidAngle,
} from "../../physics/free-space-comms/background-radiance";
import { fieldStopFraction, fieldStopHalfAngle, friedParameter, sphericalFriedParameter } from "../../physics/free-space-comms/turbulence";
import { excessNoiseFactor } from "../../physics/detectors/apd";
import { defineSchema } from "../types";

const GIGGENBACH = "Giggenbach D. (2022). Free-space optical data receivers with avalanche detectors for satellite downlinks " +
  "regarding background light. Sensors 22(18), 6773, eq. (22) P_bg = L_λ · A · Ω · Δλ (radiance from its Table 1, here times " +
  "the optics' efficiency), with Ω = π sin²θ.";
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §8.5.2: fraction of the " +
  "Airy pattern's energy inside the angle θ, 1 − J₀²(v) − J₁²(v), v = πDθ/λ (83.8 % inside the first dark ring v = 3.8317).";
const MCINTYRE = "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices 13, 164–168, " +
  "F = kM + (1 − k)(2 − 1/M); receiver SNR = (M I_s)²/[2qM²F(I_s + I_bg + I_d)B + i_n²B] after Agrawal G. P. (2010). " +
  "Fiber-Optic Communication Systems, 4th ed., Wiley, §4.4.";

export default defineSchema({
  href: "/free-space-comms/receiver-fov",
  choices: [
    {
      key: "scene",
      label: "Background in the field of view",
      options: BACKGROUND_SCENES.map((s) => ({ value: s.id, label: s.label })),
      default: "horizon",
    },
    {
      key: "wave",
      label: "Turbulence r₀ for the signal",
      options: [
        { value: "spherical", label: "Spherical wave (horizontal link, point source)" },
        { value: "plane", label: "Plane wave (downlink, conservative)" },
      ],
      default: "spherical",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 850, max: 1550 },
    { key: "rxAperture", label: "Aperture diameter", unit: "m", toSI: 1, siUnit: "m", default: 0.2, min: 0.001, max: 10 },
    { key: "fovHalfAngle", label: "FOV half-angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 20, min: 0.001, max: 1000 },
    { key: "opticalEfficiency", label: "Optics + filter efficiency η_opt", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0, max: 1 },
    { key: "filterBandwidth", label: "Filter passband", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1, min: 0.001, max: 100 },
    { key: "qe", label: "Detector quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "signalDbm", label: "Signal at the aperture", unit: "dBm", toSI: 1, siUnit: "dBm", default: -30, min: -120, max: 30 },
    { key: "bandwidth", label: "Electrical bandwidth", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 1, min: 1e-6, max: 1000 },
    { key: "ampNoise", label: "Amplifier noise", unit: "pA/√Hz", toSI: 1e-12, siUnit: "A/√Hz", default: 10, min: 0, max: 1e4 },
    { key: "dark", label: "Dark current (multiplied)", unit: "nA", toSI: 1e-9, siUnit: "A", default: 1, min: 0, max: 1e6 },
    { key: "gain", label: "APD gain M (1 = PIN)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 1000 },
    { key: "k", label: "Ionisation ratio k", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0, max: 1 },
    { key: "cn2", label: "Refractive-index structure constant Cn² (0 = none)", unit: "m⁻²ᐟ³", toSI: 1, siUnit: "m⁻²ᐟ³", default: 1e-14, min: 0, max: 1e-11 },
    { key: "distance", label: "Link distance", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "snrDb", label: "Electrical SNR", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "snr", label: "Electrical SNR (linear)", unit: "", toSI: 1, siUnit: "" },
    { key: "backgroundPower", label: "Background power at the detector", unit: "µW", toSI: 1e-6, siUnit: "W" },
    { key: "signalPower", label: "Signal power at the detector", unit: "µW", toSI: 1e-6, siUnit: "W" },
    { key: "fieldStop", label: "Signal through the field stop", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fov90", label: "FOV half-angle passing 90 % of the signal", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "friedParameter", label: "Fried parameter r₀", unit: "cm", toSI: 0.01, siUnit: "m" },
    { key: "backgroundShare", label: "Noise variance from background", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "amplifierShare", label: "Noise variance from the amplifier", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "excessNoise", label: "Excess noise factor F", unit: "", toSI: 1, siUnit: "" },
    { key: "fovEqualNoise", label: "FOV half-angle where background = amplifier noise", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "diffractionHalfAngle", label: "Diffraction half-angle 1.22λ/D", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
  ],
  compute(si) {
    const scene = parseScene(si.scene);
    const lambda = si.wavelength;
    const diameter = si.rxAperture;
    const area = (Math.PI / 4) * diameter ** 2;
    const R = responsivity(si.qe, lambda);
    const r0 = si.cn2 > 0 ? (si.wave === "plane" ? friedParameter : sphericalFriedParameter)(si.cn2, lambda, si.distance) : Infinity;
    const Pb = backgroundPower({
      radiance: sceneRadiance(scene, lambda), area, fovHalfAngle: si.fovHalfAngle, sourceSolidAngle: sceneSolidAngle(scene),
      bandwidth: si.filterBandwidth, filterTransmission: 1, opticalEfficiency: si.opticalEfficiency,
    }).power;
    const Ps = 10 ** (si.signalDbm / 10) * 1e-3;
    const stop = fieldStopFraction(si.fovHalfAngle, diameter, lambda, r0);
    const noise = receiverNoise({
      signalCurrent: R * si.opticalEfficiency * Ps * stop, backgroundCurrent: R * Pb, darkCurrent: si.dark,
      bandwidth: si.bandwidth, amplifierNoise: si.ampNoise, gain: si.gain, ionisationRatio: si.k,
    });
    const total = noise.signalShot + noise.backgroundShot + noise.darkShot + noise.amplifier;
    const fovEqual = equalNoiseHalfAngle({
      radiance: sceneRadiance(scene, lambda), area, sourceSolidAngle: sceneSolidAngle(scene),
      bandwidth: si.filterBandwidth, filterTransmission: 1, opticalEfficiency: si.opticalEfficiency, responsivity: R,
      amplifierNoise: si.ampNoise, gain: si.gain, ionisationRatio: si.k,
    });
    const warnings: string[] = [];
    if (stop < 0.9) warnings.push("The field stop passes less than 90 % of the signal spot (diffraction and turbulence); the SNR includes this loss.");
    if (!Number.isFinite(r0)) warnings.push("No turbulence (Cn² = 0): friedParameter is null (infinite).");
    if (!Number.isFinite(fovEqual)) warnings.push("Background noise never equals amplifier noise for this scene: fovEqualNoise is null.");
    if (!(noise.snr > 0)) warnings.push("SNR is 0 or undefined (no signal, or invalid receiver parameters): snrDb is null.");
    return {
      values: {
        snrDb: noise.snr > 0 ? 10 * Math.log10(noise.snr) : NaN,
        snr: noise.snr,
        backgroundPower: Pb,
        signalPower: Ps * si.opticalEfficiency * stop,
        fieldStop: stop,
        fov90: fieldStopHalfAngle(0.9, diameter, lambda, r0),
        friedParameter: r0,
        backgroundShare: noise.backgroundShot / total,
        amplifierShare: noise.amplifier / total,
        excessNoise: excessNoiseFactor(si.gain, si.k),
        fovEqualNoise: fovEqual,
        diffractionHalfAngle: (1.22 * lambda) / diameter,
      },
      warnings,
    };
  },
  checks: [
    {
      // Clear sky near the horizon at 1550 nm, 25 mW m⁻² sr⁻¹ nm⁻¹ = 2.5e7 W m⁻² sr⁻¹ m⁻¹; D = 0.2 m: A = 0.0314159 m²;
      // θ = 20 mrad: Ω = π sin²θ = 1.256470e-3 sr; Δλ = 1 nm, η_opt = 0.7: P_bg = 2.5e7 · A · Ω · 1e-9 · 0.7 = 0.6907802 µW.
      source: GIGGENBACH,
      basis: "computed",
      inputs: {},
      expect: { backgroundPower: 0.690780196681241 },
      tolerance: 1e-8,
    },
    {
      // No turbulence, θ at the first dark ring v = πDθ/λ = 3.8317060 (θ = vλ/(πD) = 9.45244 µrad for D = 0.2 m,
      // 1550 nm): EE = 1 − J₀²(v) − J₁²(v) = 0.8377849 (J₀, J₁ by trapezoid of the integral representation).
      source: BORN_WOLF,
      basis: "computed",
      inputs: { cn2: 0, fovHalfAngle: 0.00945244165731541 },
      expect: { fieldStop: 83.77848691733154 },
      tolerance: 1e-6,
    },
    {
      // No turbulence, 20 mrad (v = 8107.336, EE = 0.9999215), signal −30 dBm: R = 0.8qλ/hc = 1.000127 A/W, I_s = R η Ps EE =
      // 0.7000342 µA, I_bg = R P_bg = 0.6908682 µA, I_d = 1 nA, M = 10, k = 0.4: F = 5.14; σ² = 2qM²F(I_s + I_bg + I_d)B + i_n²B
      // (B = 1 GHz, i_n = 10 pA/√Hz); SNR = (M I_s)²/σ² = 148.8369 (21.72711 dB); background 34.5598 %, amplifier 30.3719 % of σ².
      source: MCINTYRE,
      basis: "computed",
      inputs: { cn2: 0 },
      expect: {
        snrDb: 21.727107108316726, snr: 148.83693253909348, backgroundShare: 34.55977303140524, amplifierShare: 30.37191305698077,
        excessNoise: 5.14, fieldStop: 99.99214731181216,
      },
      tolerance: 1e-6,
    },
  ],
});
