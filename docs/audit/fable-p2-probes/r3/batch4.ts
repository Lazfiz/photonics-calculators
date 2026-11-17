// R3 batch4: polymer-optics, transparency-range/infrared-glass (window Fresnel), color-centers, radiation-damage,
// photorefractive, photoelastic, crystal-properties consistency
import * as PO from "../../../../src/physics/materials/polymer-optics";
import * as WM from "../../../../src/physics/materials/window-materials";
import * as CC from "../../../../src/physics/materials/color-centers";
import * as RIL from "../../../../src/physics/materials/radiation-induced-loss";
import * as PK from "../../../../src/physics/materials/pockels";
import * as SO from "../../../../src/physics/materials/stress-optic";
import { refractiveIndex } from "../../../../src/physics/materials/sellmeier";
const p = (s: string, mine: number, mod: number) =>
  console.log(`${s.padEnd(42)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(4)}`);
const P: any = PO.POLYMERS;
p("PMMA n(587.6) (1.4918)", 1.4918, PO.polymerIndex(P.pmma.dispersion, 587.6e-9));
p("PMMA n(1550) (~1.4806)", 1.4806, PO.polymerIndex(P.pmma.dispersion, 1550e-9));
p("PC n(587.6) (1.5855)", 1.5855, PO.polymerIndex(P.pc.dispersion, 587.6e-9));
p("PS n(587.6) (1.5905)", 1.5905, PO.polymerIndex(P.ps.dispersion, 587.6e-9));
for (const k of Object.keys(P)) console.log("polymer", k, PO.polymerIndex(P[k].dispersion, 589e-9).toFixed(5), "out-of-range 2.5um:", PO.polymerIndex(P[k].dispersion, 2.5e-6));
// window Fresnel T = 2n/(n^2+1)
const ge = WM.WINDOW_MATERIALS.ge;
const nGe = refractiveIndex((ge.dispersion as any).model, 10.6e-6);
p("Ge window T 10.6um 2n/(n2+1) (0.4710)", 2 * 4.0036 / (4.0036 ** 2 + 1), 2 * nGe / (nGe ** 2 + 1));
console.log("WM exports:", Object.keys(WM).join(","));
// color centers
const nv = CC.COLOR_CENTERS.nv;
p("NV ZPL nm (637.2)", 637.2, nv.zpl * 1e9);
const s = CC.stokesShift(nv.absorptionPeak, nv.emissionPeak);
p("NV Stokes eV (0.42)", 0.42, s.energyEv);
// RIL
p("RIL A1=1 dB/m/Gy,f=0.5, D=100Gy", 10, RIL.inducedAttenuation(1, 0.5, 100));
p("RIL dose for 3dB L=10m", (3 / 10) ** 2, RIL.doseForLoss(1, 0.5, 10, 3));
// photorefractive: LN, 532 nm, full angle 30deg in air? use API
const kB = 1.380649e-23, q = 1.602176634e-19, eps0 = 8.8541878128e-12;
const Lam = 1e-6, K = 2 * Math.PI / Lam, T = 293;
const ED = kB * T * K / q;
console.log("E_D(1um,293K) V/m =", ED.toExponential(4), "(expect 1.59e5)");
const lb = PK.balancedGratingPeriod as any;
console.log("balancedGratingPeriod sig:", lb.length, "photorefractiveGrating sig:", (PK.photorefractiveGrating as any).length);
// eps=28 (LN eps33), Neff 1e22
const eps = 28, N = 1e22;
p("Lambda where E_D=E_q (eps28,N1e22) um", 2 * Math.PI * Math.sqrt(eps0 * eps * kB * T / (q * q * N)) * 1e6, lb(N, eps, T) * 1e6);
p("2-beam gain beta=100 GL=2", (1 + 100) / (1 + 100 * Math.exp(-2)), PK.twoBeamSignalGain(2, 100));
// stress optic
p("N-BK7 C (2.77e-12)", 2.77e-12, SO.STRESS_OPTIC["n-bk7"].C);
