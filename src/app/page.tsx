import Link from "next/link";
import AboutFooter from "./about-footer";
import PhotonicsHeroMap from "../components/home/photonics-hero-map";
import {
  homeCategories,
  totalCalculatorCount,
} from "../lib/home-categories";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#040712] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_22%),radial-gradient(circle_at_85%_18%,rgba(192,132,252,0.10),transparent_18%),linear-gradient(180deg,#050816_0%,#040712_100%)]" />

      <section className="px-6 pb-14 pt-12 mx-auto max-w-7xl sm:pt-16 lg:px-8 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] xl:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              Digital optics bench
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              Route light through the core domains of photonics.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Explore a desktop-first optical map where a coherent beam splits into spectroscopy,
              imaging, and thin-film pathways — then dive into a larger library of {totalCalculatorCount}
              {" "}calculators spanning wave optics, detectors, fiber systems, safety, and more.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/spectroscopy"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Explore spectroscopy
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="#all-categories"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Browse all categories
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-2xl font-semibold text-white">{totalCalculatorCount}</p>
                <p className="mt-1 text-sm text-slate-400">Interactive calculators</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-2xl font-semibold text-white">10</p>
                <p className="mt-1 text-sm text-slate-400">Photonics domains</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-2xl font-semibold text-white">SVG</p>
                <p className="mt-1 text-sm text-slate-400">Interactive optical hero</p>
              </div>
            </div>
          </div>

          <div>
            <PhotonicsHeroMap />
          </div>
        </div>
      </section>

      <section id="all-categories" className="px-6 pb-24 mx-auto max-w-7xl lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Full library</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              All photonics categories
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            The hero maps three flagship pathways today. The full library below keeps every domain one click
            away while the homepage evolves into a richer optical navigation surface.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {homeCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    {category.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{category.title}</h3>
                </div>
                <div
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: `${category.accentFrom}55`,
                    color: category.accentFrom,
                    background: `${category.accentFrom}14`,
                  }}
                >
                  {category.count}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{category.description}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{category.hoverDescription}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {category.examples.slice(0, 3).map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
                  >
                    {example}
                  </span>
                ))}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white group-hover:text-slate-200">
                Open {category.title}
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <AboutFooter />
    </main>
  );
}
