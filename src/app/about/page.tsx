import type { Metadata } from "next";
import Link from "next/link";
import { totalCalculatorCount } from "../../lib/home-categories";
import { calculators } from "../../registry";
import { TIERS, UNREVIEWED, type TierInfo } from "../../registry/tiers";
import type { ModelTier } from "../../registry/types";

export const metadata: Metadata = {
  alternates: { canonical: "https://photonics-calculators.vercel.app/about" },
  title: "About",
  description: "A free, open-source collection of interactive optics and photonics calculators.",
};

const tierRows: (TierInfo & { count: number })[] = [
  ...(Object.keys(TIERS) as ModelTier[]).map((tier) => ({
    ...TIERS[tier],
    count: calculators.filter((c) => c.tier === tier).length,
  })),
  { ...UNREVIEWED, count: calculators.filter((c) => !c.tier).length },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-300">
      <div className="px-6 py-16 mx-auto max-w-3xl sm:py-24">
        <Link
          href="/"
          className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
        >
          ← Back to Calculators
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-white sm:text-4xl">
          About Photonics Calculators
        </h1>

        <section className="mt-8 space-y-4">
          <p>
            Photonics Calculators is a free, open-source collection of {totalCalculatorCount}
            interactive tools covering the breadth of optics and photonics — from
            laser safety and fiber optics to thin-film coatings, wave optics, and
            free-space communications.
          </p>
          <p>
            Each calculator provides real-time computation with interactive
            Plotly.js charts where applicable. The goal is to make common
            photonics calculations accessible without needing MATLAB, Python, or
            proprietary software.
          </p>
          <p>
            Built by a photonics engineer who got tired of reaching for a
            spreadsheet every time they needed a quick NOHD or ABCD matrix
            calculation.
          </p>
        </section>

        <section id="model-tiers" className="mt-12 scroll-mt-6">
          <h2 className="text-2xl font-semibold text-white">Model Tiers</h2>
          <p className="mt-4 text-sm text-gray-400">
            Each calculator page shows how far its model can be trusted, and the references it was checked
            against. The pages are being reviewed one by one.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {tierRows.map((row) => (
              <div key={row.label}>
                <dt className="font-medium text-white">
                  {row.label} <span className="font-normal text-gray-500">({row.count} pages)</span>
                </dt>
                <dd className="text-gray-400">{row.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-white">Physics References</h2>
          <p className="mt-4 text-sm text-gray-400">
            The underlying physics and formulas in these calculators are based on
            standard optics and photonics references:
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <span className="text-white font-medium">
                Saleh, B. E. A. & Teich, M. C.
              </span>{" "}
              — <em>Fundamentals of Photonics</em>, 3rd Ed. (2023)
            </li>
            <li>
              <span className="text-white font-medium">Hecht, E.</span> —{" "}
              <em>Optics</em>, 5th Ed. (2016)
            </li>
            <li>
              <span className="text-white font-medium">
                Born, M. & Wolf, E.
              </span>{" "}
              — <em>Principles of Optics</em>, 7th Ed. (1999)
            </li>
            <li>
              <span className="text-white font-medium">Siegman, A. E.</span> —{" "}
              <em>Lasers</em> (1986)
            </li>
            <li>
              <span className="text-white font-medium">Agrawal, G. P.</span> —{" "}
              <em>Fiber-Optic Communication Systems</em>, 5th Ed. (2021)
            </li>
            <li>
              <span className="text-white font-medium">MacLeod, H. A.</span> —{" "}
              <em>Thin-Film Optical Filters</em>, 4th Ed. (2010)
            </li>
            <li>
              <span className="text-white font-medium">IEC 60825-1</span> —{" "}
              Safety of laser products
            </li>
            <li>
              <span className="text-white font-medium">ANSI Z136.1</span> —{" "}
              American National Standard for Safe Use of Lasers
            </li>
          </ul>
        </section>

        <section className="mt-12 p-6 bg-yellow-900/20 border border-yellow-800/50 rounded-xl">
          <h2 className="text-xl font-semibold text-yellow-300">⚠️ Disclaimer</h2>
          <p className="mt-3 text-sm leading-relaxed text-yellow-200/80">
            These calculators are provided for <strong>educational and reference
            purposes only</strong>. While every effort has been made to implement
            formulas accurately, they should not be used as the sole basis for
            safety-critical decisions — especially laser safety classifications,
            optical component specifications, or any calculation where errors
            could result in personal injury or equipment damage.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-yellow-200/80">
            Always verify results against official standards (IEC 60825-1, ANSI
            Z136.1), manufacturer datasheets, and consult a qualified laser
            safety officer or optical engineer for critical applications.
          </p>
        </section>

        <section className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
          >
            Browse All {totalCalculatorCount} Calculators
          </Link>
        </section>
      </div>
    </main>
  );
}
