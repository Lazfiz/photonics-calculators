import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Scanned Beam MPE',
  description: 'Interactive Scanned Beam MPE calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
