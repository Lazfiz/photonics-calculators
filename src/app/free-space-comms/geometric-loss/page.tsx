import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Geometric Loss',
  description: 'Interactive Geometric Loss calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
