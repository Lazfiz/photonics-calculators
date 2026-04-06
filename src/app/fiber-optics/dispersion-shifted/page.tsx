import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Dispersion Shifted',
  description: 'Interactive Dispersion Shifted calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
