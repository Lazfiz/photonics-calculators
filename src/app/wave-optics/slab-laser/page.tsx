import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Slab Laser',
  description: 'Interactive Slab Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
