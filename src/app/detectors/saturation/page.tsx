import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Saturation',
  description: 'Interactive Saturation calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
