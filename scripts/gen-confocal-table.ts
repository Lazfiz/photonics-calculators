/**
 * Prints CONFOCAL_FWHM_TABLE for src/physics/imaging/confocal.ts: the confocal FWHM coefficients at 0, 0.1, …, 5 AU
 * (≈ 1–2 s per row). Usage: npx tsx scripts/gen-confocal-table.ts
 */
import { confocalFwhmCoefficients, CONFOCAL_MAX_PINHOLE_AU } from "../src/physics/imaging/confocal";

const rows: string[] = [];
for (let i = 0; i <= CONFOCAL_MAX_PINHOLE_AU * 10; i++) {
  const P = i / 10;
  const c = confocalFwhmCoefficients(P);
  rows.push(`  [${P.toFixed(1)}, ${c.lateral.toFixed(5)}, ${c.axial.toFixed(5)}, ${c.section.toFixed(5)}],`);
}
console.log(rows.join("\n"));
