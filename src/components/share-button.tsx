"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { currentQuery, subscribe } from "@/lib/url-state-store";

/** Shown once the page has URL params; copies the link that reproduces the inputs. */
export default function ShareButton() {
  const pathname = usePathname();
  // Prerender and hydration see no params (as `useURLState` does); the real query follows right
  // after hydration and on every input change.
  const query = useSyncExternalStore(subscribe, () => currentQuery(pathname), () => "");
  const [copied, setCopied] = useState(false);
  if (!query) return null;
  return (
    <button
      onClick={() => {
        const url = `${window.location.origin}${pathname}?${query}${window.location.hash}`;
        // The clipboard API is missing or blocked in insecure contexts; the address bar still has the link.
        navigator.clipboard?.writeText(url).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          },
          () => {}
        );
      }}
      className="shrink-0 mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
      title="Copy URL with current settings"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share
        </>
      )}
    </button>
  );
}
