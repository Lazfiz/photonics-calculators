import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Bandwidth Calculation',
  description: 'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.'
};

export default function Page() {
  return <PageClient />;
}
