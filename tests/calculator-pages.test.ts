import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { ModelBadge, ModelReferences, referenceLinkText } from "../src/components/model-references";
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

// Synthetic trust data, so these tests don't change as audits fill in the registry.
const audited = {
  ...getCalculator("/fiber-optics/chromatic-dispersion"),
  tier: "textbook" as const,
  modelNote: "Linear dispersion only.",
  references: [
    { citation: "Agrawal G. P. (2021). Fiber-Optic Communication Systems, 5th ed., §2.4. Wiley." },
    { citation: "Example A. (2000). A paper on <dispersion>. J. Ex. 1, 2.", url: "https://doi.org/10.1000/x%3Cy%3E" },
  ],
};

test("calculatorJsonLd lists the references as citations, with a url only where the entry has one", () => {
  const graph = (calculatorJsonLd(audited) as { "@graph": Record<string, unknown>[] })["@graph"];
  assert.deepEqual(graph[0].citation, [
    { "@type": "CreativeWork", name: audited.references[0].citation },
    { "@type": "CreativeWork", name: audited.references[1].citation, url: audited.references[1].url },
  ]);
  assert.equal("citation" in (calculatorJsonLd(getCalculator("/fiber-optics/chromatic-dispersion")) as { "@graph": object[] })["@graph"][0], false);
});

test("the model badge and section: tier, definition, note and numbered references; unreviewed without a tier", () => {
  assert.equal(referenceLinkText("https://doi.org/10.1000/x%3Cy%3E"), "doi:10.1000/x<y>");
  assert.equal(referenceLinkText("https://www.icnirp.org/cms/upload/a.pdf"), "icnirp.org");

  const html = renderToStaticMarkup(createElement(ModelReferences, { calculator: audited }));
  assert.match(html, /^<section id="model" aria-labelledby="model-heading"/);
  assert.match(html, /<h2 id="model-heading"[^>]*>Model and references<\/h2>/);
  assert.match(html, /Textbook approximation\.<\/span> A standard approximation/);
  assert.match(html, /href="\/about#model-tiers"/);
  assert.match(html, /<p[^>]*>Linear dispersion only\.<\/p>/);
  assert.match(html, /<ol[^>]*><li>Agrawal G\. P\. \(2021\)[^<]*<\/li><li>Example A\. \(2000\)\. A paper on &lt;dispersion&gt;/);
  assert.match(html, /<a href="https:\/\/doi\.org\/10\.1000\/x%3Cy%3E" rel="noopener noreferrer"[^>]*>doi:10\.1000\/x&lt;y&gt;<\/a>/);
  assert.match(renderToStaticMarkup(createElement(ModelBadge, { tier: "textbook" })), /href="#model"[^>]*>Model: Textbook approximation</);

  const unreviewed = getCalculator("/fiber-optics/chromatic-dispersion");
  const plain = renderToStaticMarkup(createElement(ModelReferences, { calculator: { ...unreviewed, tier: undefined, references: undefined, modelNote: undefined } }));
  assert.match(plain, /Not yet reviewed\.<\/span> This page&#x27;s model hasn&#x27;t been checked/);
  assert.doesNotMatch(plain, /<ol|<p[^>]*>Linear/);
  assert.match(renderToStaticMarkup(createElement(ModelBadge, {})), />Model: Not yet reviewed</);
});
