import { UNIAXIAL_CRYSTALS as U } from "../../../../src/physics/materials/uniaxial-data";
import { refractiveIndex as n } from "../../../../src/physics/materials/sellmeier";
for (const l of [0.6, 0.8, 1.0, 1.4]) console.log("rutile", l, n(U.rutile.o, l * 1e-6).toFixed(5), n(U.rutile.e, l * 1e-6).toFixed(5));
