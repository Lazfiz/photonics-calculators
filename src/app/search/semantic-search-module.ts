// Semantic search module — loaded via dynamic import() ONLY when needed.
// This file is NEVER bundled with the main page. If it crashes, keyword
// search still works because the caller catches all errors.

interface EmbeddingEntry {
  href: string;
  title: string;
  embedding: number[];
}

let _embeddings: EmbeddingEntry[] | null = null;
let _pipeline: any = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function getPipeline(): Promise<any> {
  if (_pipeline) return _pipeline;

  // Load script if not already loaded
  const win = window as any;
  if (!win.Transformers) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1/dist/transformers.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("CDN load failed"));
      document.head.appendChild(s);
    });
  }

  _pipeline = await win.Transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "fp32",
  });
  return _pipeline;
}

async function getEmbeddings(): Promise<EmbeddingEntry[]> {
  if (_embeddings) return _embeddings;
  const res = await fetch("/search-embeddings.json");
  _embeddings = await res.json();
  return _embeddings!;
}

export async function performSemanticSearch(
  query: string,
  excludeHrefs: Set<string>
): Promise<{ href: string; title: string }[]> {
  const [pipeline, embeddings] = await Promise.all([getPipeline(), getEmbeddings()]);

  const output = await pipeline(query, { pooling: "mean", normalize: true });
  const queryEmb = Array.from(output.data) as number[];

  return embeddings
    .filter((e) => !excludeHrefs.has(e.href))
    .map((e) => ({
      href: e.href,
      title: e.title,
      score: cosineSimilarity(queryEmb, e.embedding),
    }))
    .filter((r) => r.score > 0.3)
    .sort((a, b) => (b as any).score - (a as any).score)
    .map(({ href, title }) => ({ href, title }));
}
