"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchItem } from "../../lib/search-index";

export default function SiteSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return items.slice(0, 8);
    const terms = q.split(/\s+/).filter(Boolean);
    return items
      .filter((item) => {
        const haystack = `${item.title} ${item.description} ${item.href} ${item.category}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 10);
  }, [items, q]);

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <label htmlFor="site-search" className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
        Search calculators and categories
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Gaussian beam, Raman, MPE, fiber coupling…"
        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
      />
      <div className="mt-3 space-y-2">
        {results.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="mt-1 text-xs text-slate-400">{item.description}</div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                {item.kind}
              </span>
            </div>
          </Link>
        ))}
        {results.length === 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            No matches yet — try a category, formula, or topic.
          </div>
        )}
      </div>
    </div>
  );
}
