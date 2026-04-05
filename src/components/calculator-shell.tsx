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
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className={`${maxWidthClassName} mx-auto`}>
        <Link href={backHref} className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← Back to {backLabel}
        </Link>
        {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
        {description && <p className="text-gray-400 mb-8">{description}</p>}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </main>
  );
}
