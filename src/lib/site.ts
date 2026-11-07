// The canonical origin: canonical tags, JSON-LD, the sitemap and robots.txt. next.config.mjs sends the old
// photonics-calculators.vercel.app host here with a 308.
export const SITE_URL = "https://photonicscalculators.com";

// IndexNow (Bing, Yandex, Seznam, Naver): public by design, served as /<key>.txt from public/ to prove the host is
// ours. scripts/indexnow.ts submits the sitemap's URLs with it after a release.
export const INDEXNOW_KEY = "d54b87c18bb336a8de8ed0206ffd8c51";
