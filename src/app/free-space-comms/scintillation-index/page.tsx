import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Scintillation Index',
  description: 'Interactive Scintillation Index calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
