"use client";

import type { ReactNode } from "react";
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
        {description && <p className="text-gray-400 mb-8">{description}</p>}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </main>
  );
}
