import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "src", "app");
const outDir = path.join(repoRoot, "src", "generated");
const outFile = path.join(outDir, "search-index.json");

const hiddenSearchRoutes = new Set([
  "/laser-safety/classification",
  "/laser-safety/pulsed-mpe",
  "/laser-safety/scanned-mpe",
  "/laser-safety/scanning-mpe",
  "/laser-safety/lidar-safety",
  "/laser-safety/interlock-design",
  "/laser-safety/multiple-pulse",
]);

const categoryKeywords = {
  detectors: ["sensor", "noise", "qe", "responsivity", "nep", "detectivity"],
  "fiber-optics": ["fiber", "mfd", "na", "dispersion", "splice", "coupling"],
  "free-space-comms": ["fso", "link budget", "fog", "scintillation", "pointing"],
  imaging: ["resolution", "na", "microscopy", "airy", "mtf", "psf"],
  "laser-safety": ["laser safety", "mpe", "nohd", "od", "eyewear", "hazard"],
  materials: ["sellmeier", "dispersion", "glass", "index", "material properties"],
  polarization: ["stokes", "jones", "mueller", "waveplate", "polarizer"],
  spectroscopy: ["beer lambert", "ftir", "blackbody", "raman", "wavenumber"],
  "thin-film": ["coating", "ar", "dielectric stack", "bragg", "reflectance"],
  "wave-optics": ["gaussian beam", "abcd", "cavity", "mode matching", "diffraction"],
};

const routeKeywords = {
  "/wave-optics/gaussian-beam": ["rayleigh range", "beam waist", "divergence"],
  "/fiber-optics/coupling-efficiency": ["fiber coupling", "alignment", "insertion loss"],
  "/thin-film/single-ar": ["anti reflection", "quarter wave", "fresnel"],
  "/spectroscopy/blackbody": ["planck", "wien", "stefan boltzmann", "thermal radiation"],
  "/spectroscopy/ftir-resolution": ["interferometer", "opd", "apodization", "resolution"],
  "/spectroscopy/lambert-beer-law": ["absorbance", "optical density", "transmission"],
  "/imaging/airy-disk": ["diffraction limit", "abbe", "spot size"],
  "/materials/sellmeier": ["dispersion formula", "refractive index", "glass catalog"],
  "/polarization/stokes": ["poincare sphere", "polarization state", "stokes vector"],
  "/laser-safety/mpe": ["maximum permissible exposure"],
  "/laser-safety/nohd": ["nominal ocular hazard distance"],
  "/laser-safety/optical-density": ["laser eyewear", "od calculator"],
};

const priorityByHref = {
  "/wave-optics/gaussian-beam": 100,
  "/fiber-optics/coupling-efficiency": 98,
  "/thin-film/single-ar": 98,
  "/spectroscopy/blackbody": 96,
  "/spectroscopy/ftir-resolution": 96,
  "/spectroscopy/lambert-beer-law": 94,
  "/imaging/airy-disk": 94,
  "/materials/sellmeier": 94,
  "/polarization/stokes": 94,
  "/laser-safety/mpe": 92,
  "/laser-safety/nohd": 90,
  "/laser-safety/optical-density": 88,
  "/laser-safety/od-requirements": 86,
  "/laser-safety/viewing-distance": 84,
  "/spectroscopy": 60,
  "/wave-optics": 60,
  "/thin-film": 60,
  "/fiber-optics": 60,
  "/imaging": 60,
  "/materials": 60,
  "/polarization": 60,
  "/laser-safety": 55,
  "/": 50,
};

function titleFromPath(route) {
  return route
    .split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "Home";
}

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function extract(content, patterns) {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))];
}

function scan(dir, prefix = "") {
  const items = [];
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith("_") || entry.startsWith("(")) continue;
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) continue;

    const route = `${prefix}/${entry}`;
    const pageFile = path.join(fullPath, "page.tsx");
    const pageClientFile = path.join(fullPath, "page-client.tsx");
    const content = `${readIfExists(pageFile)}\n${readIfExists(pageClientFile)}`;

    if (content.trim()) {
      const title = extract(content, [
        /export const metadata:[\s\S]*?title:\s*"([^"]+)"/,
        /export const metadata:[\s\S]*?title:\s*'([^']+)'/,
        /<CalculatorShell[\s\S]*?title="([^"]+)"/,
        /title="([^"]+)"/,
        /<h1[^>]*>([^<]+)<\/h1>/,
      ]) ?? titleFromPath(route);

      const description = extract(content, [
        /export const metadata:[\s\S]*?description:\s*"([^"]+)"/,
        /export const metadata:[\s\S]*?description:\s*'([^']+)'/,
        /<CalculatorShell[\s\S]*?description="([^"]+)"/,
        /description="([^"]+)"/,
        /<p className="text-gray-400[^"]*">([^<]+)<\/p>/,
      ]) ?? `Open ${titleFromPath(route)}.`;

      const kind = prefix ? "page" : "category";
      const category = prefix ? prefix.replace(/^\//, "") : entry;
      const tags = uniqueStrings([
        category,
        entry,
        ...(categoryKeywords[category] ?? []),
        ...(routeKeywords[route] ?? []),
      ]);

      items.push({
        title,
        href: route,
        description,
        kind,
        category,
        tags,
        priority: priorityByHref[route] ?? (kind === "category" ? 40 : 50),
      });
    }

    items.push(...scan(fullPath, route));
  }
  return items;
}

const items = scan(appDir)
  .filter((item) => item.href !== "/_not-found")
  .filter((item) => !hiddenSearchRoutes.has(item.href))
  .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(items, null, 2)}\n`);
console.log(`Wrote ${items.length} search items to ${path.relative(repoRoot, outFile)}`);
