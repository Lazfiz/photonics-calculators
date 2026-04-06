import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Adaptive Optics',
  description: 'Interactive Adaptive Optics calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
