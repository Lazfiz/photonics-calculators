// R3 batch5: infrared-glass, chromatic-dispersion extras, optical-glass dn/dT
import { MATERIALS, SCHOTT_GLASSES } from "../../../../src/physics/materials/sellmeier-data";
import * as S from "../../../../src/physics/materials/sellmeier";
const p = (s: string, mine: number, mod: number) =>
  console.log(`${s.padEnd(42)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(4)}`);
const M: any = MATERIALS;
p("AMTIR-1 n(10um) (AMI 2.4981)", 2.4981, S.refractiveIndex(M.amtir1.model, 10e-6));
p("AMTIR-1 n(3um) (AMI 2.5129)", 2.5129, S.refractiveIndex(M.amtir1.model, 3e-6));
p("As2S3 n(1um) (Rodney ~2.4777)", 2.4777, S.refractiveIndex(M.as2s3.model, 1e-6));
p("As2S3 n(5um) (Rodney ~2.4112)", 2.4112, S.refractiveIndex(M.as2s3.model, 5e-6));
p("ZBLAN nd (Gan 1.5011 stated)", 1.5011, S.refractiveIndex(M.zblan.model, 587.56e-9));
p("FS D 1550 ps/nm/km (+21.9)", 21.9, S.dispersionParameter(M.fusedSilica.model, 1550e-9) * 1e6);
p("FS Abbe (67.8)", 67.82, S.abbeNumber(M.fusedSilica.model));
p("FS GVD 400nm fs2/mm (97.6)", 97.6, S.gvd(M.fusedSilica.model, 400e-9) * 1e27);
p("Si GVD 1550 fs2/mm (~1100)", 1100, S.gvd(M.si.model, 1550e-9) * 1e27);
p("CaF2 GVD 800 fs2/mm (27.7)", 27.7, S.gvd(M.caf2.model, 800e-9) * 1e27);
console.log("ZDW CaF2 um", S.zeroDispersionWavelengths(M.caf2.model).map((x) => (x * 1e6).toFixed(3)), "Si:", S.zeroDispersionWavelengths(M.si.model).map((x) => x * 1e6));
const G: any = SCHOTT_GLASSES;
// Schott TIE-19 absolute dn/dT N-BK7: catalogue table (abs, 1060 nm, +20/+40 C) 0.9e-6? (rel 2.4); compute mean 20-40 via deltaN
p("N-BK7 dn/dT_abs 1064 mean 20..40C (SCHOTT ~1.1e-6)", 1.1e-6, S.schottDeltaN(G["N-BK7"].model, G["N-BK7"].thermal, 1064e-9, 40) / 20);
p("N-BK7 dn/dT_abs 633 mean 20..40C (SCHOTT ~1.6e-6)", 1.6e-6, S.schottDeltaN(G["N-BK7"].model, G["N-BK7"].thermal, 632.8e-9, 40) / 20);
p("N-SF11 dn/dT_abs 633 mean 20..40 (SCHOTT ~0.5e-6?)", 0.5e-6, S.schottDeltaN(G["N-SF11"].model, G["N-SF11"].thermal, 632.8e-9, 40) / 20);
