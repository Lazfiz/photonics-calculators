import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Rare Earth Doped',
  description: 'Interactive Rare Earth Doped calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
