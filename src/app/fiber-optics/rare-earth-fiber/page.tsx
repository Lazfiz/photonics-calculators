import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Rare Earth Fiber',
  description: 'Interactive Rare Earth Fiber calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
