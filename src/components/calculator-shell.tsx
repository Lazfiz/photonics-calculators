import type { ReactNode } from "react";
import Link from "next/link";
import ErrorBoundary from "./error-boundary";
import { KnownIssueNotice, ModelBadge, ModelReferences } from "./model-references";
import RelatedCalculatorLinks, { type RelatedCalculatorItem } from "./related-calculator-links";
import ShareButton from "./share-button";
import { JsonLdScript } from "../lib/json-ld";
import { displayName, findCalculator, getCalculator, getCategory, type Calculator } from "../registry";
import { calculatorJsonLd } from "../registry/metadata";

interface CalculatorShellProps {
  /** The page's registry key, `/<category>/<slug>`. */
  href: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

/** The registry's hand-picked links (at most four), named and described by their targets. */
function relatedCalculators(calculator: Calculator): RelatedCalculatorItem[] {
  return (calculator.related ?? []).slice(0, 4).flatMap((link) => {
    const target = findCalculator(link.href);
    return target ? [{ href: target.href, label: displayName(target), desc: link.note ?? target.description }] : [];
  });
}

/**
 * The frame of every calculator page, rendered by its page.tsx around the client component: JSON-LD,
 * breadcrumbs, heading, lede, share button, model tier, the "Model and references" section and related
 * links, all from the registry entry. A server component: the registry stays out of client bundles.
 */
export default function CalculatorShell({ href, children, maxWidthClassName = "max-w-4xl" }: CalculatorShellProps) {
  const calculator = getCalculator(href);
  const category = getCategory(calculator.category);
  const title = displayName(calculator);
  const related = relatedCalculators(calculator);

  return (
    <>
      <JsonLdScript data={calculatorJsonLd(calculator)} />
      <main className="min-h-screen bg-gray-950 text-white p-6">
        <div className={`${maxWidthClassName} mx-auto`} role="region" aria-label={title}>
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-3">
            <ol className="flex flex-wrap items-center gap-1">
              {/* Every crumb is an ancestor, so each is a link; the page itself is the title. */}
              <li className="flex items-center gap-1">
                <Link href="/" className="hover:text-gray-300">Home</Link>
              </li>
              <li className="flex items-center gap-1">
                <span aria-hidden="true">›</span>
                <Link href={`/${category.id}`} className="hover:text-gray-300">{category.label}</Link>
              </li>
              <li className="flex items-center gap-1">
                <span aria-hidden="true">›</span>
                <span aria-current="page" className="text-gray-400">{title}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-gray-400 flex-1">{calculator.lede ?? calculator.description}</p>
            <ShareButton />
          </div>
          <p className="mb-4">
            <ModelBadge tier={calculator.tier} />
          </p>
          {calculator.knownIssue && <KnownIssueNotice text={calculator.knownIssue} />}
          <ErrorBoundary>{children}</ErrorBoundary>
          <ModelReferences calculator={calculator} />
          {related.length > 0 && <RelatedCalculatorLinks currentHref={href} items={related} />}
        </div>
      </main>
    </>
  );
}
