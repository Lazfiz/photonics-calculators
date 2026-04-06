import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Extended Source Correction (C₆)',
  description: 'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.'
};

export default function Page() {
  return <PageClient />;
}
