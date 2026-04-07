"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import ErrorBoundary from "./error-boundary";

interface CalculatorShellProps {
  title?: string;
  description?: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
      title="Copy URL"
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

export default function CalculatorShell({
  title,
  description,
  backHref,
  backLabel,
  children,
  maxWidthClassName = "max-w-4xl",
}: CalculatorShellProps) {
  // Build breadcrumb path from backHref: /fiber-optics → [{href: "/", label: "Home"}, {href: "/fiber-optics", label: "Fiber Optics"}]
  const segments = backHref.split("/").filter(Boolean);
  const breadcrumbs = [
    { href: "/", label: "Home" },
    ...segments.map((seg, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: seg.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    })),
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className={`${maxWidthClassName} mx-auto`} role="region" aria-label={title || "Calculator"}>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">›</span>}
                {i < breadcrumbs.length ? (
                  <Link href={crumb.href} className="hover:text-gray-300">{crumb.label}</Link>
                ) : (
                  <span className="text-gray-400">{crumb.label}</span>
                )}
              </li>
            ))}
            {title && (
              <>
                <span aria-hidden="true">›</span>
                <li className="text-gray-400">{title}</li>
              </>
            )}
          </ol>
        </nav>
        {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
        <div className="flex items-start justify-between gap-4 mb-2">
          {description && <p className="text-gray-400 flex-1">{description}</p>}
          <ShareButton />
        </div>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </main>
  );
}
