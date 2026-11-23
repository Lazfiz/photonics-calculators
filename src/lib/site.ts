// The canonical origin: canonical tags, JSON-LD, the sitemap and robots.txt. next.config.mjs sends the old
// photonics-calculators.vercel.app host here with a 308.
export const SITE_URL = "https://photonicscalculators.com";

// IndexNow (Bing, Yandex, Seznam, Naver): public by design, served as /<key>.txt from public/ to prove the host is
// ours. scripts/indexnow.ts submits the sitemap's URLs with it after a release.
export const INDEXNOW_KEY = "d54b87c18bb336a8de8ed0206ffd8c51";

// The public source repository (About page, footer, llms.txt, MCP error messages).
export const REPO_URL = "https://github.com/Lazfiz/photonics-calculators";

// Lattice, the photonic-crystal simulator (lattice-sim, owner decision A6): the home page's back-link card. Its own
// static site on Vercel; its MCP server is served here at /lattice/mcp.
export const LATTICE_URL = "https://lattice.photonicscalculators.com";
