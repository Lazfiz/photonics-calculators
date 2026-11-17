// R3 batch1: Sellmeier data vs reference values
import { MATERIALS, SCHOTT_GLASSES } from "../../../../src/physics/materials/sellmeier-data";
import { UNIAXIAL_CRYSTALS, BBO_TAMOSAUSKAS } from "../../../../src/physics/materials/uniaxial-data";
import { BIAXIAL_CRYSTALS } from "../../../../src/physics/materials/biaxial-data";
import * as S from "../../../../src/physics/materials/sellmeier";

const n = (m: S.SellmeierModel, nm: number) => S.refractiveIndex(m, nm * 1e-9);
function row(label: string, mine: number, mod: number) {
  const d = mod - mine;
  console.log(`${label.padEnd(34)} ref=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} d=${d.toExponential(2)}${Math.abs(d) > 1e-4 * Math.abs(mine) && Math.abs(d) > 1e-4 ? "  <<<" : ""}`);
}
const M: any = MATERIALS, G: any = SCHOTT_GLASSES, U: any = UNIAXIAL_CRYSTALS, B: any = BIAXIAL_CRYSTALS;
row("FS n(587.56)", 1.45846, n(M.fusedSilica.model, 587.56));
row("FS n(1064)", 1.44963, n(M.fusedSilica.model, 1064));
row("FS n(1550)", 1.44402, n(M.fusedSilica.model, 1550));
row("N-BK7 nd", 1.5168, n(G["N-BK7"].model, 587.56));
row("N-BK7 Vd", 64.17, S.abbeNumber(G["N-BK7"].model));
row("N-BK7 n(1064)", 1.50663, n(G["N-BK7"].model, 1064));
row("N-SF11 nd", 1.78472, n(G["N-SF11"].model, 587.56));
row("N-SF11 Vd", 25.68, S.abbeNumber(G["N-SF11"].model));
for (const k of Object.keys(G)) row(`${k} nd/vd`, G[k].nd, n(G[k].model, 587.56)), row(`${k} Vd`, G[k].vd, S.abbeNumber(G[k].model));
row("CaF2 nd", 1.43385, n(M.caf2.model, 587.56));
row("Si n(1550)", 3.4777, n(M.si.model, 1550));
row("Ge n(10.6um)", 4.0032, n(M.ge.model, 10600));
row("ZnSe n(10.6um)", 2.4028, n(M.znse.model, 10600));
row("MgF2(iso) n(589)", 1.3777, n(M.mgf2.model, 589));
row("BaF2 n(589)", 1.4741, n(M.baf2.model, 589));
row("diamond n(589)", 2.4175, n(M.diamond.model, 589));
row("ZnS n(10.6)", 2.192, n(M.zns.model, 10600));
row("NaCl n(589)", 1.5443, n(M.nacl.model, 589));
row("KBr n(589)", 1.5598, n(M.kbr.model, 589));
row("CsI n(589)", 1.7873, n(M.csi.model, 589));
row("LiF n(589)", 1.3921, n(M.lif.model, 589));
row("KRS5 n(10um)", 2.37069, n(M.krs5.model, 10000));
const u = (id: string, nm: number) => [n(U[id].o, nm), n(U[id].e, nm)];
let [o, e] = u("sapphire", 589); row("sapphire no(589)", 1.7682, o); row("sapphire ne(589)", 1.7600, e);
[o, e] = u("mgf2", 589); row("MgF2 no(589)", 1.3777, o); row("MgF2 ne(589)", 1.3895, e);
[o, e] = u("calcite", 589); row("calcite no(589)", 1.6584, o); row("calcite ne(589)", 1.4864, e);
[o, e] = u("quartz", 589); row("quartz no(589)", 1.5443, o); row("quartz ne(589)", 1.5534, e);
[o, e] = u("yvo4", 1064); row("YVO4 no(1064)", 1.9573, o); row("YVO4 ne(1064)", 2.1652, e);
[o, e] = u("linbo3", 1064); row("LN no(1064)", 2.2322, o); row("LN ne(1064)", 2.1560, e);
[o, e] = u("bbo", 1064); row("BBO no(1064)", 1.6551, o); row("BBO ne(1064)", 1.5426, e);
[o, e] = u("kdp", 1064); row("KDP no(1064)", 1.4942, o); row("KDP ne(1064)", 1.4603, e);
[o, e] = u("rutile", 1064); row("rutile no(1064)", 2.4812, o); row("rutile ne(1064)", 2.7467, e);
row("BBO-T no(1064)", 1.6551, n(BBO_TAMOSAUSKAS.o, 1064)); row("BBO-T ne(1064)", 1.5426, n(BBO_TAMOSAUSKAS.e, 1064));
row("KTP nx(1064)", 1.7400, n(B.ktp.x, 1064)); row("KTP ny(1064)", 1.7469, n(B.ktp.y, 1064)); row("KTP nz(1064)", 1.8304, n(B.ktp.z, 1064));
// GVD fused silica
const gvd = (nm: number) => S.gvd(M.fusedSilica.model, nm * 1e-9) * 1e30 / 1e3; // fs^2/mm
row("FS GVD 800 fs2/mm", 36.16, gvd(800));
row("FS GVD 1550 fs2/mm", -27.97, gvd(1550));
row("FS ZDW um", 1.2727, S.zeroDispersionWavelengths(M.fusedSilica.model)[0] * 1e6);
row("FS ng(800)", 1.46712, S.groupIndex(M.fusedSilica.model, 800e-9));
// ranges & out-of-range behaviour
for (const k of Object.keys(M)) console.log(k, (M[k].model.range as number[]).map((x) => (x * 1e6).toFixed(3)).join("-"), "T=", M[k].temperature_C, "ref:", String(M[k].reference).slice(0, 70));
for (const k of Object.keys(U)) console.log(k, (U[k].o.range as number[]).map((x) => (x * 1e6).toFixed(3)).join("-"), String(U[k].reference).slice(0, 80));
console.log("N-BK7 n(200nm) out of range:", n(G["N-BK7"].model, 200), "Si n(1.0um):", n(M.si.model, 1000));
// Schott dn/dT N-BK7 abs at 633nm, 20C (TIE-19: ~ 1.6e-6 abs? relative 2.4e-6)
console.log("N-BK7 dn/dT_abs(633,20C)", S.schottDnDt(G["N-BK7"].model, G["N-BK7"].thermal, 633e-9, 20));
console.log("N-BK7 dn/dT_abs(1064,20C)", S.schottDnDt(G["N-BK7"].model, G["N-BK7"].thermal, 1064e-9, 20));
