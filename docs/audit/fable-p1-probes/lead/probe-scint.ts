// W1 check: scintillation page fade card (log-normal) against gamma-gamma for the same aperture-averaged sigma_I^2.
import * as T from "../../../../src/physics/free-space-comms/turbulence";
for (const [cn2, L, D] of [[1.7e-14, 1000, 0.1], [1.7e-13, 5000, 0.1], [1.7e-13, 5000, 0], [1.7e-13, 1000, 0.1], [1.7e-13, 1000, 0]] as const) {
  const lam = 1550e-9, s = T.rytovVariance(cn2, lam, L), si = T.scintillationIndex(s, lam, L, D);
  const d2 = D > 0 ? (2 * Math.PI / lam) * D * D / (4 * L) : 0;
  const { alpha, beta } = T.gammaGammaParameters(s, d2);
  console.log(`Cn2=${cn2} L=${L} D=${D} sR2=${s.toFixed(3)} sI2=${si.toFixed(4)} a=${alpha.toFixed(2)} b=${beta.toFixed(2)} 1/a+1/b+1/ab=${(1/alpha+1/beta+1/(alpha*beta)).toFixed(4)}`,
    "| -3dB LN", T.lognormalFadeProbability(10 ** -0.3, si).toExponential(2), "GG", T.gammaGammaCdf(10 ** -0.3, alpha, beta).toExponential(2),
    "| -10dB LN", T.lognormalFadeProbability(0.1, si).toExponential(2), "GG", T.gammaGammaCdf(0.1, alpha, beta).toExponential(2));
}
