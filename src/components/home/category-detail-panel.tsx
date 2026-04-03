import Link from "next/link";
import type { HomeCategory } from "../../lib/home-categories";

export default function CategoryDetailPanel({
  category,
}: {
  category: HomeCategory;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
            {category.eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{category.title}</h3>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: `${category.accentFrom}55`,
            color: category.accentFrom,
            background: `${category.accentFrom}10`,
          }}
        >
          {category.count} calculators
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{category.hoverDescription}</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {category.examples.map((example) => (
          <div
            key={example}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
          >
            {example}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Explore the domain
        </p>
        <Link
          href={category.href}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          Open {category.title}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
