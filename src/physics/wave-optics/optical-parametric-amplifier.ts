/**
 * Optical parametric amplifier with an undepleted Gaussian pump: the OPA page's chain in one place (idler wavelength,
 * on-axis pump intensity, gain coefficient, gain with phase mismatch, signal/idler/pump powers, low-gain bandwidth,
 * QPM period). Kept out of three-wave.ts so the other three-wave pages don't load kerr.ts. Reference: Boyd R. W.,
 * Nonlinear Optics, 3rd ed. (2008), §2.8.
 */
import { gainBandwidth, idlerPower, parametricGain } from "./three-wave";
import { idlerWavelength, parametricGainCoefficient, phaseMismatch, qpmPeriod } from "./optical-parametric-oscillator";
import { gaussianPeakIntensity } from "./kerr";
import { wavelengthWidth } from "../spectroscopy/wavenumber";

export interface OpaInput {
  lambdaPump: number;
  lambdaSignal: number;
  /** m/V */
  dEff: number;
  nPump: number;
  nSignal: number;
  nIdler: number;
  /** Pump peak power, W, and 1/e² radius, m (Gaussian pump, on-axis intensity 2P/(πw²)). */
  pumpPower: number;
  radius: number;
  /** Signal seed peak power, W. */
  seedPower: number;
  /** Residual Δk at λ_s, 1/m. */
  deltaK: number;
  /** δ_si = 1/v_gs − 1/v_gi, s/m. */
  gvm: number;
  /** Crystal length, m. */
  length: number;
}

export interface OpaResult {
  lambdaIdler: number;
  /** On-axis pump intensity, W/m². */
  peakIntensity: number;
  /** Γ, 1/m. */
  gamma: number;
  gain: number;
  signalOut: number;
  idlerOut: number;
  /** Pump power drawn, (G − 1)P_s λ_s/λ_p, W. */
  pumpDrawn: number;
  /** FWHM gain bandwidth, Hz, and its width in signal wavelength, m. */
  bandwidth: number;
  bandwidthWavelength: number;
  /** First-order QPM period for the entered indices, m. */
  qpmPeriod: number;
}

/** The OPA page's results in SI (Boyd §2.8; Cerullo & De Silvestri 2003 for the bandwidth). */
export function opaModel(p: OpaInput): OpaResult {
  const process = { lambdaPump: p.lambdaPump, lambdaSignal: p.lambdaSignal, dEff: p.dEff, nPump: p.nPump, nSignal: p.nSignal, nIdler: p.nIdler };
  const lambdaI = idlerWavelength(p.lambdaPump, p.lambdaSignal);
  const I0 = gaussianPeakIntensity(p.pumpPower, p.radius);
  const gamma = parametricGainCoefficient(process, I0);
  const G = parametricGain(gamma, p.deltaK, p.length);
  const bandwidth = gainBandwidth(gamma, p.length, p.gvm);
  return {
    lambdaIdler: lambdaI,
    peakIntensity: I0,
    gamma,
    gain: G,
    signalOut: G * p.seedPower,
    idlerOut: idlerPower(G, p.seedPower, p.lambdaSignal, lambdaI),
    pumpDrawn: (G - 1) * p.seedPower * (p.lambdaSignal / p.lambdaPump),
    bandwidth,
    bandwidthWavelength: wavelengthWidth(p.lambdaSignal, bandwidth),
    qpmPeriod: qpmPeriod(phaseMismatch(process)),
  };
}
