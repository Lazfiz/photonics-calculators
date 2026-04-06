import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Chromatic Dispersion (CD)',
  description: 'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.'
};

export default function Page() {
  return <PageClient />;
}
