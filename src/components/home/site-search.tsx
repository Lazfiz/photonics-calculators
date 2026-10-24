"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { searchItems, type SearchItem } from "../../lib/site-search";

export default function SiteSearch({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchItem[]) => setItems(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        inputRef.current?.blur();
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = items ? searchItems(items, query) : [];
  const noMatch = items !== null && query.trim() !== "" && results.length === 0;

  const categoryColor: Record<string, string> = {
    "wave-optics": "text-blue-400",
    "fiber-optics": "text-cyan-400",
    "laser-safety": "text-red-400",
    "thin-film": "text-purple-400",
    "imaging": "text-green-400",
    "spectroscopy": "text-yellow-400",
    "detectors": "text-orange-400",
    "materials": "text-amber-400",
    "polarization": "text-pink-400",
    "free-space-comms": "text-teal-400",
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total} calculators... (Ctrl+K)`}
          className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-12 pr-16 py-3 text-base text-white placeholder-gray-500 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-gray-600 px-1.5 py-0.5 text-xs text-gray-400">⌘K</kbd>
      </div>

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto py-2">
            {results.map((item, idx) => (
              <Link
                key={item.href + idx}
                href={item.href}
                onClick={() => { setQuery(""); }}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{item.title}</span>
                    <span className={`text-xs ${categoryColor[item.category] ?? "text-gray-500"}`}>
                      {item.category.replace(/-/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t border-white/5 px-4 py-2 text-xs text-gray-600">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
      {noMatch && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/50 px-4 py-3 text-sm text-gray-400">
          No calculator matches every word of &ldquo;{query.trim()}&rdquo;.
        </div>
      )}
    </div>
  );
}
