"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SearchItem {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
  tags: string[];
  priority: number;
}

interface EmbeddingItem {
  href: string;
  title: string;
  embedding: number[];
}

function scoreKeyword(item: SearchItem, terms: string[]): number {
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

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

// Lazy-loaded transformers pipeline
let pipelinePromise: Promise<any> | null = null;
let embeddingsCache: EmbeddingItem[] | null = null;

function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = import("@huggingface/transformers").then(async ({ pipeline, env }) => {
      // Use WASM backend with browser cache for faster subsequent loads
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        { dtype: "fp32" }
      );
      return extractor;
    });
  }
  return pipelinePromise;
}

async function loadEmbeddings(): Promise<EmbeddingItem[]> {
  if (embeddingsCache) return embeddingsCache;
  const res = await fetch("/search-embeddings.json");
  embeddingsCache = await res.json();
  return embeddingsCache!;
}

async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const extractor = await getPipeline();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    // output is a Tensor, convert to array
    const data = output.tolist ? output.tolist()[0] : Array.from(output.data);
    // Normalize
    const norm = Math.sqrt(data.reduce((s: number, v: number) => s + v * v, 0));
    return norm > 0 ? data.map((v: number) => v / norm) : data;
  } catch {
    return null;
  }
}

function scoreSemantic(embeddings: EmbeddingItem[], queryEmbedding: number[], hrefSet: Set<string>): Map<string, number> {
  const scores = new Map<string, number>();
  for (const item of embeddings) {
    if (!hrefSet.has(item.href)) continue;
    const sim = cosineSimilarity(queryEmbedding, item.embedding);
    scores.set(item.href, sim);
  }
  return scores;
}

export default function SiteSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const q = query.trim().toLowerCase();
  const terms = q.length > 0 ? q.split(/\s+/).filter(Boolean) : [];

  // Fetch keyword search index
  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchItem[]) => setItems(data))
      .catch(() => {});
  }, []);

  // Cmd+K / Ctrl+K shortcut
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

  // Hybrid search: keyword (instant) + semantic (deferred)
  const runSearch = useCallback(
    async (searchTerms: string[], rawQuery: string) => {
      if (items.length === 0) return;

      // Instant keyword results
      const keywordScored = items
        .map((item) => ({ item, score: scoreKeyword(item, searchTerms) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
      setResults(keywordScored.slice(0, 12));

      // Skip semantic for very short queries (keyword is better)
      if (rawQuery.length < 8 || searchTerms.length === 0) return;

      // Lazy-load semantic model
      if (modelStatus === "idle") {
        setModelStatus("loading");
        // Load embeddings and model in parallel
        Promise.all([loadEmbeddings(), getPipeline()])
          .then(() => setModelStatus("ready"))
          .catch(() => setModelStatus("error"));
      }

      if (modelStatus !== "ready") return;

      try {
        const embeddings = await loadEmbeddings();
        const queryEmbedding = await embedQuery(rawQuery);
        if (!queryEmbedding) return;

        const hrefSet = new Set(items.map((i) => i.href));
        const semanticScores = scoreSemantic(embeddings, queryEmbedding, hrefSet);

        // Merge: semantic boosts keyword results + surfaces new ones
        const hrefSet2 = new Set(keywordScored.map((i) => i.href));
        const semanticResults: SearchItem[] = [];
        for (const item of items) {
          const semScore = semanticScores.get(item.href) ?? 0;
          if (semScore > 0.3 && !hrefSet2.has(item.href)) {
            semanticResults.push(item);
          }
        }
        semanticResults.sort((a, b) => (semanticScores.get(b.href) ?? 0) - (semanticScores.get(a.href) ?? 0));

        // Merge: keyword first, then semantic additions
        const merged = [...keywordScored, ...semanticResults].slice(0, 12);
        setResults(merged);
      } catch {
        // Semantic search failed — keyword results are still showing
      }
    },
    [items, modelStatus]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (terms.length === 0) {
      setResults([]);
      return;
    }
    // Show keyword results immediately
    const keywordResults = items
      .map((item) => ({ item, score: scoreKeyword(item, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
    setResults(keywordResults.slice(0, 12));

    // Then try semantic after 400ms
    debounceRef.current = setTimeout(() => {
      runSearch(terms, q);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, items, runSearch, terms]);

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
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 524 calculators... (Ctrl+K)"
          className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-12 pr-24 py-3 text-base text-white placeholder-gray-500 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {modelStatus === "loading" && (
            <span className="text-xs text-blue-400 animate-pulse">AI loading</span>
          )}
          {modelStatus === "ready" && (
            <span className="text-xs text-green-400">✓ AI</span>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-gray-600 px-1.5 py-0.5 text-xs text-gray-400">⌘K</kbd>
        </div>
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto py-2">
            {results.map((item, idx) => (
              <Link
                key={item.href + idx}
                href={item.href}
                onClick={() => { setQuery(""); setResults([]); }}
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
            {modelStatus === "ready" ? "semantic + keyword search" : "keyword search • type more for AI results"}
          </div>
        </div>
      )}
    </div>
  );
}
