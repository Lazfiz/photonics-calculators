import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photonic Crystal',
  description: 'Interactive Photonic Crystal calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
