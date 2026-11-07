import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

/**
 * AI crawlers and assistant fetchers, named so that a site owner's or host's default block for them doesn't apply:
 * OpenAI, Anthropic, Perplexity, Google and Apple training opt-ins, ByteDance, Baidu and Common Crawl.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Baiduspider",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
