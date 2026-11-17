// PR #293 verification probe: prints searchTerms(query) (synonym/plural alternatives) for a few queries.
// Run on BOTH trees (main checkout and a worktree of feat/fable-upgrades), from the tree root:
//   npx tsx docs/audit/fable-verify-probes/pr293/terms-probe.ts
import { searchTerms } from "../../../../src/lib/site-search";
for (const q of ["anti-reflection coating", "optical glasses", "glasses", "focused spot size", "fabry perot etalon",
  "optical goggles", "laser goggles OD", "optical density glasses", "optics", "physics", "series", "bases", "phases",
  "matrices", "status", "lenses", "axes", "gases", "wave plates", "quarter wave plate", "half wave plates", "beam waist after a lens",
  "ar coating", "antireflection coatings", "numerical aperture lens", "optical fiber", "optical power meter", "eye safety glasses"]) {
  console.log(q, "=>", JSON.stringify(searchTerms(q)));
}
