// Check references on Crossref and print one short line each, so a citation can be verified without fetching pages.
//   node scripts/crossref.mjs 10.1364/JOSA.66.000216 10.1201/b10436-9    # by DOI
//   node scripts/crossref.mjs -q "Marcuse curvature loss formula optical fibers"   # search: top 3 matches
// Line: DOI | type | year | authors | title | container volume(issue):pages
const API = "https://api.crossref.org/works";
const HEADERS = { "User-Agent": "photonics-calculators reference check (https://photonics-calculators.vercel.app)" };

function line(work) {
  const authors = (work.author ?? []).map((a) => a.family ?? a.name ?? "?");
  const who = authors.length > 3 ? `${authors.slice(0, 3).join(", ")} et al.` : authors.join(", ") || "-";
  const year = work.issued?.["date-parts"]?.[0]?.[0] ?? "?";
  const where = [
    work["container-title"]?.[0] ?? "",
    work.volume ? ` ${work.volume}` : "",
    work.issue ? `(${work.issue})` : "",
    work.page ? `:${work.page}` : "",
  ].join("");
  return `${work.DOI} | ${work.type} | ${year} | ${who} | ${work.title?.[0] ?? "-"} | ${where || "-"}`;
}

async function get(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) return { error: `HTTP ${response.status}` };
  return { body: await response.json() };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/crossref.mjs <doi> … | -q "<citation text>"');
  process.exit(2);
}
let failed = false;
if (args[0] === "-q") {
  const query = encodeURIComponent(args.slice(1).join(" "));
  const { body, error } = await get(`${API}?query.bibliographic=${query}&rows=3`);
  if (error) {
    console.log(`search: ${error}`);
    failed = true;
  } else {
    for (const work of body.message.items) console.log(line(work));
  }
} else {
  for (const raw of args) {
    const doi = raw.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
    const { body, error } = await get(`${API}/${encodeURIComponent(doi)}`);
    if (error) {
      console.log(`${doi} | NOT FOUND (${error})`);
      failed = true;
    } else {
      console.log(line(body.message));
    }
  }
}
process.exit(failed ? 1 : 0);
