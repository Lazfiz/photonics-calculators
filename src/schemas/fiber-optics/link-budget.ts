import { linkBudget } from "../../physics/fiber-optics/link-budget";
import { defineSchema } from "../types";

const AGRAWAL = "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., Wiley, Ch. 5 (design guidelines, " +
  "loss-limited systems): power budget P_tx = P_rx + C_L + M_s with C_L = α_f L + n_c α_con + n_s α_splice " +
  "(equation number not verified).";

export default defineSchema({
  href: "/fiber-optics/link-budget",
  inputs: [
    { key: "txPower", label: "Tx power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 0, min: -40, max: 40 },
    { key: "rxSensitivity", label: "Rx sensitivity", unit: "dBm", toSI: 1, siUnit: "dBm", default: -28, min: -70, max: 10 },
    { key: "fiberLength", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 50, min: 0, max: 20000 },
    { key: "fiberAttenuation", label: "Fibre attenuation", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.2, min: 0, max: 20 },
    { key: "spliceCount", label: "Splices", unit: "", toSI: 1, siUnit: "", default: 10, min: 0, max: 1000 },
    { key: "spliceLoss", label: "Loss per splice", unit: "dB", toSI: 1, siUnit: "dB", default: 0.1, min: 0, max: 10 },
    { key: "connectorCount", label: "Connectors", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: 100 },
    { key: "connectorLoss", label: "Loss per connector", unit: "dB", toSI: 1, siUnit: "dB", default: 0.5, min: 0, max: 10 },
    { key: "margin", label: "Required system margin", unit: "dB", toSI: 1, siUnit: "dB", default: 3, min: 0, max: 50 },
  ],
  outputs: [
    { key: "fiberLoss", label: "Fibre loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "spliceLossTotal", label: "Splice loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "connectorLossTotal", label: "Connector loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "channelLoss", label: "Channel loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "receivedPower", label: "Received power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "availableMargin", label: "Margin above sensitivity", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "excessMargin", label: "Margin left after the required system margin", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "maxLength", label: "Maximum length", unit: "km", toSI: 1e3, siUnit: "m" },
  ],
  compute({ txPower, rxSensitivity, fiberLength, fiberAttenuation, spliceCount, spliceLoss, connectorCount, connectorLoss, margin }) {
    const b = linkBudget({
      txPowerDbm: txPower,
      rxSensitivityDbm: rxSensitivity,
      lengthKm: fiberLength / 1e3,
      fiberLossDbPerKm: fiberAttenuation,
      splices: Math.round(spliceCount),
      spliceLossDb: spliceLoss,
      connectors: Math.round(connectorCount),
      connectorLossDb: connectorLoss,
      marginDb: margin,
    });
    const warnings: string[] = [];
    const reasons: { maxLength?: string } = {};
    if (b.excessMarginDb < 0) {
      warnings.push(`The link does not close: it has ${(-b.excessMarginDb).toFixed(2)} dB less margin than the ${margin} dB required.`);
    }
    if (Number.isNaN(b.maxLengthKm)) {
      reasons.maxLength = "The link does not close at any length: the splices, connectors and required margin alone exceed the power budget.";
    } else if (b.maxLengthKm === Infinity) {
      reasons.maxLength = "The fibre is lossless, so the loss does not limit the length.";
    }
    return {
      values: {
        fiberLoss: b.fiberLossDb,
        spliceLossTotal: b.spliceLossDb,
        connectorLossTotal: b.connectorLossDb,
        channelLoss: b.channelLossDb,
        receivedPower: b.receivedPowerDbm,
        availableMargin: b.availableMarginDb,
        excessMargin: b.excessMarginDb,
        maxLength: b.maxLengthKm * 1e3,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults. Fibre 50 km × 0.2 = 10 dB; splices 10 × 0.1 = 1 dB; connectors 2 × 0.5 = 1 dB; C_L = 12 dB.
      // P_rx = 0 − 12 = −12 dBm; above sensitivity −12 − (−28) = 16 dB; after the 3 dB margin 13 dB.
      // L_max = (0 + 28 − 3 − 1 − 1)/0.2 = 23/0.2 = 115 km.
      source: AGRAWAL,
      basis: "computed",
      inputs: {},
      expect: { fiberLoss: 10, spliceLossTotal: 1, connectorLossTotal: 1, channelLoss: 12, receivedPower: -12, availableMargin: 16, excessMargin: 13, maxLength: 115 },
      tolerance: 1e-8,
    },
    {
      // Tx 3 dBm, Rx −20 dBm, 80 km × 0.25 = 20 dB; 4 splices × 0.05 = 0.2 dB; 4 connectors × 0.3 = 1.2 dB; margin 6 dB.
      // C_L = 21.4 dB; P_rx = 3 − 21.4 = −18.4 dBm; above sensitivity −18.4 + 20 = 1.6 dB; excess 1.6 − 6 = −4.4 dB (no closure).
      // L_max = (3 + 20 − 6 − 0.2 − 1.2)/0.25 = 15.6/0.25 = 62.4 km.
      source: AGRAWAL,
      basis: "computed",
      inputs: { txPower: 3, rxSensitivity: -20, fiberLength: 80, fiberAttenuation: 0.25, spliceCount: 4, spliceLoss: 0.05, connectorCount: 4, connectorLoss: 0.3, margin: 6 },
      expect: { channelLoss: 21.4, receivedPower: -18.4, availableMargin: 1.6, excessMargin: -4.4, maxLength: 62.4 },
      tolerance: 1e-8,
    },
  ],
});
