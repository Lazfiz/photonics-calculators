import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Diversity Reception',
  description: 'Interactive Diversity Reception calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
