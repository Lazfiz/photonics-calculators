import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

import { jsonLdHtml } from "../src/lib/json-ld";
import { getCalculator } from "../src/registry";
import { calculatorJsonLd, calculatorMetadata, SITE_URL } from "../src/registry/metadata";

// Each page.tsx names its registry key and nothing else; CalculatorShell renders the text, metadata
// and JSON-LD from the entry. 6929ab07 once corrupted 427 hand-written copies with a regex.
const pages = execFileSync("git", ["ls-files", "src/app/*/*/page.tsx"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

function parse(file: string) {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

test("calculator pages have a full set of page.tsx files", () => {
  assert.ok(pages.length >= 450, `only ${pages.length} pages found`);
});

test("each page.tsx passes its own href to calculatorMetadata and CalculatorShell, and no text", () => {
  const bad: string[] = [];
  for (const file of pages) {
    const [, category, slug] = /^src\/app\/([^/]+)\/([^/]+)\/page\.tsx$/.exec(file)!;
    let href: string | undefined;
    let metadataFromHref = false;
    let shellHref = false;
    const strings: string[] = [];
    walk(parse(file), (n) => {
      if (ts.isVariableDeclaration(n) && n.initializer) {
        const name = n.name.getText();
        if (name === "href" && ts.isStringLiteral(n.initializer)) href = n.initializer.text;
        if (name === "metadata") metadataFromHref = n.initializer.getText() === "calculatorMetadata(href)";
      }
      if (ts.isJsxOpeningElement(n) && n.tagName.getText() === "CalculatorShell") {
        shellHref = n.attributes.properties.some((a) => a.getText() === "href={href}");
      }
      if (ts.isStringLiteral(n) && !ts.isImportDeclaration(n.parent) && !ts.isJsxAttribute(n.parent)) strings.push(n.text);
    });
    if (href !== `/${category}/${slug}`) bad.push(`${file}: href ${href}`);
    if (!metadataFromHref) bad.push(`${file}: metadata isn't calculatorMetadata(href)`);
    if (!shellHref) bad.push(`${file}: no <CalculatorShell href={href}>`);
    if (strings.length !== 1) bad.push(`${file}: string literals besides href: ${strings.slice(1).join(" | ")}`);
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} pages failed`);
});

test("no page-client.tsx renders its own <h1>", () => {
  const clients = execFileSync("git", ["ls-files", "src/app/*/*/page-client.tsx"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const withH1 = clients.filter((file) => {
    let found = false;
    walk(parse(file), (n) => {
      if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText() === "h1") found = true;
    });
    return found;
  });
  assert.deepEqual(withH1, []);
});

test("calculatorMetadata: canonical, title and description from the entry", () => {
  assert.deepEqual(calculatorMetadata("/fiber-optics/chromatic-dispersion"), {
    alternates: { canonical: "https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion" },
    title: "Chromatic Dispersion Calculator",
    description: "Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.",
  });
  assert.throws(() => calculatorMetadata("/fiber-optics/no-such-page"));
});

test("calculatorJsonLd: WebPage and a breadcrumb that matches the page, no FAQ", () => {
  const calculator = getCalculator("/fiber-optics/chromatic-dispersion");
  const url = `${SITE_URL}/fiber-optics/chromatic-dispersion`;
  assert.deepEqual(calculatorJsonLd(calculator), {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Chromatic Dispersion Calculator",
        description: "Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.",
        url,
        isPartOf: { "@type": "WebSite", name: "Photonics Calculators", url: SITE_URL },
        about: { "@type": "Thing", name: "Fiber Optics" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Fiber Optics", item: `${SITE_URL}/fiber-optics` },
          // The visible heading, not the <title>.
          { "@type": "ListItem", position: 3, name: "Chromatic Dispersion (CD)", item: url },
        ],
      },
    ],
  });
  // One spelling of the category everywhere (the old pages said "Free Space Comms").
  const fso = JSON.stringify(calculatorJsonLd(getCalculator("/free-space-comms/link-budget")));
  assert.match(fso, /"name":"Free-Space Comms"/);
  assert.doesNotMatch(fso, /FAQPage|Free Space Comms/);
});

test("jsonLdHtml escapes < so a string can't close the script tag", () => {
  const html = jsonLdHtml({ name: "a</script><script>alert(1)</script>" });
  assert.doesNotMatch(html, /</);
  assert.deepEqual(JSON.parse(html), { name: "a</script><script>alert(1)</script>" });
});
