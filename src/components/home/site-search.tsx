"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchItem } from "../../lib/search-index";

function scoreItem(item: SearchItem, terms: string[]) {
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const href = item.href.toLowerCase();
  const category = item.category.toLowerCase();
  const tags = item.tags.map((tag) => tag.toLowerCase());
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);

  let score = item.priority;

  for (const term of terms) {
    if (title === term) score += 400;
    if (title.startsWith(term)) score += 220;
    if (title.includes(term)) score += 120;
    if (titleWords.some((word) => word === term)) score += 120;
    if (titleWords.some((word) => word.startsWith(term))) score += 80;
    if (category.includes(term)) score += 70;
    if (tags.some((tag) => tag === term)) score += 110;
    if (tags.some((tag) => tag.includes(term))) score += 70;
    if (href.includes(term)) score += 60;
    if (desc.includes(term)) score += 50;
  }

  return score;
}

export default function SiteSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!q) {
      return [...items]
        .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
        .slice(0, 8);
    }

    const terms = q.split(/\s+/).filter(Boolean);
    return items
      .map((item) => ({ item, score: scoreItem(item, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 10)
      .map(({ item }) => item);
  }, [items, q]);

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor="site-search" className="block text-xs uppercase tracking-[0.22em] text-slate-500">
          Search calculators and categories
        </label>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Cmd/Ctrl + K
        </span>
      </div>
      <input
        ref={inputRef}
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Gaussian beam, Raman, MPE, fiber coupling…"
        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
      />
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{q ? `${results.length} ranked result${results.length === 1 ? "" : "s"}` : "Top results and flagship pages"}</span>
        {q && <span>Scored by title, tags, category, and flagship priority</span>}
      </div>
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {item.category}
                  </span>
                  {item.priority >= 90 && (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                      flagship
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                {item.kind}
              </span>
            </div>
          </Link>
        ))}
        {results.length === 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            No matches yet — try a calculator name, topic, formula, or category.
          </div>
        )}
      </div>
    </div>
  );
}
