// PR #293 verification probe: search behaviour, top-5 per query.
// Run on BOTH trees (main checkout and a worktree of feat/fable-upgrades), from the tree root, then diff the outputs:
//   npx tsx docs/audit/fable-verify-probes/pr293/search-probe.ts > out.txt
// Uses only exports that exist on both trees (search, buildSearchIndex).
import { readFileSync } from "node:fs";
import { buildSearchIndex } from "../../../../src/registry/search";
import { search } from "../../../../src/lib/site-search";

const golden = [...readFileSync("tests/search-golden.test.ts", "utf8").matchAll(/^\s+\["([^"]+)", \[([^\]]+)\]\],/gm)]
  .map((m) => [m[1], m[2].replace(/"/g, "").split(/,\s*/)] as [string, string[]]);

// Golden cases added by the PR are probed on both trees (main's test file lacks them).
const prGolden: [string, string[]][] = [
  ["optical glasses", ["materials/optical-glass-catalog"]], ["gausian beam", ["wave-optics/gaussian-beam"]],
  ["brewstr angle", ["polarization/brewster-polarizer"]], ["fiber atenuation", ["fiber-optics/attenuation"]],
  ["depht of field", ["imaging/dof"]], ["rayliegh range", ["wave-optics/gaussian-beam"]],
];
for (const g of prGolden) if (!golden.some(([q]) => q === g[0])) golden.push(g);

const extra = [
  // plurals
  "lens", "lenses", "gauss", "focus", "bias", "glass", "glasses", "axis", "axes", "prisms", "prism", "mirrors", "mirror",
  "losses", "loss", "gratings", "grating", "fibres", "fibers", "fiber", "matrices", "matrix", "radii", "wave plates",
  "wave plate", "status", "chromatic aberrations", "chromatic aberration", "optics", "optic", "physics", "series", "corpus",
  "gases", "gas", "phases", "phase", "pulses", "pulse", "lasers", "laser", "modes", "mode", "detectors", "coatings",
  "waves", "wave", "boxes", "analysis", "stokes", "pockels", "glasses OD", "safety glasses", "laser glasses",
  "optical glass", "optical density glasses", "coupling losses", "splice losses", "bend losses", "thin lenses",
  "dichroic mirrors", "diffraction gratings", "photodiodes", "abbes", "fresnel zones", "zernike polynomials",
  "bases", "classes", "class", "indices", "indexes", "watts", "amplifiers", "resonators", "etalons", "beams",
  // synonym double counting
  "focused spot size", "fabry perot etalon", "optical density", "optical power", "optical fiber", "spot size lens",
  "beam waist", "beam divergence", "link budget fiber", "noise photodiode", "quarter wave", "half wave plate",
  "laser safety glasses", "glasses optical", "eyewear", "goggles", "optical goggles",
  // typos
  "gausian", "gaussain", "guassian beam", "brewstr", "atenuation", "attenuaton", "depht", "rayliegh", "rayleih",
  "interferometr", "michelsn interferometer", "polarisaton", "polarizaton", "difraction", "diffracton grating",
  "refractve index", "blakbody", "blackbdy", "photodide", "phtodiode noise", "dispersoin", "wavelenght", "wavelegnth",
  "apeture", "numerical apeture", "fresnl", "sellmier", "selmeier", "etalon finese", "finess", "birefringance",
  "scintilation", "turbulance", "colimation", "collimator", "resonater", "ampilfier", "mpa", "mpe", "nodh", "nohd",
  "od", "odtr", "otdr", "ael", "ale",
  // real words that must not be corrected
  "bean", "beam", "fibre", "gain", "grin", "mode", "node", "lens", "lend", "ring", "rung", "laser", "later", "nm", "um",
  "bean waist", "later safety", "lend maker", "node field diameter", "rung cavity", "grin lens", "gain medium",
  "wave", "wake", "noise", "nose", "pulse", "purse", "power", "tower", "tower budget", "link", "sink", "heat sink",
  "band", "bend", "bond", "bind", "bandgap", "bandage", "phase", "phrase", "phase matching", "phrase matching",
  "angel", "brewster angel", "filed", "depth of filed", "form", "from", "dose", "lase", "case", "coat", "cost",
  "time", "tame", "line", "lime", "linewidth", "limewidth", "color", "colon", "glass", "class", "grass", "mirror", "minor",
  "ratio", "radio", "radius", "peak", "leak", "peek", "speed", "speech", "light", "night", "right", "sight", "fight",
  "cavity", "gravity", "density", "destiny", "crystal", "crustal", "thermal", "thermos", "kerr", "kern", "mie", "mia",
  "bragg", "brag", "brags", "snell", "smell", "shell", "airy", "fairy", "hairy", "abbe", "abbey", "zoom", "room",
  "dark", "park", "dark current", "park current", "shot", "shoe", "shot noise", "shop noise", "banana", "quantum",
  "pizza", "house", "mouse", "horse", "tiger", "paris", "london", "money", "price", "prices", "cheap", "login",
  "password", "weather", "football", "recipe", "python", "java", "hello", "test", "tests", "help", "home", "about",
  // nonsense
  "asdfgh", "xyzzy quantum banana", "qwertyuiop", "zzzz", "aaaa", "abcd", "lorem ipsum dolor", "xyzzy", "laser xyzzy",
  "gaussian xyzzy", "foo bar baz",
];

const index = buildSearchIndex();
const seen = new Set<string>();
for (const [query, expected] of [...golden, ...extra.map((q) => [q, null] as [string, null])]) {
  if (seen.has(query)) continue;
  seen.add(query);
  const { results, closest } = search(index, query, 400);
  const hrefs = results.map((r) => r.href.slice(1));
  let line = `${query} | n=${hrefs.length}${closest ? " CLOSEST" : ""}`;
  if (expected) {
    const rank = hrefs.findIndex((h) => expected.includes(h)) + 1;
    line += ` | GOLDEN rank=${rank || "miss"}`;
  }
  console.log(line);
  console.log("    " + hrefs.slice(0, 5).join(", "));
}
