/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Use webpack instead of Turbopack — required for Web Worker bundling
  // with @huggingface/transformers ONNX WASM files
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

module.exports = nextConfig;
