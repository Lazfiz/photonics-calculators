"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface KeywordItem {
  title: string;
  href: string;
  description: string;
  category: string;
  tags: string[];
  priority: number;
}

function scoreKeyword(item: KeywordItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const href = item.href.toLowerCase();
  const category = item.category.toLowerCase();
  const tags = item.tags.map((t) => t.toLowerCase());
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);
  let score = item.priority;
  for (const term of terms) {
    if (title === term) score += 400;
    if (title.startsWith(term)) score += 220;
    if (title.includes(term)) score += 120;
    if (titleWords.some((w) => w === term)) score += 120;
    if (titleWords.some((w) => w.startsWith(term))) score += 80;
    if (category.includes(term)) score += 70;
    if (tags.some((t) => t === term)) score += 110;
    if (tags.some((t) => t.includes(term))) score += 70;
    if (href.includes(term)) score += 60;
    if (desc.includes(term)) score += 50;
  }
  return score;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<KeywordItem[]>([]);
  const [results, setResults] = useState<{ href: string; title: string; description?: string; category?: string }[]>([]);
  const [aiLabel, setAiLabel] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const aiReadyRef = useRef(false);
  const q = query.trim().toLowerCase();
  const terms = q.length > 0 ? q.split(/\s+/).filter(Boolean) : [];

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) setQuery(qParam);
  }, []);

  // Set up worker — following HuggingFace official pattern
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });

      workerRef.current.onmessage = (event) => {
        const { type, message, results, count } = event.data;
        if (type === "status") {
          setAiLabel(message);
        } else if (type === "ready") {
          aiReadyRef.current = true;
          setAiLabel(`✓ AI (${count} indexed)`);
        } else if (type === "results") {
          setResults((prev) => {
            const existingHrefs = new Set(prev.map((r) => r.href));
            const newResults = (results || [])
              .filter((r: any) => !existingHrefs.has(r.href))
              .map((r: any) => ({ href: r.href, title: r.title }));
            return [...prev, ...newResults].slice(0, 12);
          });
          setAiLabel("AI enhanced");
        } else if (type === "error") {
          console.warn("[semantic-search]", message);
          setAiLabel("");
        }
      };

      workerRef.current.onerror = (err) => {
        console.warn("[worker error]", err);
        setAiLabel("");
      };

      // Init the model
      workerRef.current.postMessage({ type: "init" });
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (terms.length === 0) { setResults([]); setAiLabel(""); return; }

    const kw = items
      .map((item) => ({ item, score: scoreKeyword(item, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    setResults(kw.map(({ item }) => ({ href: item.href, title: item.title, description: item.description, category: item.category })));

    if (q.length < 10 || !aiReadyRef.current || !workerRef.current) return;
    debounceRef.current = setTimeout(() => {
      const kwHrefs = kw.map((r) => r.item.href);
      workerRef.current?.postMessage({ type: "search", payload: q, excludeHrefs: kwHrefs });
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, terms, items]);

  const categoryColor: Record<string, string> = {
    "wave-optics": "text-blue-400", "fiber-optics": "text-cyan-400",
    "laser-safety": "text-red-400", "thin-film": "text-purple-400",
    "imaging": "text-green-400", "spectroscopy": "text-yellow-400",
    "detectors": "text-orange-400", "materials": "text-amber-400",
    "polarization": "text-pink-400", "free-space-comms": "text-teal-400",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-300">← Home</Link>
        </nav>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-gray-400 mb-8">Search across 524 photonics calculators. Try natural language like &quot;how far is my laser safe&quot; or &quot;fiber loss at 1550nm&quot;.</p>
        <div className="relative mb-6">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search calculators..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-white placeholder-gray-500 outline-none focus:border-blue-400"
            autoFocus
          />
          {aiLabel && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs text-blue-400">{aiLabel}</span>
            </div>
          )}
        </div>
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((r, idx) => (
              <Link key={r.href + idx} href={r.href}
                className="block rounded-lg px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{r.title}</span>
                  {r.category && <span className={`text-xs ${categoryColor[r.category] ?? "text-gray-500"}`}>{r.category.replace(/-/g, " ")}</span>}
                </div>
                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
              </Link>
            ))}
          </div>
        )}
        {query.length > 0 && results.length === 0 && (
          <p className="text-gray-500 text-sm">No results found.</p>
        )}
      </div>
    </main>
  );
}
