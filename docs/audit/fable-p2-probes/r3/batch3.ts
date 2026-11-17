// R3 batch3: x-ray-optics, acousto-optic, brillouin, raman, heat-capacity, thermal-conductivity, thermal-expansion
import * as XR from "../../../../src/physics/materials/x-ray-optics";
import * as AO from "../../../../src/physics/materials/acousto-optic";
import * as BR from "../../../../src/physics/materials/brillouin";
import * as RG from "../../../../src/physics/materials/raman-gain";
import * as HC from "../../../../src/physics/materials/heat-capacity";
import * as TC from "../../../../src/physics/materials/thermal-conduction";
import * as TE from "../../../../src/physics/materials/thermal-expansion";
const p = (s: string, mine: number, mod: number) =>
  console.log(`${s.padEnd(40)} mine=${mine.toPrecision(5)} mod=${mod.toPrecision(5)} ratio=${(mod / mine).toFixed(4)}`);
const X = (id: XR.XRayMaterialId, E: number) => XR.xrayIndex(XR.XRAY_MATERIALS[id].formula, XR.XRAY_MATERIALS[id].rho_gcc * 1000, E);
let r = X("Si", 8048);
p("Si 8.048keV delta (CXRO 7.58e-6)", 7.58e-6, r.delta);
p("Si 8.048keV att length um (CXRO ~70)", 70, r.attenuationLength * 1e6);
p("Si 8.048 thetaC mrad (3.89)", Math.sqrt(2 * 7.58e-6) * 1e3, r.thetaC * 1e3);
r = X("Si", 1000); p("Si 1keV att um (NIST mu/rho 1570 -> 2.73)", 1 / (1570 * 2.33) * 1e4, r.attenuationLength * 1e6);
r = X("Cu", 8048); p("Cu 8.048 att um (NIST 52.55 cm2/g -> 21.2)", 1 / (52.55 * 8.96) * 1e4, r.attenuationLength * 1e6);
p("Cu 8.048 delta (CXRO 2.44e-5)", 2.44e-5, r.delta);
r = X("Au", 10000); p("Au 10keV att um (NIST mu/rho 118 -> 4.39)", 1 / (118 * 19.32) * 1e4, r.attenuationLength * 1e6);
console.log("Si 0.9keV:", X("Si", 900).delta, " 31keV:", X("Si", 31000).delta);
// AO: TeO2 shear, 633 nm, 80 MHz
const te = AO.ACOUSTO_OPTIC["teo2-shear"];
p("TeO2 Bragg mrad (633nm,80MHz) out", Math.asin(633e-9 * 80e6 / (2 * 617)) * 1e3, AO.braggAngle(633e-9, 80e6, 617) * 1e3);
p("FS AO Bragg outside 1064 80MHz mrad", Math.asin(1064e-9 * 80e6 / (2 * 5960)) * 1e3, AO.braggAngle(1064e-9, 80e6, 5960) * 1e3);
p("TeO2 P100 (L=H=1mm? use L 10mm H 1mm) W", (633e-9) ** 2 * 1e-3 / (2 * 793e-15 * 1e-2), AO.fullEfficiencyPower(633e-9, te.M2, 1e-2, 1e-3));
// M2 for silica from n^6 p^2/(rho v^3): n 1.457 p12 0.27(?) -> check vendor
p("silica M2 from n6p2/rho v3 p=0.27", 1.457 ** 6 * 0.27 ** 2 / (2200 * 5960 ** 3), AO.ACOUSTO_OPTIC.silica.M2);
p("LiNbO3 Q (633,1cm? 80MHz) ", 2 * Math.PI * 633e-9 * 0.01 * 80e6 ** 2 / (2.29 * 6570 ** 2), AO.kleinCookQ(633e-9, 0.01, 80e6, 2.29, 6570));
// Brillouin
const fs = BR.FUSED_SILICA_BRILLOUIN;
console.log("FS n vA", fs.n, fs.vA);
p("FS nuB 1550 GHz (11.1)", 2 * fs.n * fs.vA / 1550e-9 / 1e9, 2 * fs.n * fs.vA / 1550e-9 / 1e9);
p("FS gB 1550, 20MHz (Agrawal ~5e-11?)", 2 * Math.PI * fs.n ** 7 * 0.286 ** 2 / (299792458 * 1550e-9 ** 2 * 2210 * fs.vA * 20e6), BR.brillouinGain(1550e-9, fs, 20e6));
const d = BR.BRILLOUIN_MEDIA.diamond;
p("diamond p", 0.06, d.p12);
p("diamond nuB 532 (meas 167 GHz)", 167, 2 * d.n * d.vA / 532e-9 / 1e9);
const a = BR.BRILLOUIN_MEDIA.as2se3;
p("As2Se3 gB calc vs meas 6e-9", 6.0e-9, BR.brillouinGain(1.56e-6, a, 13.2e6));
p("As2Se3 nuB (7.95)", 7.95, 2 * a.n * a.vA / 1.56e-6 / 1e9);
// Raman
p("silica g at 1550 (1e-13*1/1.55)", 1e-13 / 1.55, RG.ramanGainAtPump(RG.RAMAN_LINES["fused-silica"], 1550e-9).g);
p("diamond g 1064 cm/GW", 17, RG.ramanGainAtPump(RG.RAMAN_LINES.diamond, 1064e-9).g / 1e-11);
p("diamond g 900 interp cm/GW", 26 + (1 / 900 - 1 / 800) / (1 / 1064 - 1 / 800) * (17 - 26), RG.ramanGainAtPump(RG.RAMAN_LINES.diamond, 900e-9).g / 1e-11);
p("silica shift cm-1 (440)", 440, RG.RAMAN_LINES["fused-silica"].shift / 100);
// heat capacity
const si = HC.HEAT_CAPACITY_MATERIALS.si;
p("Si cp 200K (Desai ~557)", 557, HC.scaledHeatCapacity(si.cRef, si.tRef, si.thetaD, 200));
p("Si cp 100K (Desai ~259)", 259, HC.scaledHeatCapacity(si.cRef, si.tRef, si.thetaD, 100));
p("Debye C(T>>) = 3R", 3 * 8.314462618, HC.debyeMolarHeatCapacity(100, 1e5));
p("Debye low-T 12pi^4/5 R (T/th)^3 th=645,T=5", 12 * Math.PI ** 4 / 5 * 8.314462618 * (5 / 645) ** 3, HC.debyeMolarHeatCapacity(645, 5));
p("diamond cp 300", 6.1197 / 12.011e-3 * 1, HC.scaledHeatCapacity(HC.HEAT_CAPACITY_MATERIALS.diamond.cRef, 298.15, 1860, 298.15));
// thermal
p("cyl rise P1W k1.38 L1cm", 1 / (4 * Math.PI * 1.38 * 0.01), TC.cylinderCentreRise(1, 1.38, 0.01));
p("thermal lens f m 1W k1.38 A pi(1mm)^2 dndT 1e-5", 2 * 1.38 * Math.PI * 1e-6 / (1 * 1e-5), TC.rodThermalLens(1, 1.38, Math.PI * 1e-6, 1e-5));
p("Si alpha 300K (Okada 2.568e-6)", 2.568e-6, TE.siliconAlpha(300));
console.log("Si alpha 100K:", TE.siliconAlpha(100), "2000K:", TE.siliconAlpha(2000));
for (const m of TE.CTE_TABLE) console.log("CTE", (m as any).name ?? (m as any).id, (m as any).alpha);
