// Debug: confirm worker loads at all
self.postMessage({ type: "status", message: "Worker spawned" });

try {
  self.postMessage({ type: "status", message: "Fetching transformers.js..." });
  const response = await fetch("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1/dist/transformers.min.js");
  self.postMessage({ type: "status", message: `Fetched: ${response.status} ${response.ok}` });
  
  if (!response.ok) {
    self.postMessage({ type: "error", message: `CDN fetch failed: ${response.status}` });
    // stop here
  } else {
    const code = await response.text();
    self.postMessage({ type: "status", message: `Code length: ${code.length}` });
    
    // eval runs in global scope in workers, unlike new Function
    self.eval(code);
    self.postMessage({ type: "status", message: `Transformers loaded: ${!!self.Transformers}` });
  }
} catch (err: any) {
  self.postMessage({ type: "error", message: `Init error: ${err.message}` });
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { type } = event.data;
  if (type === "search") {
    self.postMessage({ type: "status", message: "Search requested but model not ready" });
  }
});
