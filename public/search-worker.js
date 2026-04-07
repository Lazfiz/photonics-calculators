// Web Worker for semantic search — runs in isolated thread.
// Loads @huggingface/transformers from CDN.
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

async function loadScript(url: string): Promise<void> {
  // Load a script into the worker context
  const response = await fetch(url);
  const code = await response.text();
  // Use Function constructor to execute in worker global scope
  const fn = new Function(code);
  fn();
}

async function init(): Promise<void> {
  if (isReady) return;

  self.postMessage({ type: "status", message: "Downloading AI model..." });

  try {
    // Load transformers.js from CDN
    await loadScript("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1/dist/transformers.min.js");

    const Transformers = (self as any).Transformers;
    if (!Transformers || !Transformers.pipeline) {
      self.postMessage({ type: "error", message: "Transformers.pipeline not available after load" });
      return;
    }

    self.postMessage({ type: "status", message: "Loading embedding model..." });

    embedder = await Transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
    });

    self.postMessage({ type: "status", message: "Loading embeddings..." });

    const res = await fetch("/search-embeddings.json");
    embeddings = await res.json();

    isReady = true;
    self.postMessage({ type: "ready", count: embeddings.length });
  } catch (err: any) {
    self.postMessage({ type: "error", message: err?.message || "Unknown error loading model" });
  }
}

async function search(query: string): Promise<void> {
  if (!isReady || !embedder) return;

  try {
    const output = await embedder(query, { pooling: "mean", normalize: true });
    const queryEmb = Array.from(output.data) as number[];

    const scored = embeddings
      .map((entry) => ({
        href: entry.href,
        title: entry.title,
        score: cosineSimilarity(queryEmb, entry.embedding),
      }))
      .filter((r) => r.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    self.postMessage({ type: "results", results: scored });
  } catch (err: any) {
    self.postMessage({ type: "error", message: err?.message || "Search failed" });
  }
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
