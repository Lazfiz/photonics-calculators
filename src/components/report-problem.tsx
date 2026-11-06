"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { currentQuery } from "@/lib/url-state-store";
import { REPORT_LIMITS } from "@/lib/report";

const ISSUES_URL = "https://github.com/Lazfiz/photonics-calculators/issues/new";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string }
  /** The route isn't configured (a preview build) or the email failed: offer a GitHub issue instead. */
  | { kind: "fallback"; issueUrl: string };

interface ReportProblemProps {
  /** Starts expanded (the About page); calculator pages show only the summary line. */
  open?: boolean;
}

/**
 * "Report a problem": posts the page, its current inputs and the message to `/api/report`, which emails
 * them. The page never shows the recipient address.
 */
export default function ReportProblem({ open = false }: ReportProblemProps) {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "sending" });
    const query = currentQuery(pathname);
    const issueBody = `Page: ${window.location.origin}${pathname}${query ? `?${query}` : ""}\n\n${message}`;
    const fallback = {
      kind: "fallback",
      issueUrl: `${ISSUES_URL}?${new URLSearchParams({ title: `Problem report: ${pathname}`, body: issueBody })}`,
    } as const;
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ href: pathname, query, message, contact, website }),
      });
      if (res.ok) {
        setStatus({ kind: "sent" });
        setMessage("");
        return;
      }
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 429) {
        setStatus({ kind: "error", message: data.error ?? "The report couldn't be sent." });
      } else {
        setStatus(fallback);
      }
    } catch {
      setStatus(fallback);
    }
  }

  return (
    // A click on the summary before hydration toggles `open` natively; that isn't a mismatch worth a warning.
    <details id="report" open={open} suppressHydrationWarning className="mt-8 scroll-mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm">
      <summary className="cursor-pointer text-gray-300 hover:text-white">Report a problem</summary>
      {status.kind === "sent" ? (
        <p className="mt-3 text-green-400" role="status">
          Thank you. The report was sent, with this page and its current inputs.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <p className="text-gray-400">
            A wrong value, a formula, a reference, or a page that misbehaves. The report includes this page and its
            current inputs.
          </p>
          <label className="block">
            <span className="text-gray-300">What&apos;s wrong?</span>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={REPORT_LIMITS.minMessage}
              maxLength={REPORT_LIMITS.maxMessage}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-gray-300">Your email (optional, only to reply)</span>
            <input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={REPORT_LIMITS.maxContact}
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>
          {/* Honeypot: hidden from people and screen readers; bots fill every field. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {status.kind === "sending" ? "Sending…" : "Send report"}
            </button>
            {status.kind === "error" && (
              <p className="text-red-400" role="alert">
                {status.message}
              </p>
            )}
          </div>
          {status.kind === "fallback" && (
            <p className="text-yellow-300" role="alert">
              The report form isn&apos;t available right now. Please{" "}
              <a href={status.issueUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                open an issue on GitHub
              </a>{" "}
              instead; your message is filled in.
            </p>
          )}
        </form>
      )}
    </details>
  );
}
