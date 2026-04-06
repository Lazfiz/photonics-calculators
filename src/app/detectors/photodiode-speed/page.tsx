import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photodiode Speed',
  description: 'Interactive Photodiode Speed calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
