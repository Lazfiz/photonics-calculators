import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Phase Correction Methods',
  description: 'Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
};

export default function Page() {
  return <PageClient />;
}
