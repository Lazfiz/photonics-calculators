// After a release: tell IndexNow (Bing, which feeds ChatGPT search, Copilot and DuckDuckGo; Yandex; Seznam; Naver)
// about every URL in the live sitemap. Checks first that the key file is live. Prints one line; exit 1 on a failure.
//   node --import tsx scripts/indexnow.ts [--dry-run]
import { INDEXNOW_KEY, SITE_URL } from "../src/lib/site";

const dryRun = process.argv.includes("--dry-run");
const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

async function main(): Promise<void> {
  const key = await fetch(keyLocation);
  if (!key.ok || (await key.text()).trim() !== INDEXNOW_KEY) {
    throw new Error(`${keyLocation} doesn't serve the key (HTTP ${key.status}): release first`);
  }
  const sitemap = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (urlList.length === 0) throw new Error("The sitemap has no <loc> entries");
  if (dryRun) {
    console.log(`dry run: ${urlList.length} URLs, key file live`);
    return;
  }
  // One request takes up to 10 000 URLs.
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation, urlList }),
  });
  // 200 OK and 202 Accepted (key validation pending) are both successes.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow answered HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  console.log(`IndexNow: ${urlList.length} URLs submitted (HTTP ${res.status})`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
