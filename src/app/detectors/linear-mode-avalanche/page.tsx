import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Linear Mode Avalanche',
  description: 'Interactive Linear Mode Avalanche calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
