import * as K from "../../../../src/physics/constants";
const pr = (n: string, v: number, ref: number) => console.log(n, v.toPrecision(12), ref, ((v - ref) / ref).toExponential(2));
pr("hbar", K.hbar, 1.054571817e-34); pr("sigma", K.sigma_SB, 5.670374419e-8); pr("b", K.b_Wien, 2.897771955e-3);
pr("c1", K.c1_radiation, 3.741771852e-16); pr("c2", K.c2_radiation, 1.438776877e-2); pr("hc_eV_nm", K.hc_eV_nm, 1239.84198);
pr("R", K.R_gas, 8.314462618); pr("F", K.F_faraday, 96485.33212); pr("kB_eV", K.k_B_eV, 8.617333262e-5);
pr("eps0 vs 1/(mu0 c2)", K.epsilon_0, 1 / (K.mu_0 * K.c ** 2)); pr("Z0 vs mu0 c", K.Z_0, K.mu_0 * K.c);
pr("mu0 vs 2αh/(e²c)", K.mu_0, 2 * K.alpha * K.h / (K.q ** 2 * K.c));
pr("a0 vs ħ/(m_e c α)", K.a_0, K.hbar / (K.m_e * K.c * K.alpha)); pr("r_e vs α² a0", K.r_e, K.alpha ** 2 * K.a_0);
pr("TORR", K.TORR, 133.322368);
