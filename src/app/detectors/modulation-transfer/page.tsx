import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Modulation Transfer',
  description: 'Interactive Modulation Transfer calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
