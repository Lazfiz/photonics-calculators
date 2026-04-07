"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface EmbeddingEntry {
  href: string;
  title: string;
  embedding: number[];
}

interface KeywordItem {
  title: string;
  href: string;
  description: string;
  category: string;
  tags: string[];
  priority: number;
}

interface SearchResult {
  href: string;
  title: string;
  description?: string;
  category?: string;
  semanticScore?: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
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
  const [embeddings, setEmbeddings] = useState<EmbeddingEntry[] | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [embedFn, setEmbedFn] = useState<((text: string) => Promise<number[] | null>) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const terms = q.length > 0 ? q.split(/\s+/).filter(Boolean) : [];

  // Load keyword index
  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  // Focus input on mount, read ?q= from URL
  useEffect(() => {
    inputRef.current?.focus();
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) setQuery(qParam);
  }, []);

  // Lazy-load semantic model
  const loadModel = useCallback(async () => {
    if (modelStatus !== "idle") return;
    setModelStatus("loading");
    try {
      // Load transformers.js from CDN
      if (!(window as any).Transformers) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1/dist/transformers.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load transformers.js"));
          document.head.appendChild(script);
        });
      }
      const { pipeline } = (window as any).Transformers;
      const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });

      const fn = async (text: string): Promise<number[] | null> => {
        try {
          const output = await extractor(text, { pooling: "mean", normalize: true });
          return Array.from(output.data) as number[];
        } catch { return null; }
      };
      setEmbedFn(() => fn);

      // Load embeddings
      const embs = await (await fetch("/search-embeddings.json")).json();
      setEmbeddings(embs);
      setModelStatus("ready");
    } catch (err: any) {
      console.warn("Semantic search init failed:", err);
      setModelStatus("error");
    }
  }, [modelStatus]);

  // Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (terms.length === 0) { setResults([]); return; }

    // Keyword results immediately
    const kw = items
      .map((item) => ({ item, score: scoreKeyword(item, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => ({ href: item.href, title: item.title, description: item.description, category: item.category }));
    setResults(kw.slice(0, 12));

    // Semantic for longer queries
    if (q.length < 8) return;
    debounceRef.current = setTimeout(async () => {
      if (modelStatus === "idle") await loadModel();
      if (!embedFn || !embeddings) return;
      const queryEmb = await embedFn(q);
      if (!queryEmb) return;
      const kwHrefs = new Set(kw.map((r) => r.href));
      const semResults = embeddings
        .filter((e) => !kwHrefs.has(e.href))
        .map((e) => ({ href: e.href, title: e.title, semanticScore: cosineSimilarity(queryEmb, e.embedding) }))
        .filter((r) => r.semanticScore > 0.3)
        .sort((a, b) => b.semanticScore - a.semanticScore)
        .map((r) => ({ href: r.href, title: r.title }));
      setResults([...kw.slice(0, 12), ...semResults].slice(0, 12));
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, terms, items, embeddings, embedFn, modelStatus, loadModel]);

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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {modelStatus === "loading" && <span className="text-xs text-blue-400 animate-pulse">AI loading</span>}
            {modelStatus === "ready" && <span className="text-xs text-green-400">✓ AI</span>}
          </div>
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
