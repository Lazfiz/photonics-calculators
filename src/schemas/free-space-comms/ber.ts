import {
  MAX_NOISE_PER_SLOT, MAX_PHOTONS_PER_BIT, dpskPhotonCountingBer, ookPhotonCountingBer, requiredPhotonsPerBit,
} from "../../physics/free-space-comms/ber";
import { defineSchema } from "../types";

const CAPLAN = "Caplan D. O. (2008). Laser communication transmitter and receiver design. In Majumdar A. K., " +
  "Ricklin J. C. (eds.), Free-Space Laser Communications, pp. 109–246. Springer. Photon-counting quantum limits " +
  "½e^(−2n̄) (OOK) and ½e^(−n̄) (DPSK); Poisson maximum-likelihood decision for noisy counts.";

/** The BER targets the page lists. */
const TARGETS = [1e-3, 1e-6, 1e-9] as const;

export default defineSchema({
  href: "/free-space-comms/ber",
  inputs: [
    { key: "photons", label: "Detected signal photons per bit (average)", unit: "", toSI: 1, siUnit: "", default: 100, min: 0.1, max: MAX_PHOTONS_PER_BIT },
    { key: "darkCount", label: "Dark plus background counts per bit slot (per detector)", unit: "", toSI: 1, siUnit: "", default: 100, min: 0, max: MAX_NOISE_PER_SLOT },
  ],
  outputs: [
    { key: "berOok", label: "BER, OOK", unit: "", toSI: 1, siUnit: "" },
    { key: "berDpsk", label: "BER, DPSK", unit: "", toSI: 1, siUnit: "" },
    { key: "pulsePhotons", label: "Photons per OOK 1 pulse", unit: "", toSI: 1, siUnit: "" },
    { key: "ookThreshold", label: "OOK decision threshold (ML): decide 1 at this many counts or more", unit: "counts", toSI: 1, siUnit: "counts" },
    { key: "requiredOok1e3", label: "OOK photons per bit for BER 1e-3", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredOok1e6", label: "OOK photons per bit for BER 1e-6", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredOok1e9", label: "OOK photons per bit for BER 1e-9", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredDpsk1e3", label: "DPSK photons per bit for BER 1e-3", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredDpsk1e6", label: "DPSK photons per bit for BER 1e-6", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredDpsk1e9", label: "DPSK photons per bit for BER 1e-9", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ photons, darkCount }) {
    const ook = ookPhotonCountingBer(photons, darkCount);
    const ookReq = TARGETS.map((target) => requiredPhotonsPerBit("OOK", target, darkCount));
    const dpskReq = TARGETS.map((target) => requiredPhotonsPerBit("DPSK", target, darkCount));
    const warnings: string[] = [];
    if ([...ookReq, ...dpskReq].some((x) => x === Infinity)) {
      warnings.push("A target BER needs more than 1e7 photons per bit at this noise level; its required photons are null.");
    }
    const finite = (x: number) => (Number.isFinite(x) ? x : NaN);
    return {
      values: {
        berOok: ook.ber,
        berDpsk: dpskPhotonCountingBer(photons, darkCount),
        pulsePhotons: 2 * photons,
        ookThreshold: ook.threshold,
        requiredOok1e3: finite(ookReq[0]), requiredOok1e6: finite(ookReq[1]), requiredOok1e9: finite(ookReq[2]),
        requiredDpsk1e3: finite(dpskReq[0]), requiredDpsk1e6: finite(dpskReq[1]), requiredDpsk1e9: finite(dpskReq[2]),
      },
      warnings,
    };
  },
  checks: [
    {
      // No noise: OOK ½e^(−2n̄) = ½e^(−20) = 1.030577e-9 and DPSK ½e^(−n̄) = ½e^(−10) = 2.269996e-5 at n̄ = 10; the 1e-9 targets
      // invert to n̄ = ½ ln(5e8) = 10.01506 (OOK, the "10 photons/bit" limit) and ln(5e8) = 20.03012 (DPSK).
      source: CAPLAN,
      basis: "computed",
      inputs: { photons: 10, darkCount: 0 },
      expect: {
        berOok: 1.030576811e-9, berDpsk: 2.269996488e-5, requiredOok1e9: 10.01505933, requiredDpsk1e9: 20.03011866,
        requiredOok1e6: 6.561181689, requiredDpsk1e3: 6.214608098,
      },
      tolerance: 1e-7,
    },
    {
      // n̄ = 20, n_b = 1: n_s = 40, k_T = ⌊40/ln 41⌋ + 1 = 11, OOK BER = ½[P(K ≥ 11 | 1) + P(K ≤ 10 | 41)] = 8.810337e-9;
      // DPSK BER = Σ_j P(K_c = j | 21)[P(K_d > j | 1) + ½P(K_d = j | 1)] = 2.677171e-7 (direct Poisson sums).
      source: CAPLAN,
      basis: "computed",
      inputs: { photons: 20, darkCount: 1 },
      expect: { berOok: 8.810336795e-9, ookThreshold: 11, berDpsk: 2.677170733e-7 },
      tolerance: 1e-6,
    },
  ],
});
