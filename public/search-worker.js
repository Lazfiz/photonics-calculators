import { pipeline, env } from "@huggingface/transformers";

// Skip local model check
env.allowLocalModels = false;

interface EmbeddingEntry {
  href: string;
  title: string;
  embedding: number[];
}

let _pipeline: any = null;
let _embeddings: EmbeddingEntry[] | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function getPipeline() {
  if (!_pipeline) {
    _pipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
    });
  }
  return _pipeline;
}

async function getEmbeddings(): Promise<EmbeddingEntry[]> {
  if (!_embeddings) {
    const res = await fetch("/search-embeddings.json");
    _embeddings = await res.json();
  }
  return _embeddings!;
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, payload } = event.data;
  try {
    if (type === "init") {
      self.postMessage({ type: "status", message: "Loading model..." });
      await getPipeline();
      self.postMessage({ type: "status", message: "Loading embeddings..." });
      const embs = await getEmbeddings();
      self.postMessage({ type: "ready", count: embs.length });
    } else if (type === "search") {
      if (!_pipeline || !_embeddings) {
        self.postMessage({ type: "error", message: "Not initialized" });
        return;
      }
      const output = await _pipeline(payload, { pooling: "mean", normalize: true });
      const queryEmb = Array.from(output.data) as number[];

      const excludeHrefs = new Set<string>();
      if (event.data.excludeHrefs) {
        for (const h of event.data.excludeHrefs) excludeHrefs.add(h);
      }

      const results = _embeddings
        .filter((e) => !excludeHrefs.has(e.href))
        .map((e) => ({ href: e.href, title: e.title, score: cosineSimilarity(queryEmb, e.embedding) }))
        .filter((r) => r.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      self.postMessage({ type: "results", results });
    }
  } catch (err: any) {
    self.postMessage({ type: "error", message: err?.message ?? String(err) });
  }
});
