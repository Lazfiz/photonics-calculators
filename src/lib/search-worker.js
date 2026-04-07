// Web Worker for semantic search — runs in isolated thread.
// Loads @huggingface/transformers from CDN via importScripts (classic worker).
// If ANY step fails, keyword search still works on the main thread.

interface EmbeddingEntry {
  href: string;
  title: string;
  embedding: number[];
}

let embedder: any = null;
let embeddings: EmbeddingEntry[] = [];
let isReady = false;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function init(): Promise<void> {
  if (isReady) return;

  // Load @huggingface/transformers from CDN into the worker
  // Using the IIFE bundle which exposes window.Transformers
  importScripts("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1/dist/transformers.min.js");

  const { pipeline } = (self as any).Transformers;
  if (!pipeline) {
    self.postMessage({ type: "error", message: "Transformers.pipeline not found" });
    return;
  }

  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "fp32",
  });

  const res = await fetch("/search-embeddings.json");
  embeddings = await res.json();

  isReady = true;
  self.postMessage({ type: "ready", count: embeddings.length });
}

async function search(query: string): Promise<void> {
  if (!isReady || !embedder) return;

  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmb = Array.from(output.data) as number[];

  // Score all embeddings
  const scored = embeddings
    .map((entry) => ({
      href: entry.href,
      title: entry.title,
      score: cosineSimilarity(queryEmb, entry.embedding),
    }))
    .filter((r) => r.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // return more than needed, main thread will merge

  self.postMessage({ type: "results", results: scored });
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, payload } = event.data;
  try {
    if (type === "init") await init();
    else if (type === "search") await search(payload);
  } catch (err: any) {
    self.postMessage({ type: "error", message: err?.message ?? String(err) });
  }
});
