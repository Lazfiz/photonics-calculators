// /llms.txt (https://llmstxt.org): a Markdown map of the site for language models and AI agents, generated from the
// registry. Server-side only.
import { SITE_URL } from "../lib/site";
import { schemas } from "../schemas";
import { apiPath } from "./api";
import { calculators, categories } from "./index";
import { TIERS, UNREVIEWED, tierInfo } from "./tiers";

export const REPO_URL = "https://github.com/Lazfiz/photonics-calculators";

export function buildLlmsTxt(): string {
  const listed = calculators.filter((calculator) => !calculator.hidden);
  const tiers = [...Object.values(TIERS), UNREVIEWED].map((tier) => `  - ${tier.label}: ${tier.definition}`);
  const lines = [
    "# Photonics Calculators",
    "",
    `> ${listed.length} free, open-source interactive calculators for optics and photonics: ` +
      `${categories.map((category) => category.label).join(", ")}. Each page shows its formulas, its results ` +
      "at the default inputs, a model tier and the references the model was checked against.",
    "",
    "- The calculators run in the browser. The HTML a crawler fetches shows each page at its default inputs; a " +
      "shared link carries other inputs in the URL query, which only the browser applies.",
    `- Model tier: how far a page's model can be trusted, set by a physics audit (${SITE_URL}/about#model-tiers).`,
    ...tiers,
    `- How the calculators are checked (tests, blind audit): ${SITE_URL}/about#verification`,
    `- JSON API (${schemas.length} calculators so far): GET ${SITE_URL}${apiPath("/<category>/<slug>")} with the ` +
      `page's URL query, e.g. ${SITE_URL}${apiPath("/wave-optics/gaussian-beam")}?wavelength=1064&waist=500&z=100. ` +
      `Inputs, units, ranges and outputs: ${SITE_URL}/openapi.json. Each result carries the model tier and references.`,
    `- MCP server (streamable HTTP, no key): ${SITE_URL}/mcp, with the tools find_calculator, run_calculator, ` +
      `get_checks and report_problem. Claude Code: \`claude mcp add --transport http photonics ${SITE_URL}/mcp\`.`,
    `- Reference cases with this deployment's results: ${SITE_URL}/checks.json. Please check results that matter ` +
      "against the cited source or your own calculation, and report a disagreement (report_problem, or the form).",
    `- Source code: ${REPO_URL}`,
    '- Mistakes: the "Report a problem" form at the bottom of each calculator page.',
    '- How to cite: "<calculator title>. Photonics Calculators. <page URL> (accessed <date>)." For the physics, ' +
      "cite the references the page lists.",
  ];
  for (const category of categories) {
    lines.push("", `## ${category.label}`, "", category.description, "");
    for (const calculator of listed.filter((c) => c.category === category.id)) {
      lines.push(
        `- [${calculator.title}](${SITE_URL}${calculator.href}): ${calculator.description} ` +
          `(${tierInfo(calculator.tier).label})`,
      );
    }
  }
  return lines.join("\n") + "\n";
}
