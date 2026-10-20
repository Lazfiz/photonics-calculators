/**
 * Near-infrared spectroscopy: anharmonic overtone positions, and haemoglobin changes from the modified Beer–Lambert
 * law. SI units (m, mol/m³, m²/mol); wavenumbers in cm⁻¹ as published.
 *
 * Overtones (model tier: textbook approximation). A Morse oscillator has terms G(v) = ω_e(v + ½) − ω_e x_e(v + ½)²,
 * so the 0 → v band sits at
 *   ν̃(0→v) = v ω_e − ω_e x_e v(v + 1),
 * the levels end at v_max = ⌊ω_e/(2ω_e x_e) − ½⌋ and the well depth is D_e = ω_e²/(4ω_e x_e) (C. N. Banwell,
 * E. M. McCash, Fundamentals of Molecular Spectroscopy, 4th ed., McGraw-Hill 1994, ch. 3). Real potentials are not
 * Morse: D_e is an overestimate and high overtones drift (H³⁵Cl: 0→4 computed 10 907 cm⁻¹, observed 10 923).
 *
 * Modified Beer–Lambert law (model tier: textbook approximation). In scattering tissue a change of absorber
 * concentrations Δc changes the optical density at source–detector distance d by
 *   ΔOD(λ) = Σ ε_i(λ) Δc_i · d · DPF(λ)
 * (D. T. Delpy et al., Phys. Med. Biol. 33, 1433 (1988), doi:10.1088/0031-9155/33/12/008), with decadic molar
 * extinction ε and the differential pathlength factor DPF. Two wavelengths give Δ[HbO₂] and Δ[HbR] from a 2 × 2
 * system. It assumes homogeneous changes and a DPF that does not change; the result is an average over the
 * sampled volume, not the cortical change.
 *
 * DPF of the adult frontal head (F. Scholkmann, M. Wolf, J. Biomed. Opt. 18, 105004 (2013),
 * doi:10.1117/1.JBO.18.10.105004), for age A in years and λ in nm, recommended for 0–70 years and 690–832 nm:
 *   DPF = 223.3 + 0.05624 A^0.8493 − 5.723e-7 λ³ + 0.001245 λ² − 0.9025 λ.
 *
 * Haemoglobin extinction: S. Prahl's compilation of W. B. Gratzer and N. Kollias, omlc.org/spectra/hemoglobin
 * (cm⁻¹/M, decadic), 650–1000 nm in 2 nm steps; linear between nodes.
 */

const HB_START_NM = 650;
const HB_STEP_NM = 2;
/** [ε(HbO₂), ε(HbR)] in cm⁻¹/M from 650 nm in 2 nm steps (Prahl). */
const HB = [
  368, 3750.12, 356.8, 3642.64, 345.6, 3535.16, 335.2, 3427.68, 325.6, 3320.2, 319.6, 3226.56, 314, 3140.28, 308.4, 3053.96,
  302.8, 2967.68, 298, 2881.4, 294, 2795.12, 290, 2708.84, 285.6, 2627.64, 282, 2554.4, 279.2, 2481.16, 277.6, 2407.92,
  276, 2334.68, 274.4, 2261.48, 272.8, 2188.24, 274.4, 2115, 276, 2051.96, 277.6, 2000.48, 279.2, 1949.04, 282, 1897.56,
  286, 1846.08, 290, 1794.28, 294, 1741, 298, 1687.76, 302.8, 1634.48, 308.4, 1583.52, 314, 1540.48, 319.6, 1497.4,
  325.2, 1454.36, 332, 1411.32, 340, 1368.28, 348, 1325.88, 356, 1285.16, 364, 1244.44, 372.4, 1203.68, 381.2, 1152.8,
  390, 1102.2, 398.8, 1102.2, 407.6, 1102.2, 418.8, 1101.76, 432.4, 1100.48, 446, 1115.88, 459.6, 1161.64, 473.2, 1207.4,
  487.6, 1266.04, 502.8, 1333.24, 518, 1405.24, 533.2, 1515.32, 548.4, 1541.76, 562, 1560.48, 574, 1560.48, 586, 1548.52,
  598, 1508.44, 610, 1459.56, 622.8, 1410.52, 636.4, 1361.32, 650, 1311.88, 663.6, 1262.44, 677.2, 1213, 689.2, 1163.56,
  699.6, 1114.8, 710, 1075.44, 720.4, 1036.08, 730.8, 996.72, 740, 957.36, 748, 921.8, 756, 890.8, 764, 859.8,
  772, 828.8, 786.4, 802.96, 807.2, 782.36, 816, 761.72, 828, 743.84, 836, 737.08, 844, 730.28, 856, 723.52,
  864, 717.08, 872, 711.84, 880, 706.6, 887.2, 701.32, 901.6, 696.08, 916, 693.76, 930.4, 693.6, 944.8, 693.48,
  956.4, 693.32, 965.2, 693.2, 974, 693.04, 982.8, 692.92, 991.6, 692.76, 1001.2, 692.64, 1011.6, 692.48, 1022, 692.36,
  1032.4, 692.2, 1042.8, 691.96, 1050, 691.76, 1054, 691.52, 1058, 691.32, 1062, 691.08, 1066, 690.88, 1072.8, 690.64,
  1082.4, 692.44, 1092, 694.32, 1101.6, 696.2, 1111.2, 698.04, 1118.4, 699.92, 1123.2, 701.8, 1128, 705.84, 1132.8, 709.96,
  1137.6, 714.08, 1142.8, 718.2, 1148.4, 722.32, 1154, 726.44, 1159.6, 729.84, 1165.2, 733.2, 1170, 736.6, 1174, 739.96,
  1178, 743.6, 1182, 747.24, 1186, 750.88, 1190, 754.52, 1194, 758.16, 1198, 761.84, 1202, 765.04, 1206, 767.44,
  1209.2, 769.8, 1211.6, 772.16, 1214, 774.56, 1216.4, 776.92, 1218.8, 778.4, 1220.8, 778.04, 1222.4, 777.72, 1224, 777.36,
  1225.6, 777.04, 1227.2, 776.64, 1226.8, 772.36, 1224.4, 768.08, 1222, 763.84, 1219.6, 752.28, 1217.2, 737.56, 1215.6, 722.88,
  1214.8, 708.16, 1214, 693.44, 1213.2, 678.72, 1212.4, 660.52, 1210.4, 641.08, 1207.2, 621.64, 1204, 602.24, 1200.8, 583.4,
  1197.6, 568.92, 1194, 554.48, 1190, 540.04, 1186, 525.56, 1182, 511.12, 1178, 495.36, 1173.2, 473.32, 1167.6, 451.32,
  1162, 429.32, 1156.4, 415.28, 1150.8, 402.28, 1144, 389.288, 1136, 374.944, 1128, 359.656, 1120, 344.372, 1112, 329.084,
  1102.4, 313.796, 1091.2, 298.508, 1080, 283.22, 1068.8, 267.932, 1057.6, 252.648, 1046.4, 237.36, 1035.2, 222.072, 1024, 206.784,
];

/** Haemoglobin table range in m. */
export const HB_LAMBDA_MIN = HB_START_NM * 1e-9;
export const HB_LAMBDA_MAX = (HB_START_NM + HB_STEP_NM * (HB.length / 2 - 1)) * 1e-9;

/** 1 cm⁻¹/M = 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol. */
const CM_PER_M_TO_SI = 0.1;

/** Decadic molar extinction of oxy- and deoxyhaemoglobin at λ (m), m²/mol; NaN outside 650–1000 nm. */
export function hbExtinction(lambda: number): { hbo2: number; hbr: number } {
  const x = (lambda * 1e9 - HB_START_NM) / HB_STEP_NM;
  const last = HB.length / 2 - 1;
  if (!(x >= -1e-9 && x <= last + 1e-9)) return { hbo2: NaN, hbr: NaN };
  const i = Math.min(Math.max(Math.floor(x), 0), last - 1);
  const f = Math.min(Math.max(x - i, 0), 1);
  const at = (j: number) => HB[2 * i + j] + f * (HB[2 * i + 2 + j] - HB[2 * i + j]);
  return { hbo2: at(0) * CM_PER_M_TO_SI, hbr: at(1) * CM_PER_M_TO_SI };
}

/** Scholkmann–Wolf DPF of the frontal head for age (years) at λ (m); NaN outside 0–70 years or 690–832 nm. */
export function dpfFrontalHead(ageYears: number, lambda: number): number {
  const nm = lambda * 1e9;
  if (!(ageYears >= 0 && ageYears <= 70 && nm >= 690 - 1e-9 && nm <= 832 + 1e-9)) return NaN;
  return 223.3 + 0.05624 * ageYears ** 0.8493 - 5.723e-7 * nm ** 3 + 0.001245 * nm ** 2 - 0.9025 * nm;
}

/**
 * Δ[HbO₂] and Δ[HbR] (mol/m³) from optical-density changes at two wavelengths, source–detector distance d (m) and
 * the DPF at each wavelength. NaN when the two wavelengths give a singular system.
 */
export function mbllHaemoglobin(
  lambda1: number,
  lambda2: number,
  dOD1: number,
  dOD2: number,
  d: number,
  dpf1: number,
  dpf2: number,
): { hbo2: number; hbr: number } {
  const e1 = hbExtinction(lambda1);
  const e2 = hbExtinction(lambda2);
  const b1 = dOD1 / (d * dpf1);
  const b2 = dOD2 / (d * dpf2);
  const det = e1.hbo2 * e2.hbr - e1.hbr * e2.hbo2;
  // Cramer's rule; a determinant below 1e-6 of the product of the entries is treated as singular
  if (!(d > 0 && dpf1 > 0 && dpf2 > 0) || !(Math.abs(det) > 1e-6 * Math.abs(e1.hbo2 * e2.hbr))) {
    return { hbo2: NaN, hbr: NaN };
  }
  return { hbo2: (b1 * e2.hbr - e1.hbr * b2) / det, hbr: (e1.hbo2 * b2 - b1 * e2.hbo2) / det };
}

/** Morse 0 → v band position v ω_e − ω_e x_e v(v + 1), same unit as ω_e. */
export function morseTransition(omegaE: number, omegaExe: number, v: number): number {
  return v * omegaE - omegaExe * v * (v + 1);
}

/** Highest bound Morse level ⌊ω_e/(2ω_e x_e) − ½⌋; NaN unless 0 < ω_e x_e < ω_e/2. */
export function morseMaxLevel(omegaE: number, omegaExe: number): number {
  return omegaE > 0 && omegaExe > 0 && omegaExe < omegaE / 2 ? Math.floor(omegaE / (2 * omegaExe) - 0.5) : NaN;
}

/** Morse well depth D_e = ω_e²/(4ω_e x_e), same unit as ω_e. */
export function morseWellDepth(omegaE: number, omegaExe: number): number {
  return omegaE > 0 && omegaExe > 0 ? (omegaE * omegaE) / (4 * omegaExe) : NaN;
}

/** Indices of the strict local maxima of ys (interior points only). */
export function localMaxima(ys: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1]) out.push(i);
  return out;
}
