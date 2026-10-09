import Link from "next/link";
import type { Calculator } from "../registry";
import { tierInfo } from "../registry/tiers";
import type { ModelTier } from "../registry/types";

const BADGE_STYLES: Record<ModelTier | "unreviewed", string> = {
  exact: "border-emerald-700/70 bg-emerald-950/60 text-emerald-300",
  textbook: "border-sky-700/70 bg-sky-950/60 text-sky-300",
  illustrative: "border-amber-700/70 bg-amber-950/60 text-amber-300",
  unreviewed: "border-gray-700 bg-gray-900 text-gray-400",
};

/** "doi:10.…" for a DOI link, else the host name. */
export function referenceLinkText(url: string): string {
  const doi = url.match(/^https:\/\/doi\.org\/(10\..+)$/);
  return doi ? `doi:${decodeURIComponent(doi[1])}` : new URL(url).hostname.replace(/^www\./, "");
}

/** The tier pill under the lede. It jumps to the page's "Model and references" section. */
export function ModelBadge({ tier }: { tier?: ModelTier }) {
  return (
    <a
      href="#model"
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium hover:brightness-125 ${BADGE_STYLES[tier ?? "unreviewed"]}`}
    >
      Model: {tierInfo(tier).label}
    </a>
  );
}

/** The section after the calculator: the tier and what it means, the model's assumptions, the sources. */
export function ModelReferences({ calculator }: { calculator: Calculator }) {
  const info = tierInfo(calculator.tier);
  const references = calculator.references ?? [];
  return (
    <section
      id="model"
      aria-labelledby="model-heading"
      className="mt-8 scroll-mt-6 rounded-xl border border-gray-800 bg-gray-900/80 p-4 text-sm"
    >
      <h2 id="model-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
        Model and references
      </h2>
      <p className="mt-3 text-gray-300">
        <span className="font-semibold text-white">{info.label}.</span> {info.definition}{" "}
        <Link href="/about#model-tiers" className="text-blue-400 hover:text-blue-300">
          About the tiers
        </Link>
      </p>
      {calculator.modelNote && <p className="mt-2 text-gray-300">{calculator.modelNote}</p>}
      {references.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-gray-400">
          {references.map((reference) => (
            <li key={reference.citation}>
              {reference.citation}
              {reference.url && (
                <>
                  {" "}
                  <a href={reference.url} rel="noopener noreferrer" className="break-all text-blue-400 hover:text-blue-300">
                    {referenceLinkText(reference.url)}
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
