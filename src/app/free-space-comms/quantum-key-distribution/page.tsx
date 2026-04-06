import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Quantum Key Distribution',
  description: 'Interactive Quantum Key Distribution calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
