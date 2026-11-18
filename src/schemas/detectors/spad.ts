import { SPAD_LOSS_WARNING, SPAD_MIN_GATE_COUNTS, spadSummary } from "../../physics/detectors/spad-summary";
import { defineSchema } from "../types";

const SOURCE = "Recorded rate with a non-paralyzable dead time m = R/(1 + Rτ): Knoll G. F. (2010), Radiation Detection and Measurement, 4th ed., " +
  "Wiley, ch. 4 (dead-time models); Müller J. W. (1973), Dead-time problems, Nucl. Instrum. Methods 112, 47–57, doi:10.1016/0029-554X(73)90773-8. " +
  "Thermally activated dark counts DCR ∝ exp(−E_a/k_B T) at fixed excess bias: Webster E. A. G., Henderson R. K. (2013), A TCAD and spectroscopy study " +
  "of dark count mechanisms in single-photon avalanche diodes, IEEE Trans. Electron Devices 60, 4014–4019, doi:10.1109/TED.2013.2285163. " +
  "Afterpulses (probability P_ap per recorded avalanche): Cova S., Lacaita A., Ripamonti G. (1991), Trapping phenomena in avalanche photodiodes on " +
  "nanosecond scale, IEEE Electron Device Lett. 12, 685–687, doi:10.1109/55.116955. Counting SNR of the dead-time corrected rate: relative count " +
  "variance 1/(1 + Rτ)² of a renewal process, Cox D. R. (1962), Renewal Theory, Methuen; Bernoulli afterpulses added to the variance. " +
  "Defaults: Korzh B. et al. (2014), Free-running InGaAs single photon detector with 1 dark count per second at 10% efficiency, " +
  "Appl. Phys. Lett. 104, 081108, doi:10.1063/1.4866582.";

export default defineSchema({
  href: "/detectors/spad",
  inputs: [
    { key: "pde", label: "Photon detection efficiency", unit: "", toSI: 1, siUnit: "", default: 0.115, min: 0, max: 1 },
    { key: "dcr", label: "Dark count rate at T_ref", unit: "counts/s", toSI: 1, siUnit: "1/s", default: 1.19, min: 0, max: 1e8 },
    { key: "refTemperature", label: "Reference temperature T_ref", unit: "°C", toSI: 1, siUnit: "°C", default: -110, min: -200, max: 100 },
    { key: "temperature", label: "Operating temperature", unit: "°C", toSI: 1, siUnit: "°C", default: -110, min: -200, max: 100 },
    { key: "activationEnergy", label: "DCR activation energy", unit: "eV", toSI: 1, siUnit: "eV", default: 0.25, min: 0, max: 1.5 },
    { key: "deadTime", label: "Dead time", unit: "ns", toSI: 1e-9, siUnit: "s", default: 20000, min: 1, max: 1e6 },
    { key: "afterpulseProb", label: "Afterpulse probability", unit: "", toSI: 1, siUnit: "", default: 0.022, min: 0, max: 0.5 },
    { key: "opticalPower", label: "Optical power", unit: "dBm", toSI: 1, siUnit: "dBm", default: -120, min: -160, max: -30 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 2000 },
    { key: "gateTime", label: "Counting gate", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e4 },
  ],
  outputs: [
    { key: "photonRate", label: "Photon rate", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "darkCountRate", label: "DCR at operating T", unit: "counts/s", toSI: 1, siUnit: "1/s" },
    { key: "recordedRate", label: "Recorded rate m", unit: "counts/s", toSI: 1, siUnit: "1/s" },
    { key: "rTau", label: "R·τ", unit: "", toSI: 1, siUnit: "" },
    { key: "countLoss", label: "Count loss", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "afterpulseRate", label: "Afterpulse rate m·P_ap", unit: "counts/s", toSI: 1, siUnit: "1/s" },
    { key: "snr", label: "Counting SNR in the gate", unit: "", toSI: 1, siUnit: "" },
    { key: "doublingInterval", label: "Temperature step that doubles the DCR", unit: "K", toSI: 1, siUnit: "K" },
  ],
  compute({ pde, dcr, refTemperature, temperature, activationEnergy, deadTime, afterpulseProb, opticalPower, wavelength, gateTime }) {
    const r = spadSummary({
      pde, dcrRef: dcr, refTemperatureC: refTemperature, temperatureC: temperature, activationEnergy, deadTime, afterpulseProb,
      powerDbm: opticalPower, wavelength, gate: gateTime,
    });
    const warnings: string[] = [];
    if (r.measured * gateTime < SPAD_MIN_GATE_COUNTS) {
      warnings.push(`Fewer than ${SPAD_MIN_GATE_COUNTS} counts are recorded in the gate: the SNR formula assumes many counts and is only indicative here.`);
    }
    if (r.loss > SPAD_LOSS_WARNING) {
      warnings.push(`More than ${SPAD_LOSS_WARNING * 100} % of the avalanches fall in the dead time: the recorded rate saturates at 1/τ and the corrected SNR falls.`);
    }
    return {
      values: {
        photonRate: r.photons, darkCountRate: r.dcr, recordedRate: r.measured, rTau: r.rate * deadTime, countLoss: r.loss,
        afterpulseRate: r.afterpulseRate, snr: r.snr, doublingInterval: r.doubling,
      },
      warnings,
      reasons: { doublingInterval: "The activation energy is 0: the dark rate does not depend on temperature, so it never doubles." },
    };
  },
  checks: [
    {
      // Defaults (scratch script, h = 6.62607015e-34, c = 299792458, k_B/q): P = 1e-3·10^(−12) = 1e-15 W; photons = Pλ/(hc) = 7802.8806797 /s;
      // T = T_ref so DCR = 1.19 /s; R = 0.115·7802.88068 + 1.19 = 898.5212782 /s; Rτ = 0.0179704256; m = R/(1 + Rτ) = 882.65951112 /s;
      // loss = Rτ/(1 + Rτ) = 1.76531902 %; afterpulses m·0.022 = 19.4185092 /s;
      // SNR = (R_s/R)·√(m·T)/√(1 + (1 + Rτ)²·P(1 − P)/(1 + P)²) = 29.3585400; doubling ln2·k_B·T²/E_a at 163.15 K = 6.35963949 K.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        photonRate: 7802.880679691200, darkCountRate: 1.19, recordedRate: 882.6595111221380, rTau: 0.01797042556328976, countLoss: 1.765319022244276,
        afterpulseRate: 19.41850924468704, snr: 29.35854002575849, doublingInterval: 6.359639492130376,
      },
      tolerance: 1e-8,
    },
    {
      // T = −90 °C, T_ref = −110 °C, DCR_ref = 100, PDE 0.2, E_a 0.25 eV, τ = 1 µs, P_ap = 0.05, −110 dBm at 1310 nm, gate 2 s: photons 65946.9270348 /s;
      // DCR = 100·exp[−(0.25/k_B)(1/183.15 − 1/163.15)] = 697.124491 /s; R = 0.2·65946.927 + 697.1245 = 13886.5099 /s; Rτ = 0.0138865099;
      // m = 13696.3158721 /s; loss 1.36963159 %; m·P_ap = 684.815794 /s; SNR = 153.828932; doubling at 183.15 K = 8.01442165 K.
      source: SOURCE,
      basis: "computed",
      inputs: { temperature: -90, dcr: 100, pde: 0.2, deadTime: 1000, afterpulseProb: 0.05, opticalPower: -110, wavelength: 1310, gateTime: 2 },
      expect: {
        photonRate: 65946.92703480950, darkCountRate: 697.1244910884488, recordedRate: 13696.31587212526, rTau: 0.01388650989805035,
        countLoss: 1.369631587212526, afterpulseRate: 684.8157936062630, snr: 153.8289319963972, doublingInterval: 8.014421645865138,
      },
      tolerance: 1e-8,
    },
  ],
});
